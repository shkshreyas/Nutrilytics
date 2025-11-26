import { getVertexAI, getGenerativeModel } from '@firebase/ai';
import { app, firestore } from '../lib/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    orderBy,
    limit,
    Timestamp,
    addDoc,
    where,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface Meal {
    id: string;
    name: string;
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    ingredients: string[];
    instructions: string[];
    nutrition: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
    };
    prepTime: number; // minutes
    cuisine: string;
}

export interface DayPlan {
    date: Date;
    meals: {
        breakfast: Meal;
        lunch: Meal;
        dinner: Meal;
        snack1: Meal;
        snack2: Meal;
    };
    totalNutrition: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
}

export interface MealPlan {
    id: string;
    userId: string;
    weekOf: Date;
    days: DayPlan[];
    createdAt: Date;
    isFavorite: boolean;
}

export interface UserContext {
    allergens: string[];
    healthGoal: 'weight_loss' | 'muscle_gain' | 'maintenance' | null;
    dietaryPreferences: string[];
    language: string;
    name?: string;
}

interface MacroTargets {
    proteinPercent: number;
    carbsPercent: number;
    fatPercent: number;
    totalCalories: number;
}

// ============================================================================
// Meal Plan Service
// ============================================================================

export class MealPlanService {
    private static vertexAI = getVertexAI(app);
    private static model = getGenerativeModel(MealPlanService.vertexAI, {
        model: 'gemini-1.5-flash',
    });

    private static readonly MAX_RETRIES = 3;
    private static readonly RETRY_DELAY = 1000;
    private static readonly CACHE_KEY = 'cached_meal_plans';
    private static readonly CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

    // Macro targets based on health goals
    private static readonly MACRO_TARGETS = {
        weight_loss: { proteinPercent: 40, carbsPercent: 30, fatPercent: 30, totalCalories: 1800 },
        muscle_gain: { proteinPercent: 30, carbsPercent: 45, fatPercent: 25, totalCalories: 2500 },
        maintenance: { proteinPercent: 25, carbsPercent: 45, fatPercent: 30, totalCalories: 2000 },
    };

    // ============================================================================
    // Public Methods
    // ============================================================================

    /**
     * Generate a 7-day meal plan for a user
     */
    static async generateMealPlan(userId: string): Promise<MealPlan> {
        try {
            // Load user context
            const userContext = await this.loadUserContext(userId);

            // Get macro targets based on health goal
            const macroTargets = this.getMacroTargets(userContext.healthGoal);

            // Generate meal plan using AI
            const days = await this.generateWeeklyMeals(userContext, macroTargets);

            // Create meal plan object
            const mealPlan: MealPlan = {
                id: this.generatePlanId(),
                userId,
                weekOf: this.getStartOfWeek(),
                days,
                createdAt: new Date(),
                isFavorite: false,
            };

            // Save to Firestore
            await this.saveMealPlan(mealPlan);

            // Cache locally
            await this.cacheMealPlan(mealPlan);

            return mealPlan;
        } catch (error) {
            console.error('Error generating meal plan:', error);
            throw new Error('Failed to generate meal plan. Please try again.');
        }
    }

    /**
     * Regenerate a specific meal in a plan
     */
    static async regenerateMeal(
        planId: string,
        dayIndex: number,
        mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack1' | 'snack2'
    ): Promise<Meal> {
        try {
            // Get the existing plan
            const plan = await this.getMealPlanById(planId);
            if (!plan) {
                throw new Error('Meal plan not found');
            }

            // Load user context
            const userContext = await this.loadUserContext(plan.userId);

            // Get macro targets
            const macroTargets = this.getMacroTargets(userContext.healthGoal);

            // Calculate target calories for this meal type
            const mealCalories = this.getMealCalorieTarget(mealType, macroTargets.totalCalories);

            // Generate new meal
            const newMeal = await this.generateSingleMeal(
                userContext,
                macroTargets,
                mealType,
                mealCalories
            );

            // Update the plan
            plan.days[dayIndex].meals[mealType] = newMeal;

            // Recalculate day totals
            plan.days[dayIndex].totalNutrition = this.calculateDayTotals(plan.days[dayIndex].meals);

            // Save updated plan
            await this.saveMealPlan(plan);

            // Update cache
            await this.cacheMealPlan(plan);

            return newMeal;
        } catch (error) {
            console.error('Error regenerating meal:', error);
            throw new Error('Failed to regenerate meal. Please try again.');
        }
    }

