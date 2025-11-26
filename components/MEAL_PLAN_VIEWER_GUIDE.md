# MealPlanViewer Component Guide

## Overview

The `MealPlanViewer` component is a comprehensive, visually stunning interface for displaying weekly meal plans with full nutrition information, expandable meal details, and interactive features. It follows the futuristic design system with gradients, glassmorphism effects, and smooth animations.

## Features

✅ **Weekly Calendar View** - Horizontal scrollable day cards with gradient borders
✅ **Meal Cards** - Color-coded meal cards with meal type icons and gradient backgrounds
✅ **Expandable Meal View** - Full-screen modal with complete recipe and instructions
✅ **Nutrition Facts Display** - Colorful circular charts showing macros
✅ **Regenerate Meal** - Button with loading animation to regenerate individual meals
✅ **Shopping List** - Auto-generated shopping list from all meals
✅ **Favorite Toggle** - Heart icon with bounce animation
✅ **Share Functionality** - Share meal plans and shopping lists
✅ **Responsive Design** - Works on all screen sizes
✅ **Dark Mode Support** - Automatically adapts to theme

## Installation

The component is already integrated with the design system. No additional installation required.

## Usage

### Basic Usage

```tsx
import { MealPlanViewer } from '@/components/MealPlanViewer';
import { MealPlanService } from '@/services/mealPlanService';

function MyMealPlanScreen() {
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);

  useEffect(() => {
    loadMealPlan();
  }, []);

  const loadMealPlan = async () => {
    const plan = await MealPlanService.generateMealPlan(userId);
    setMealPlan(plan);
  };

  const handleRegenerateMeal = async (dayIndex: number, mealType: string) => {
    const newMeal = await MealPlanService.regenerateMeal(
      mealPlan.id,
      dayIndex,
      mealType
    );
    // Update local state
    const updatedPlan = { ...mealPlan };
    updatedPlan.days[dayIndex].meals[mealType] = newMeal;
    setMealPlan(updatedPlan);
  };

  const handleSaveFavorite = async () => {
    await MealPlanService.toggleFavorite(userId, mealPlan.id);
    setMealPlan({ ...mealPlan, isFavorite: !mealPlan.isFavorite });
  };

  if (!mealPlan) return <LoadingScreen />;

  return (
    <MealPlanViewer
      plan={mealPlan}
      onRegenerateMeal={handleRegenerateMeal}
      onSaveFavorite={handleSaveFavorite}
      onShare={handleShare}
    />
  );
}
```

### With Example Data

```tsx
import { MealPlanViewerExample } from '@/components/MealPlanViewerExample';

// Use the example component to see the UI in action
function DemoScreen() {
  return <MealPlanViewerExample />;
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `plan` | `MealPlan` | Yes | The meal plan object to display |
| `onRegenerateMeal` | `(dayIndex: number, mealType: string) => Promise<void>` | Yes | Callback when user wants to regenerate a meal |
| `onSaveFavorite` | `() => void` | Yes | Callback when user toggles favorite status |
| `onShare` | `() => void` | No | Optional callback for sharing functionality |

## Component Structure

### 1. Header Section
- Gradient background with primary colors
- Title: "Your Personalized Meal Plan"
- Favorite button (heart icon) with bounce animation
- Share button (optional)

### 2. Week Selector
- Displays the week date range
- Simple text label

### 3. Day Cards Carousel
- Horizontal scrollable cards
- Each card shows:
  - Day name (Monday, Tuesday, etc.)
  - Date (formatted)
  - Total calories in a circular ring
- Selected day has gradient border
- Smooth snap-to-card scrolling

### 4. Meals List
- Displays all meals for selected day
- Each meal card shows:
  - Meal type icon (sun for breakfast, restaurant for lunch, moon for dinner, fast-food for snacks)
  - Meal type label
  - Meal name
  - Quick macro summary (calories, protein, carbs)
  - Gradient background based on meal type
- Tap to expand for full details

### 5. Expanded Meal Modal
- Full-screen modal with gradient header
- Displays:
  - Large meal icon
  - Meal name and type
  - Prep time and cuisine
  - **Nutrition Facts** - Colorful circular charts for calories, protein, carbs, fat
  - **Ingredients** - Bulleted list with gradient bullets
  - **Instructions** - Numbered steps with gradient step numbers
  - **Regenerate Button** - Regenerates just this meal

### 6. Shopping List Modal
- Full-screen modal with gradient header
- Auto-generated from all meals in the week
- Checkbox-style list items
- Share button to export list

## Meal Type Color Schemes

Each meal type has its own gradient:

- **Breakfast**: Yellow to Orange (`#FBBF24` → `#F59E0B`)
- **Lunch**: Green to Emerald (`#10B981` → `#059669`)
- **Dinner**: Purple to Indigo (`#8B5CF6` → `#6366F1`)
- **Snack**: Pink to Rose (`#EC4899` → `#DB2777`)

