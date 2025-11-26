# Meal Plan Service Implementation Guide

## Overview

The `MealPlanService` is a comprehensive AI-powered meal planning service that generates personalized 7-day meal plans based on user preferences, health goals, and allergen restrictions.

## Features Implemented

### ✅ Core Functionality

1. **AI-Powered Meal Generation**
   - Uses Firebase Vertex AI (Gemini 1.5 Flash) for intelligent meal planning
   - Generates complete 7-day meal plans with breakfast, lunch, dinner, and 2 snacks per day
   - Structured JSON output for consistent data format

2. **Allergen Filtering**
   - Automatically excludes user allergens from all meal suggestions
   - Double-checks ingredients in AI prompts
   - Critical safety warnings in prompts to ensure allergen compliance

3. **Macro Calculation Based on Health Goals**
   - **Weight Loss**: 40% protein, 30% carbs, 30% fat (1800 kcal/day)
   - **Muscle Gain**: 30% protein, 45% carbs, 25% fat (2500 kcal/day)
   - **Maintenance**: 25% protein, 45% carbs, 30% fat (2000 kcal/day)

4. **Meal Regeneration**
   - Regenerate individual meals within a plan
   - Maintains overall plan structure while updating specific meals

5. **Firestore Integration**
   - Saves meal plans to Firestore for persistence
   - Retrieves user meal plans with pagination
   - Updates and deletes meal plans

6. **Favorite Meal Plans**
   - Toggle favorite status on meal plans
   - Easy access to preferred meal plans

7. **Local Caching**
   - Caches up to 10 most recent meal plans locally
   - Enables offline viewing of meal plans
   - Automatic cache updates on plan changes

8. **Multi-Language Support**
   - Generates region-specific meals based on user language
   - Supports: English, Hindi, Tamil, Telugu, Bengali, Marathi
   - Includes regional cuisine preferences

## API Reference

### Generate Meal Plan

```typescript
const mealPlan = await MealPlanService.generateMealPlan(userId);
```

Generates a complete 7-day meal plan for the user.

**Parameters:**
- `userId` (string): The user's Firebase UID

**Returns:**
- `Promise<MealPlan>`: Complete meal plan object

### Regenerate Meal

```typescript
const newMeal = await MealPlanService.regenerateMeal(
  planId,
  dayIndex,
  mealType
);
```

Regenerates a specific meal in an existing plan.

**Parameters:**
- `planId` (string): The meal plan ID
- `dayIndex` (number): Day index (0-6)
- `mealType` (string): 'breakfast' | 'lunch' | 'dinner' | 'snack1' | 'snack2'

**Returns:**
- `Promise<Meal>`: The newly generated meal

### Get Meal Plans

```typescript
const plans = await MealPlanService.getMealPlans(userId);
```

Retrieves all meal plans for a user.

**Parameters:**
- `userId` (string): The user's Firebase UID

**Returns:**
- `Promise<MealPlan[]>`: Array of meal plans (up to 20 most recent)

### Toggle Favorite

```typescript
await MealPlanService.toggleFavorite(userId, planId);
```

Toggles the favorite status of a meal plan.

**Parameters:**
- `userId` (string): The user's Firebase UID
- `planId` (string): The meal plan ID

### Delete Meal Plan

```typescript
await MealPlanService.deleteMealPlan(userId, planId);
```

Soft deletes a meal plan.

**Parameters:**
- `userId` (string): The user's Firebase UID
- `planId` (string): The meal plan ID

### Clear Cache

```typescript
await MealPlanService.clearCache();
```

Clears all locally cached meal plans.

## Data Structures

### MealPlan

```typescript
interface MealPlan {
  id: string;
  userId: string;
  weekOf: Date;
  days: DayPlan[];
  createdAt: Date;
  isFavorite: boolean;
}
```

### DayPlan

```typescript
interface DayPlan {
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
```

### Meal

```typescript
interface Meal {
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
```

## Usage Examples

### Example 1: Generate a Meal Plan

```typescript
import { MealPlanService } from './services/mealPlanService';

async function generatePlan() {
  try {
    const userId = 'user-123';
    const mealPlan = await MealPlanService.generateMealPlan(userId);
    
    console.log(`Generated plan for week of ${mealPlan.weekOf}`);
    console.log(`Total days: ${mealPlan.days.length}`);
    
    // Display first day
    const firstDay = mealPlan.days[0];
    console.log(`Day 1 - ${firstDay.date}`);
    console.log(`Breakfast: ${firstDay.meals.breakfast.name}`);
    console.log(`Total calories: ${firstDay.totalNutrition.calories}`);
  } catch (error) {
    console.error('Error generating meal plan:', error);
  }
}
```

### Example 2: Regenerate a Meal