    /**
     * Get all meal plans for a user
     */
    static async getMealPlans(userId: string): Promise<MealPlan[]> {
        try {
            const plansRef = collection(firestore, 'users', userId, 'mealPlans');
            const q = query(plansRef, orderBy('createdAt', 'desc'), limit(20));
            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.map((doc) => this.convertFirestoreToMealPlan(doc));
        } catch (error) {
            console.error('Error fetching meal plans:', error);
            // Try to return cached plans
            return await this.getCachedMealPlans();
        }
    }

    /**
     * Get a specific meal plan by ID
     */
    static async getMealPlanById(planId: string): Promise<MealPlan | null> {
        try {
            // Extract userId from planId (format: userId_timestamp_random)
            const parts = planId.split('_');
            if (parts.length < 2) {
                throw new Error('Invalid plan ID format');
            }

            // Try to find the plan in Firestore
            const usersRef = collection(firestore, 'users');
            const usersSnapshot = await getDocs(usersRef);

            for (const userDoc of usersSnapshot.docs) {
                const planRef = doc(firestore, 'users', userDoc.id, 'mealPlans', planId);
                const planDoc = await getDoc(planRef);

                if (planDoc.exists()) {
                    return this.convertFirestoreToMealPlan(planDoc);
                }
            }

            return null;
        } catch (error) {
            console.error('Error fetching meal plan:', error);
            return null;
        }
    }

    /**
     * Toggle favorite status of a meal plan
     */
    static async toggleFavorite(userId: string, planId: string): Promise<void> {
        try {
            const planRef = doc(firestore, 'users', userId, 'mealPlans', planId);
            const planDoc = await getDoc(planRef);

            if (!planDoc.exists()) {
                throw new Error('Meal plan not found');
            }

            const currentFavorite = planDoc.data().isFavorite || false;
            await updateDoc(planRef, {
                isFavorite: !currentFavorite,
            });

            // Update cache
            const cachedPlans = await this.getCachedMealPlans();
            const updatedPlans = cachedPlans.map((plan) =>
                plan.id === planId ? { ...plan, isFavorite: !currentFavorite } : plan
            );
            await this.setCachedMealPlans(updatedPlans);
        } catch (error) {
            console.error('Error toggling favorite:', error);
            throw error;
        }
    }

    /**
     * Delete a meal plan
     */
    static async deleteMealPlan(userId: string, planId: string): Promise<void> {
        try {
            const planRef = doc(firestore, 'users', userId, 'mealPlans', planId);
            await updateDoc(planRef, {
                deleted: true,
                deletedAt: Timestamp.now(),
            });

            // Remove from cache
            const cachedPlans = await this.getCachedMealPlans();
            const updatedPlans = cachedPlans.filter((plan) => plan.id !== planId);
            await this.setCachedMealPlans(updatedPlans);
        } catch (error) {
            console.error('Error deleting meal plan:', error);
            throw error;
        }
    }

    // ============================================================================
    // Private Methods - User Context
    // ============================================================================

    /**
     * Load user context for personalization
     */
    private static async loadUserContext(userId: string): Promise<UserContext> {
        try {
            const userDoc = await getDoc(doc(firestore, 'users', userId));

            if (!userDoc.exists()) {
                return this.getDefaultUserContext();
            }

            const userData = userDoc.data();

            return {
                allergens: userData.allergens || [],
                healthGoal: userData.healthGoal || null,
                dietaryPreferences: userData.dietaryPreferences || [],
                language: userData.language || 'en',
                name: userData.name,
            };
        } catch (error) {
            console.error('Error loading user context:', error);
            return this.getDefaultUserContext();
        }
    }

    /**
     * Get default user context
     */
    private static getDefaultUserContext(): UserContext {
        return {
            allergens: [],
            healthGoal: null,
            dietaryPreferences: [],
            language: 'en',
        };
    }

    // ============================================================================
    // Private Methods - Macro Calculations
    // ============================================================================

