# MealPlanViewer - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Import the Component

```tsx
import { MealPlanViewer } from '@/components/MealPlanViewer';
import { MealPlanService, MealPlan } from '@/services/mealPlanService';
```

### Step 2: Set Up State

```tsx
const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
const [loading, setLoading] = useState(true);
```

### Step 3: Load Meal Plan

```tsx
useEffect(() => {
  loadMealPlan();
}, []);

const loadMealPlan = async () => {
  try {
    setLoading(true);
    const plan = await MealPlanService.generateMealPlan(userId);
    setMealPlan(plan);
  } catch (error) {
    console.error('Failed to load meal plan:', error);
  } finally {
    setLoading(false);
  }
};
```

### Step 4: Implement Handlers

```tsx
const handleRegenerateMeal = async (dayIndex: number, mealType: string) => {
  if (!mealPlan) return;
  
  try {
    const newMeal = await MealPlanService.regenerateMeal(
      mealPlan.id,
      dayIndex,
      mealType
    );
    
    // Update local state
    const updatedPlan = { ...mealPlan };
    updatedPlan.days[dayIndex].meals[mealType] = newMeal;
    setMealPlan(updatedPlan);
  } catch (error) {
    Alert.alert('Error', 'Failed to regenerate meal');
  }
};

const handleSaveFavorite = async () => {
  if (!mealPlan) return;
  
  try {
    await MealPlanService.toggleFavorite(userId, mealPlan.id);
    setMealPlan({ ...mealPlan, isFavorite: !mealPlan.isFavorite });
  } catch (error) {
    Alert.alert('Error', 'Failed to update favorite');
  }
};

const handleShare = async () => {
  // Implement share functionality
  Alert.alert('Share', 'Share functionality coming soon!');
};
```

### Step 5: Render the Component

```tsx
if (loading) {
  return <LoadingScreen />;
}

if (!mealPlan) {
  return <EmptyState message="No meal plan available" />;
}

return (
  <MealPlanViewer
    plan={mealPlan}
    onRegenerateMeal={handleRegenerateMeal}
    onSaveFavorite={handleSaveFavorite}
    onShare={handleShare}
  />
);
```

## 📱 Complete Example

```tsx
import React, { useState, useEffect } from 'react';
import { View, Alert, ActivityIndicator } from 'react-native';
import { MealPlanViewer } from '@/components/MealPlanViewer';
import { MealPlanService, MealPlan } from '@/services/mealPlanService';
import { useAuth } from '@/contexts/AuthContext';

export default function MealPlanScreen() {
  const { user } = useAuth();
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMealPlan();
    }
  }, [user]);

  const loadMealPlan = async () => {
    try {
      setLoading(true);
      const plan = await MealPlanService.generateMealPlan(user.uid);
      setMealPlan(plan);
    } catch (error) {
      console.error('Failed to load meal plan:', error);
      Alert.alert('Error', 'Failed to load meal plan');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateMeal = async (dayIndex: number, mealType: string) => {
    if (!mealPlan) return;
    
    try {
      const newMeal = await MealPlanService.regenerateMeal(
        mealPlan.id,
        dayIndex,
        mealType
      );
      
      const updatedPlan = { ...mealPlan };
      updatedPlan.days[dayIndex].meals[mealType] = newMeal;
      setMealPlan(updatedPlan);
      
      Alert.alert('Success', 'Meal regenerated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to regenerate meal');
    }
  };

  const handleSaveFavorite = async () => {
    if (!mealPlan) return;
    
    try {
      await MealPlanService.toggleFavorite(user.uid, mealPlan.id);
      setMealPlan({ ...mealPlan, isFavorite: !mealPlan.isFavorite });
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorite');
    }
  };

  const handleShare = async () => {
    // TODO: Implement share functionality
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!mealPlan) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No meal plan available</Text>
      </View>
    );
  }

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

## 🧪 Testing with Mock Data

For quick testing without backend:

```tsx
import { MealPlanViewerExample } from '@/components/MealPlanViewerExample';