## Animations

### Favorite Toggle
- Bounce animation when tapped
- Scales from 1 → 1.3 → 1
- Haptic feedback on tap

### Meal Regeneration
- Loading spinner replaces chevron icon
- Smooth transition
- Success haptic feedback

### Card Selection
- Gradient border appears on selected day
- Smooth scroll animation

### Modal Transitions
- Slide up animation
- Blur background effect

## Accessibility

- All interactive elements have proper labels
- Haptic feedback for all actions
- High contrast mode support
- Screen reader compatible
- Large touch targets (minimum 44x44)

## Performance Considerations

- Lazy loading of meal details
- Optimized scroll performance with `pagingEnabled`
- Memoized calculations for nutrition totals
- Efficient re-renders with proper state management

## Integration with MealPlanService

The component works seamlessly with the `MealPlanService`:

```tsx
// Generate a new meal plan
const plan = await MealPlanService.generateMealPlan(userId);

// Regenerate a specific meal
const newMeal = await MealPlanService.regenerateMeal(planId, dayIndex, mealType);

// Toggle favorite
await MealPlanService.toggleFavorite(userId, planId);

// Get all meal plans
const plans = await MealPlanService.getMealPlans(userId);
```

## Customization

### Custom Gradients

You can customize the gradients by modifying the `getMealGradient` function:

```tsx
const getMealGradient = (mealType: string): string[] => {
  const mealGradients: Record<string, string[]> = {
    breakfast: ['#YOUR_COLOR_1', '#YOUR_COLOR_2'],
    // ... other meal types
  };
  return mealGradients[mealType] || gradients.primary;
};
```

### Custom Icons

Modify the `getMealIcon` function to use different icons:

```tsx
const getMealIcon = (mealType: string): keyof typeof Ionicons.glyphMap => {
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    breakfast: 'your-icon-name',
    // ... other meal types
  };
  return icons[mealType] || 'nutrition';
};
```

## Troubleshooting

### Issue: Day cards not scrolling smoothly
**Solution**: Ensure `snapToInterval` matches `DAY_CARD_WIDTH + gap`

### Issue: Modals not closing
**Solution**: Check that `onRequestClose` is properly handled

### Issue: Regenerate button not working
**Solution**: Ensure `onRegenerateMeal` returns a Promise and handles errors

### Issue: Colors not matching theme
**Solution**: Verify `ThemeProvider` is wrapping the component

## Future Enhancements

Potential features to add:

- [ ] Swipe gestures to navigate between days
- [ ] Meal substitution suggestions
- [ ] Calorie adjustment slider
- [ ] Export meal plan as PDF
- [ ] Add meals to calendar
- [ ] Nutrition goal progress bars
- [ ] Meal prep instructions
- [ ] Grocery delivery integration

## Related Components

- `GradientButton` - Used for action buttons
- `GlassmorphismCard` - Used for content sections
- `NutrientChart` - Alternative nutrition display (not used in current version)

## Requirements Satisfied

This component satisfies the following requirements from the spec:

- ✅ **Requirement 1.5**: AI-generated weekly meal plans with full nutrition info
- ✅ **Requirement 1.11**: Futuristic UI with gradients, glassmorphism, and animations

## Example Screenshots

(In a real implementation, you would add screenshots here showing:)
- Day cards carousel
- Meal cards list
- Expanded meal view
- Shopping list modal
- Favorite animation

## Support

For issues or questions, refer to:
- Design system documentation: `components/design-system/README.md`
- MealPlanService documentation: `services/MEAL_PLAN_SERVICE_GUIDE.md`
- Theme context: `contexts/ThemeContext.tsx`