    /**
     * Get macro targets based on health goal
     */
    private static getMacroTargets(healthGoal: string | null): MacroTargets {
        if (!healthGoal || !(healthGoal in this.MACRO_TARGETS)) {
            return this.MACRO_TARGETS.maintenance;
        }
        return this.MACRO_TARGETS[healthGoal as keyof typeof this.MACRO_TARGETS];
    }

    /**
     * Get calorie target for a specific meal type
     */
    private static getMealCalorieTarget(
        mealType: string,
        totalCalories: number
    ): number {
        const mealDistribution = {
            breakfast: 0.25,
            lunch: 0.35,
            dinner: 0.30,
            snack1: 0.05,
            snack2: 0.05,
        };

        return Math.round(totalCalories * (mealDistribution[mealType as keyof typeof mealDistribution] || 0.2));
    }

    /**
     * Calculate total nutrition for a day
     */
    private static calculateDayTotals(meals: any): {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    } {
        const totals = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
        };

        Object.values(meals).forEach((meal: any) => {
            if (meal && meal.nutrition) {
                totals.calories += meal.nutrition.calories || 0;
                totals.protein += meal.nutrition.protein || 0;
                totals.carbs += meal.nutrition.carbs || 0;
                totals.fat += meal.nutrition.fat || 0;
            }
        });