export default function TestScreen() {
  return <MealPlanViewerExample />;
}
```

## 🎨 Customization Examples

### Custom Meal Gradients

```tsx
// In MealPlanViewer.tsx, modify getMealGradient function:
const getMealGradient = (mealType: string): string[] => {
  const mealGradients: Record<string, string[]> = {
    breakfast: ['#YOUR_COLOR_1', '#YOUR_COLOR_2'],
    lunch: ['#YOUR_COLOR_3', '#YOUR_COLOR_4'],
    dinner: ['#YOUR_COLOR_5', '#YOUR_COLOR_6'],
    snack: ['#YOUR_COLOR_7', '#YOUR_COLOR_8'],
  };
  return mealGradients[mealType] || gradients.primary;
};
```

### Custom Icons

```tsx
// In MealPlanViewer.tsx, modify getMealIcon function:
const getMealIcon = (mealType: string): keyof typeof Ionicons.glyphMap => {
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    breakfast: 'cafe',
    lunch: 'pizza',
    dinner: 'restaurant',
    snack: 'ice-cream',
  };
  return icons[mealType] || 'nutrition';
};
```

## 🔧 Common Issues & Solutions

### Issue: "Cannot read property 'days' of null"
**Solution**: Always check if `mealPlan` exists before rendering:
```tsx
if (!mealPlan) return <LoadingScreen />;
```

### Issue: Regenerate not working
**Solution**: Ensure the handler returns a Promise:
```tsx
const handleRegenerateMeal = async (dayIndex: number, mealType: string) => {
  // Must be async and handle errors
  try {
    await MealPlanService.regenerateMeal(...);
  } catch (error) {
    // Handle error
  }
};
```

### Issue: Favorite not persisting
**Solution**: Make sure to update both Firestore and local state:
```tsx
await MealPlanService.toggleFavorite(userId, planId);
setMealPlan({ ...mealPlan, isFavorite: !mealPlan.isFavorite });
```

### Issue: Theme colors not working
**Solution**: Wrap your app with ThemeProvider:
```tsx
import { ThemeProvider } from '@/contexts/ThemeContext';

<ThemeProvider>
  <App />
</ThemeProvider>
```

## 📊 Performance Tips

### 1. Memoize Expensive Calculations
```tsx
const totalCalories = useMemo(() => {
  return mealPlan?.days[selectedDay]?.totalNutrition.calories || 0;
}, [mealPlan, selectedDay]);
```

### 2. Lazy Load Modals
```tsx
// Modals only render when needed
{expandedMeal && renderExpandedMeal()}
```

### 3. Optimize Scroll Performance
```tsx
<ScrollView
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
>
```

## 🎯 Next Steps

1. **Add to Navigation**
   ```tsx
   // In your navigation file
   <Tab.Screen 
     name="MealPlans" 
     component={MealPlanScreen}
     options={{
       tabBarIcon: ({ color }) => (
         <Ionicons name="restaurant" size={24} color={color} />
       ),
     }}
   />
   ```

2. **Add Analytics**
   ```tsx
   import { AnalyticsService } from '@/services/analyticsService';
   
   // Track meal plan views
   useEffect(() => {
     if (mealPlan) {
       AnalyticsService.logFeatureUsage(user.uid, 'meal_plan_view', true);
     }
   }, [mealPlan]);
   ```

3. **Add Error Boundaries**
   ```tsx
   <ErrorBoundary fallback={<ErrorScreen />}>
     <MealPlanViewer {...props} />
   </ErrorBoundary>
   ```

## 📚 Additional Resources

- **Full Documentation**: `MEAL_PLAN_VIEWER_GUIDE.md`
- **Visual Reference**: `MEAL_PLAN_VIEWER_VISUAL_REFERENCE.md`
- **Implementation Summary**: `MEAL_PLAN_VIEWER_IMPLEMENTATION.md`
- **Design System**: `components/design-system/README.md`
- **MealPlanService**: `services/MEAL_PLAN_SERVICE_GUIDE.md`

## 💡 Pro Tips

1. **Always handle loading states** - Users should never see a blank screen
2. **Provide feedback** - Use haptics and alerts for all actions
3. **Cache data** - MealPlanService already caches, but consider additional caching
4. **Test on real devices** - Animations and haptics feel different on real hardware
5. **Monitor performance** - Use React DevTools Profiler to identify bottlenecks

## 🎉 You're Ready!

The MealPlanViewer component is production-ready and fully documented. Start building amazing meal planning experiences for your users!

For questions or issues, refer to the comprehensive documentation or check the implementation summary.