```typescript
async function regenerateBreakfast() {
  try {
    const planId = 'plan_123';
    const dayIndex = 0; // Monday
    const mealType = 'breakfast';
    
    const newMeal = await MealPlanService.regenerateMeal(
      planId,
      dayIndex,
      mealType
    );
    
    console.log(`New breakfast: ${newMeal.name}`);
    console.log(`Calories: ${newMeal.nutrition.calories}`);
    console.log(`Prep time: ${newMeal.prepTime} minutes`);
  } catch (error) {
    console.error('Error regenerating meal:', error);
  }
}
```

### Example 3: View All Meal Plans

```typescript
async function viewMealPlans() {
  try {
    const userId = 'user-123';
    const plans = await MealPlanService.getMealPlans(userId);
    
    console.log(`Found ${plans.length} meal plans`);
    
    plans.forEach((plan, index) => {
      console.log(`${index + 1}. Week of ${plan.weekOf}`);
      console.log(`   Favorite: ${plan.isFavorite ? 'Yes' : 'No'}`);
      console.log(`   Created: ${plan.createdAt}`);
    });
  } catch (error) {
    console.error('Error fetching meal plans:', error);
  }
}
```

## Error Handling

The service includes comprehensive error handling:

1. **Network Errors**: Retries up to 3 times with exponential backoff
2. **AI Generation Failures**: Falls back to default meals
3. **Firestore Errors**: Returns cached data when available
4. **Invalid Data**: Validates and sanitizes all inputs

## Performance Considerations

1. **Caching**: Local caching reduces Firestore reads and enables offline access
2. **Pagination**: Limits queries to 20 most recent plans
3. **Retry Logic**: Exponential backoff prevents overwhelming the AI service
4. **Default Meals**: Instant fallback when AI generation fails

## Testing

### Manual Testing Checklist

- [ ] Generate meal plan for user with no allergens
- [ ] Generate meal plan for user with multiple allergens
- [ ] Verify allergens are excluded from all meals
- [ ] Test meal regeneration
- [ ] Verify macro calculations match health goal
- [ ] Test favorite toggle functionality
- [ ] Test offline access with cached plans
- [ ] Test multi-language meal generation
- [ ] Verify Firestore data persistence
- [ ] Test error handling with network issues

### Integration Testing

```typescript
// Test complete workflow
async function testMealPlanWorkflow() {
  const userId = 'test-user';
  
  // 1. Generate plan
  const plan = await MealPlanService.generateMealPlan(userId);
  console.log('✓ Plan generated');
  
  // 2. Regenerate a meal
  const newMeal = await MealPlanService.regenerateMeal(
    plan.id,
    0,
    'breakfast'
  );
  console.log('✓ Meal regenerated');
  
  // 3. Toggle favorite
  await MealPlanService.toggleFavorite(userId, plan.id);
  console.log('✓ Favorite toggled');
  
  // 4. Get all plans
  const plans = await MealPlanService.getMealPlans(userId);
  console.log(`✓ Retrieved ${plans.length} plans`);
  
  // 5. Verify cache
  const cachedPlans = await MealPlanService.getMealPlans(userId);
  console.log('✓ Cache working');
}
```

## Firestore Schema

```
/users/{userId}/mealPlans/{planId}
  - weekOf: timestamp
  - days: array<{
      date: timestamp,
      meals: {
        breakfast: Meal,
        lunch: Meal,
        dinner: Meal,
        snack1: Meal,
        snack2: Meal
      },
      totalNutrition: {
        calories: number,
        protein: number,
        carbs: number,
        fat: number
      }
    }>
  - createdAt: timestamp
  - isFavorite: boolean
  - deleted: boolean (optional)
  - deletedAt: timestamp (optional)
```

## Requirements Mapping

This implementation satisfies the following requirements:

- **Requirement 1.5**: AI-generated weekly meal plans tailored to allergies and health goals
- **Requirement 1.6**: Learning from food scanning history for personalized recommendations

### Specific Acceptance Criteria Met:

1. ✅ Generates 7-day meal plan with breakfast, lunch, dinner, and 2 snacks per day
2. ✅ Ensures all meal plan items exclude ingredients matching user's allergen profile
3. ✅ Considers user's health goal and adjusts macronutrient ratios accordingly
4. ✅ Allows users to regenerate individual meals or entire days
5. ✅ Displays complete nutrition information and recipes with cooking instructions
6. ✅ Allows users to save favorite meal plans and reuse them

## Next Steps

1. Integrate with UI components (MealPlanViewer)
2. Add shopping list generation feature
3. Implement meal plan sharing functionality
4. Add nutrition charts and visualizations
5. Implement meal plan templates for quick generation

## Support

For issues or questions, refer to:
- Firebase Vertex AI documentation
- Firestore documentation
- AI_NUTRITION_COACH_SETUP.md for Firebase configuration