        return totals;
    }

    // ============================================================================
    // Private Methods - AI Generation
    // ============================================================================

    /**
     * Generate meals for a full week
     */
    private static async generateWeeklyMeals(
        userContext: UserContext,
        macroTargets: MacroTargets
    ): Promise<DayPlan[]> {
        const days: DayPlan[] = [];
        const startDate = this.getStartOfWeek();

        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(startDate);
            dayDate.setDate(startDate.getDate() + i);

            const meals = await this.generateDayMeals(userContext, macroTargets, i);

            const dayPlan: DayPlan = {
                date: dayDate,
                meals,
                totalNutrition: this.calculateDayTotals(meals),
            };

            days.push(dayPlan);
        }

        return days;
    }

    /**
     * Generate all meals for a single day
     */
    private static async generateDayMeals(
        userContext: UserContext,
        macroTargets: MacroTargets,
        dayIndex: number
    ): Promise<any> {
        const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2'];
        const meals: any = {};

        // Generate prompt for the entire day
        const prompt = this.buildDayMealPrompt(userContext, macroTargets, dayIndex);

        try {
            const result = await this.generateWithRetry(prompt);
            const parsedMeals = this.parseMealPlanResponse(result);

            // Assign meals to the day
            mealTypes.forEach((type) => {
                meals[type] = parsedMeals[type] || this.getDefaultMeal(type);
            });

            return meals;
        } catch (error) {
            console.error('Error generating day meals:', error);
            // Return default meals if generation fails
            mealTypes.forEach((type) => {
                meals[type] = this.getDefaultMeal(type);
            });
            return meals;
        }
    }

    /**
     * Generate a single meal
     */
    private static async generateSingleMeal(
        userContext: UserContext,
        macroTargets: MacroTargets,
        mealType: string,
        targetCalories: number
    ): Promise<Meal> {
        const prompt = this.buildSingleMealPrompt(
            userContext,
            macroTargets,
            mealType,
            targetCalories
        );

        try {
            const result = await this.generateWithRetry(prompt);
            const meal = this.parseSingleMealResponse(result, mealType);
            return meal;
        } catch (error) {
            console.error('Error generating single meal:', error);
            return this.getDefaultMeal(mealType);
        }
    }

    /**
     * Generate AI response with retry logic
     */
    private static async generateWithRetry(prompt: string, retryCount = 0): Promise<string> {
        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            if (retryCount < this.MAX_RETRIES) {
                console.log(`Retrying AI request (attempt ${retryCount + 1}/${this.MAX_RETRIES})...`);
                await this.delay(this.RETRY_DELAY * Math.pow(2, retryCount));
                return this.generateWithRetry(prompt, retryCount + 1);
            }
            throw error;
        }
    }

    // ============================================================================
    // Private Methods - Prompt Building
    // ============================================================================

    /**
     * Build prompt for generating a full day of meals
     */
    private static buildDayMealPrompt(
        userContext: UserContext,
        macroTargets: MacroTargets,
        dayIndex: number
    ): string {
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const dayName = dayNames[dayIndex];

        let prompt = `Generate a complete meal plan for ${dayName} with the following requirements:

CRITICAL ALLERGEN RESTRICTIONS:
${userContext.allergens.length > 0
                ? `NEVER include these allergens: ${userContext.allergens.join(', ')}. Double-check all ingredients.`
                : 'No allergen restrictions.'}

NUTRITION TARGETS:
- Total daily calories: ${macroTargets.totalCalories} kcal
- Protein: ${macroTargets.proteinPercent}% (${Math.round(macroTargets.totalCalories * macroTargets.proteinPercent / 100 / 4)}g)
- Carbs: ${macroTargets.carbsPercent}% (${Math.round(macroTargets.totalCalories * macroTargets.carbsPercent / 100 / 4)}g)
- Fat: ${macroTargets.fatPercent}% (${Math.round(macroTargets.totalCalories * macroTargets.fatPercent / 100 / 9)}g)

MEAL BREAKDOWN:
- Breakfast: ${this.getMealCalorieTarget('breakfast', macroTargets.totalCalories)} kcal
- Lunch: ${this.getMealCalorieTarget('lunch', macroTargets.totalCalories)} kcal
- Dinner: ${this.getMealCalorieTarget('dinner', macroTargets.totalCalories)} kcal
- Snack 1: ${this.getMealCalorieTarget('snack1', macroTargets.totalCalories)} kcal
- Snack 2: ${this.getMealCalorieTarget('snack2', macroTargets.totalCalories)} kcal

`;

        if (userContext.dietaryPreferences.length > 0) {
            prompt += `DIETARY PREFERENCES: ${userContext.dietaryPreferences.join(', ')}\n\n`;
        }

        if (userContext.language && userContext.language !== 'en') {
            prompt += `Include regional ${this.getLanguageCuisine(userContext.language)} dishes where appropriate.\n\n`;
        }

        prompt += `Return the meal plan as a JSON object with this exact structure:
{
  "breakfast": {
    "name": "Meal name",
    "ingredients": ["ingredient1", "ingredient2"],
    "instructions": ["step1", "step2"],
    "nutrition": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0},
    "prepTime": 0,
    "cuisine": "cuisine type"
  },
  "lunch": { ... },
  "dinner": { ... },
  "snack1": { ... },
  "snack2": { ... }
}

Make meals practical, delicious, and easy to prepare. Ensure variety and balance.`;

        return prompt;
    }

    /**
     * Build prompt for generating a single meal
     */
    private static buildSingleMealPrompt(
        userContext: UserContext,
        macroTargets: MacroTargets,
        mealType: string,
        targetCalories: number
    ): string {
        let prompt = `Generate a ${mealType} meal with the following requirements:

CRITICAL ALLERGEN RESTRICTIONS:
${userContext.allergens.length > 0
                ? `NEVER include these allergens: ${userContext.allergens.join(', ')}. Double-check all ingredients.`
                : 'No allergen restrictions.'}

NUTRITION TARGETS:
- Calories: ${targetCalories} kcal
- Protein: ${macroTargets.proteinPercent}%
- Carbs: ${macroTargets.carbsPercent}%
- Fat: ${macroTargets.fatPercent}%

`;

        if (userContext.dietaryPreferences.length > 0) {
            prompt += `DIETARY PREFERENCES: ${userContext.dietaryPreferences.join(', ')}\n\n`;
        }

        if (userContext.language && userContext.language !== 'en') {
            prompt += `Consider regional ${this.getLanguageCuisine(userContext.language)} dishes.\n\n`;
        }

        prompt += `Return the meal as a JSON object with this exact structure:
{
  "name": "Meal name",
  "ingredients": ["ingredient1", "ingredient2"],
  "instructions": ["step1", "step2"],
  "nutrition": {"calories": ${targetCalories}, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0},
  "prepTime": 0,
  "cuisine": "cuisine type"
}

Make it practical, delicious, and easy to prepare.`;

        return prompt;
    }

    /**
     * Get cuisine type based on language
     */
    private static getLanguageCuisine(language: string): string {
        const cuisineMap: Record<string, string> = {
            hi: 'North Indian',
            ta: 'South Indian (Tamil)',
            te: 'South Indian (Telugu)',
            bn: 'Bengali',
            mr: 'Maharashtrian',
        };
        return cuisineMap[language] || 'Indian';
    }

    // ============================================================================
    // Private Methods - Response Parsing
    // ============================================================================

    /**
     * Parse AI response for full day meal plan
     */
    private static parseMealPlanResponse(response: string): any {
        try {
            // Extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // Validate and add IDs to meals
            const meals: any = {};
            const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2'];

            mealTypes.forEach((type) => {
                if (parsed[type]) {
                    meals[type] = {
                        id: this.generateMealId(),
                        type: type.startsWith('snack') ? 'snack' : type,
                        ...parsed[type],
                    };
                }
            });

            return meals;
        } catch (error) {
            console.error('Error parsing meal plan response:', error);
            throw error;
        }
    }

    /**
     * Parse AI response for single meal
     */
    private static parseSingleMealResponse(response: string, mealType: string): Meal {
        try {
            // Extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);

            return {
                id: this.generateMealId(),
                type: mealType.startsWith('snack') ? 'snack' : (mealType as any),
                ...parsed,
            };
        } catch (error) {
            console.error('Error parsing single meal response:', error);
            throw error;
        }
    }

    // ============================================================================
    // Private Methods - Firestore Operations
    // ============================================================================

    /**
     * Save meal plan to Firestore
     */
    private static async saveMealPlan(plan: MealPlan): Promise<void> {
        try {
            const planRef = doc(firestore, 'users', plan.userId, 'mealPlans', plan.id);

            const planData = {
                weekOf: Timestamp.fromDate(plan.weekOf),
                days: plan.days.map((day) => ({
                    date: Timestamp.fromDate(day.date),
                    meals: day.meals,
                    totalNutrition: day.totalNutrition,
                })),
                createdAt: Timestamp.fromDate(plan.createdAt),
                isFavorite: plan.isFavorite,
            };

            await setDoc(planRef, planData, { merge: true });
        } catch (error) {
            console.error('Error saving meal plan:', error);
            throw error;
        }
    }

    /**
     * Convert Firestore document to MealPlan object
     */
    private static convertFirestoreToMealPlan(doc: any): MealPlan {
        const data = doc.data();
        return {
            id: doc.id,
            userId: doc.ref.parent.parent?.id || '',
            weekOf: data.weekOf?.toDate() || new Date(),
            days: data.days.map((day: any) => ({
                date: day.date?.toDate() || new Date(),
                meals: day.meals,
                totalNutrition: day.totalNutrition,
            })),
            createdAt: data.createdAt?.toDate() || new Date(),
            isFavorite: data.isFavorite || false,
        };
    }

    // ============================================================================
    // Private Methods - Local Caching
    // ============================================================================

    /**
     * Cache meal plan locally for offline access
     */
    private static async cacheMealPlan(plan: MealPlan): Promise<void> {
        try {
            const cachedPlans = await this.getCachedMealPlans();

            // Add or update plan in cache
            const existingIndex = cachedPlans.findIndex((p) => p.id === plan.id);
            if (existingIndex >= 0) {
                cachedPlans[existingIndex] = plan;
            } else {
                cachedPlans.unshift(plan);
            }

            // Keep only last 10 plans
            const trimmedPlans = cachedPlans.slice(0, 10);

            await this.setCachedMealPlans(trimmedPlans);
        } catch (error) {
            console.error('Error caching meal plan:', error);
        }
    }

    /**
     * Get cached meal plans
     */
    private static async getCachedMealPlans(): Promise<MealPlan[]> {
        try {
            const cached = await AsyncStorage.getItem(this.CACHE_KEY);
            if (!cached) {
                return [];
            }

            const parsed = JSON.parse(cached);

            // Convert date strings back to Date objects
            return parsed.map((plan: any) => ({
                ...plan,
                weekOf: new Date(plan.weekOf),
                createdAt: new Date(plan.createdAt),
                days: plan.days.map((day: any) => ({
                    ...day,
                    date: new Date(day.date),
                })),
            }));
        } catch (error) {
            console.error('Error getting cached meal plans:', error);
            return [];
        }
    }

    /**
     * Set cached meal plans
     */
    private static async setCachedMealPlans(plans: MealPlan[]): Promise<void> {
        try {
            await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(plans));
        } catch (error) {
            console.error('Error setting cached meal plans:', error);
        }
    }

    /**
     * Clear cached meal plans
     */
    static async clearCache(): Promise<void> {
        try {
            await AsyncStorage.removeItem(this.CACHE_KEY);
        } catch (error) {
            console.error('Error clearing meal plan cache:', error);
        }
    }

    // ============================================================================
    // Private Methods - Utilities
    // ============================================================================

    /**
     * Generate unique plan ID
     */
    private static generatePlanId(): string {
        return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate unique meal ID
     */
    private static generateMealId(): string {
        return `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get start of current week (Monday)
     */
    private static getStartOfWeek(): Date {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        const monday = new Date(now.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    }

    /**
     * Delay helper for retry logic
     */
    private static delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Get default meal when generation fails
     */
    private static getDefaultMeal(mealType: string): Meal {
        const defaultMeals: Record<string, Meal> = {
            breakfast: {
                id: this.generateMealId(),
                name: 'Oatmeal with Fruits',
                type: 'breakfast',
                ingredients: ['Rolled oats', 'Banana', 'Berries', 'Honey', 'Almond milk'],
                instructions: [
                    'Cook oats with almond milk',
                    'Top with sliced banana and berries',
                    'Drizzle with honey',
                ],
                nutrition: {
                    calories: 350,
                    protein: 10,
                    carbs: 60,
                    fat: 8,
                    fiber: 8,
                },
                prepTime: 10,
                cuisine: 'International',
            },
            lunch: {
                id: this.generateMealId(),
                name: 'Grilled Chicken Salad',
                type: 'lunch',
                ingredients: [
                    'Chicken breast',
                    'Mixed greens',
                    'Cherry tomatoes',
                    'Cucumber',
                    'Olive oil',
                    'Lemon',
                ],
                instructions: [
                    'Grill chicken breast',
                    'Chop vegetables',
                    'Mix greens and vegetables',
                    'Top with sliced chicken',
                    'Dress with olive oil and lemon',
                ],
                nutrition: {
                    calories: 450,
                    protein: 40,
                    carbs: 20,
                    fat: 22,
                    fiber: 6,
                },
                prepTime: 20,
                cuisine: 'International',
            },
            dinner: {
                id: this.generateMealId(),
                name: 'Baked Salmon with Vegetables',
                type: 'dinner',
                ingredients: [
                    'Salmon fillet',
                    'Broccoli',
                    'Carrots',
                    'Olive oil',
                    'Garlic',
                    'Lemon',
                ],
                instructions: [
                    'Preheat oven to 400°F',
                    'Season salmon with garlic and lemon',
                    'Arrange vegetables around salmon',
                    'Drizzle with olive oil',
                    'Bake for 20 minutes',
                ],
                nutrition: {
                    calories: 500,
                    protein: 45,
                    carbs: 25,
                    fat: 25,
                    fiber: 8,
                },
                prepTime: 30,
                cuisine: 'International',
            },
            snack1: {
                id: this.generateMealId(),
                name: 'Greek Yogurt with Nuts',
                type: 'snack',
                ingredients: ['Greek yogurt', 'Mixed nuts', 'Honey'],
                instructions: ['Mix yogurt with nuts', 'Drizzle with honey'],
                nutrition: {
                    calories: 200,
                    protein: 15,
                    carbs: 15,
                    fat: 10,
                    fiber: 2,
                },
                prepTime: 5,
                cuisine: 'International',
            },
            snack2: {
                id: this.generateMealId(),
                name: 'Apple with Almond Butter',
                type: 'snack',
                ingredients: ['Apple', 'Almond butter'],
                instructions: ['Slice apple', 'Serve with almond butter for dipping'],
                nutrition: {
                    calories: 180,
                    protein: 5,
                    carbs: 25,
                    fat: 8,
                    fiber: 5,
                },
                prepTime: 5,
                cuisine: 'International',
            },
        };

        return defaultMeals[mealType] || defaultMeals.breakfast;
    }
}
