/**
 * MealPlanViewerExample Component
 * Example usage of the MealPlanViewer component with mock data
 */

import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { MealPlanViewer } from './MealPlanViewer';
import { MealPlan, MealPlanService } from '@/services/mealPlanService';

export const MealPlanViewerExample: React.FC = () => {
    const [mealPlan, setMealPlan] = useState<MealPlan>(getMockMealPlan());

    const handleRegenerateMeal = async (dayIndex: number, mealType: string) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // In a real app, this would call MealPlanService.regenerateMeal
        Alert.alert('Success', `Regenerated ${mealType} for day ${dayIndex + 1}`);
    };

    const handleSaveFavorite = () => {
        setMealPlan((prev) => ({
            ...prev,
            isFavorite: !prev.isFavorite,
        }));
        Alert.alert(
            mealPlan.isFavorite ? 'Removed from Favorites' : 'Added to Favorites',
            mealPlan.isFavorite
                ? 'This meal plan has been removed from your favorites'
                : 'This meal plan has been added to your favorites'
        );
    };

    const handleShare = () => {
        Alert.alert('Share', 'Share functionality would be implemented here');
    };

    return (
        <View style={styles.container}>
            <MealPlanViewer
                plan={mealPlan}
                onRegenerateMeal={handleRegenerateMeal}
                onSaveFavorite={handleSaveFavorite}
                onShare={handleShare}
            />
        </View>
    );
};

// Mock data for demonstration
function getMockMealPlan(): MealPlan {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    return {
        id: 'plan_mock_123',
        userId: 'user_123',
        weekOf: startOfWeek,
        isFavorite: false,
        createdAt: new Date(),
        days: Array.from({ length: 7 }, (_, i) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);

            return {
                date,
                meals: {
                    breakfast: {
                        id: `meal_${i}_breakfast`,
                        name: 'Oatmeal with Berries',
                        type: 'breakfast' as const,
                        ingredients: [
                            'Rolled oats (1 cup)',
                            'Almond milk (1 cup)',
                            'Mixed berries (1/2 cup)',
                            'Honey (1 tbsp)',
                            'Chia seeds (1 tsp)',
                        ],
                        instructions: [
                            'Bring almond milk to a boil in a small pot',
                            'Add rolled oats and reduce heat to medium',
                            'Cook for 5 minutes, stirring occasionally',
                            'Remove from heat and let sit for 2 minutes',
                            'Top with berries, honey, and chia seeds',
                        ],
                        nutrition: {
                            calories: 350,
                            protein: 12,
                            carbs: 58,
                            fat: 9,
                            fiber: 10,
                        },
                        prepTime: 10,
                        cuisine: 'International',
                    },
                    lunch: {
                        id: `meal_${i}_lunch`,
                        name: 'Grilled Chicken Salad',
                        type: 'lunch' as const,
                        ingredients: [
                            'Chicken breast (150g)',
                            'Mixed greens (2 cups)',
                            'Cherry tomatoes (1 cup)',
                            'Cucumber (1/2)',
                            'Olive oil (2 tbsp)',
                            'Lemon juice (1 tbsp)',
                        ],
                        instructions: [
                            'Season chicken breast with salt and pepper',
                            'Grill chicken for 6-7 minutes per side',
                            'Let chicken rest for 5 minutes, then slice',
                            'Toss greens, tomatoes, and cucumber in a bowl',
                            'Top with sliced chicken',
                            'Drizzle with olive oil and lemon juice',
                        ],
                        nutrition: {
                            calories: 420,
                            protein: 38,
                            carbs: 18,
                            fat: 22,
                            fiber: 6,
                        },
                        prepTime: 20,
                        cuisine: 'Mediterranean',
                    },
                    dinner: {
                        id: `meal_${i}_dinner`,
                        name: 'Baked Salmon with Vegetables',
                        type: 'dinner' as const,
                        ingredients: [
                            'Salmon fillet (180g)',
                            'Broccoli (1 cup)',
                            'Carrots (1 cup)',
                            'Olive oil (1 tbsp)',
                            'Garlic (2 cloves)',
                            'Lemon (1/2)',
                        ],
                        instructions: [
                            'Preheat oven to 400°F (200°C)',
                            'Place salmon on a baking sheet',
                            'Season with minced garlic, salt, and pepper',
                            'Arrange vegetables around salmon',
                            'Drizzle everything with olive oil',
                            'Bake for 18-20 minutes',
                            'Squeeze lemon juice over salmon before serving',
                        ],
                        nutrition: {
                            calories: 480,
                            protein: 42,
                            carbs: 24,
                            fat: 24,
                            fiber: 8,
                        },
                        prepTime: 30,
                        cuisine: 'International',
                    },
                    snack1: {
                        id: `meal_${i}_snack1`,
                        name: 'Greek Yogurt with Nuts',
                        type: 'snack' as const,
                        ingredients: [
                            'Greek yogurt (1 cup)',
                            'Mixed nuts (1/4 cup)',
                            'Honey (1 tsp)',
                        ],
                        instructions: [
                            'Scoop Greek yogurt into a bowl',
                            'Top with mixed nuts',
                            'Drizzle with honey',
                        ],
                        nutrition: {
                            calories: 220,
                            protein: 18,
                            carbs: 16,
                            fat: 11,
                            fiber: 2,
                        },
                        prepTime: 5,
                        cuisine: 'Greek',
                    },
                    snack2: {
                        id: `meal_${i}_snack2`,
                        name: 'Apple with Almond Butter',
                        type: 'snack' as const,
                        ingredients: ['Apple (1 medium)', 'Almond butter (2 tbsp)'],
                        instructions: [
                            'Wash and slice apple into wedges',
                            'Serve with almond butter for dipping',
                        ],
                        nutrition: {
                            calories: 200,
                            protein: 6,
                            carbs: 28,
                            fat: 9,
                            fiber: 6,
                        },
                        prepTime: 5,
                        cuisine: 'International',
                    },
                },
                totalNutrition: {
                    calories: 1670,
                    protein: 116,
                    carbs: 144,
                    fat: 75,
                },
            };
        }),
    };
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
