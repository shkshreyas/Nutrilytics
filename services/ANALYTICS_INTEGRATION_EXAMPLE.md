# Analytics Service Integration Examples

This document provides complete, working examples of how to integrate the Analytics Service with various components in the Nutrilytics app.

## Table of Contents

1. [App Initialization](#app-initialization)
2. [User Authentication](#user-authentication)
3. [Onboarding Flow](#onboarding-flow)
4. [Barcode Scanner](#barcode-scanner)
5. [AI Chat Interface](#ai-chat-interface)
6. [Meal Plan Generation](#meal-plan-generation)
7. [Subscription Paywall](#subscription-paywall)
8. [Trial Activation](#trial-activation)
9. [Subscription Management](#subscription-management)
10. [Settings Screen](#settings-screen)

---

## App Initialization

Track when users open the app and update their properties.

```typescript
// app/_layout.tsx
import { useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';
import { useAuth } from '../contexts/AuthContext';

export default function RootLayout() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Set user ID for analytics
      analyticsService.setUser(user.uid);

      // Log app opened
      analyticsService.logAppOpened(user.uid);

      // Update user properties
      analyticsService.updateUserProperties(user.uid);
    }
  }, [user]);

  return (
    // Layout components
  );
}
```

---

## User Authentication

Track user sign-up and sign-in events.

```typescript
// contexts/AuthContext.tsx
import { analyticsService } from '../services/analyticsService';

export const AuthProvider = ({ children }) => {
  const signUp = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Set user ID for analytics
      analyticsService.setUser(userId);

      // Create user profile in Firestore
      await setDoc(doc(firestore, 'users', userId), {
        email,
        createdAt: serverTimestamp(),
        onboardingCompleted: false,
      });

      // Initialize aggregated metrics if needed
      await analyticsService.updateAggregatedMetrics();

      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Set user ID for analytics
      analyticsService.setUser(userId);

      // Log app opened
      await analyticsService.logAppOpened(userId);

      // Update user properties
      await analyticsService.updateUserProperties(userId);

      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ signUp, signIn }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## Onboarding Flow

Track onboarding progress and completion.

```typescript
// app/onboarding.tsx
import { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';
import { useAuth } from '../contexts/AuthContext';

export default function OnboardingScreen() {
  const { user } = useAuth();
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (user) {
      // Log onboarding started
      analyticsService.logOnboardingStarted(user.uid);
      setStartTime(Date.now());
    }
  }, [user]);

  const handleComplete = async () => {
    if (!user) return;

    // Calculate duration
    const duration = Math.floor((Date.now() - startTime) / 1000);

    // Log onboarding completed
    await analyticsService.logOnboardingCompleted(user.uid, duration);

    // Update user profile
    await updateDoc(doc(firestore, 'users', user.uid), {
      onboardingCompleted: true,
    });

    // Navigate to trial activation or home
    router.push('/trial-activation');
  };

  const handleAllergenSelection = async (allergens: string[]) => {
    if (!user) return;

    // Save allergens
    await updateDoc(doc(firestore, 'users', user.uid), {
      allergens,
    });

    // Update user properties
    analyticsService.setUserProperty('allergen_count', allergens.length);

    setCurrentStep(currentStep + 1);
  };

  const handleHealthGoalSelection = async (goal: string) => {
    if (!user) return;

    // Save health goal
    await updateDoc(doc(firestore, 'users', user.uid), {
      healthGoal: goal,
    });

    // Update user properties
    analyticsService.setUserProperty('health_goal', goal);

    setCurrentStep(currentStep + 1);
  };

  return (
    // Onboarding UI
  );
}
```

---

## Barcode Scanner

Track barcode scans and quota exhaustion.

```typescript
// components/BarcodeScanner.tsx
import { useState } from 'react';
import { analyticsService } from '../services/analyticsService';
import { SubscriptionService } from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';

export default function BarcodeScanner() {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const subscriptionService = SubscriptionService.getInstance();

  const handleBarcodeScan = async (barcode: string) => {
    if (!user) return;

    try {
      // Check if user can scan
      const canScan = await subscriptionService.canUseFeature(user.uid, 'barcode_scan');

      if (!canScan.allowed) {
        // Log quota exhaustion
        await analyticsService.logQuotaExhausted(user.uid, 'barcode_scan');

        // Show paywall
        showPaywall('scan_limit');
        return;
      }

      setScanning(true);

      // Increment usage
      await subscriptionService.incrementUsage(user.uid, 'barcode');

      // Fetch product data
      const productData = await fetchProductData(barcode);

      // Log scan
      const isPremium = await subscriptionService.checkPremiumAccess(user.uid);
      await analyticsService.logBarcodeScan(user.uid, isPremium, productData.name);

      // Log feature usage
      await analyticsService.logFeatureUsage(user.uid, 'barcode_scan', isPremium, {
        product_name: productData.name,
        has_allergens: productData.allergens.length > 0,
      });

      // Show results
      showResults(productData);
    } catch (error) {
      console.error('Barcode scan error:', error);
    } finally {
      setScanning(false);
    }
  };

  const showPaywall = async (trigger: string) => {
    if (!user) return;

    const isPremium = await subscriptionService.checkPremiumAccess(user.uid);
    await analyticsService.logPaywallImpression(user.uid, trigger, isPremium);

    // Navigate to paywall
    router.push(`/subscription?trigger=${trigger}`);
  };

  return (
    // Scanner UI
  );
}
```

---

## AI Chat Interface

Track AI messages and quota limits.

```typescript
// components/AIChatInterface.tsx
import { useState } from 'react';
import { analyticsService } from '../services/analyticsService';
import { SubscriptionService } from '../services/subscriptionService';
import { AINutritionCoachService } from '../services/aiNutritionCoachService';
import { useAuth } from '../contexts/AuthContext';

export default function AIChatInterface() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const subscriptionService = SubscriptionService.getInstance();
  const aiService = AINutritionCoachService.getInstance();

  const handleSendMessage = async () => {
    if (!user || !inputText.trim()) return;

    try {
      // Check if user can use AI coach
      const canUse = await subscriptionService.canUseFeature(user.uid, 'ai_coach');

      if (!canUse.allowed) {
        // Log quota exhaustion
        await analyticsService.logQuotaExhausted(user.uid, 'ai_message');

        // Show paywall
        const isPremium = await subscriptionService.checkPremiumAccess(user.uid);
        await analyticsService.logPaywallImpression(user.uid, 'ai_coach', isPremium);

        showPaywall('ai_coach');
        return;
      }

      // Add user message to UI
      const userMessage = { role: 'user', content: inputText, timestamp: new Date() };
      setMessages([...messages, userMessage]);
      setInputText('');

      // Increment usage
      await subscriptionService.incrementUsage(user.uid, 'ai');

      // Log message
      const isPremium = await subscriptionService.checkPremiumAccess(user.uid);
      await analyticsService.logAIMessage(user.uid, isPremium, inputText.length);

      // Log feature usage
      await analyticsService.logFeatureUsage(user.uid, 'ai_coach', isPremium, {
        message_length: inputText.length,
        conversation_length: messages.length,
      });

      // Send message to AI
      const responseIterator = await aiService.sendMessage(user.uid, inputText);

      // Stream response
      let fullResponse = '';
      for await (const chunk of responseIterator) {
        fullResponse += chunk;
        // Update UI with streaming response
      }

      // Add AI response to messages
      const aiMessage = { role: 'assistant', content: fullResponse, timestamp: new Date() };
      setMessages([...messages, userMessage, aiMessage]);
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  return (
    // Chat UI
  );
}
```

---

## Meal Plan Generation

Track meal plan generation and regeneration.

```typescript
// screens/MealPlanScreen.tsx
import { useState } from 'react';
import { analyticsService } from '../services/analyticsService';
import { SubscriptionService } from '../services/subscriptionService';
import { MealPlanService } from '../services/mealPlanService';
import { useAuth } from '../contexts/AuthContext';

export default function MealPlanScreen() {
  const { user } = useAuth();
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const subscriptionService = SubscriptionService.getInstance();
  const mealPlanService = MealPlanService.getInstance();

  const handleGenerateMealPlan = async () => {
    if (!user) return;

    try {
      // Check if user can use meal plans
      const canUse = await subscriptionService.canUseFeature(user.uid, 'meal_plan');

      if (!canUse.allowed) {
        // Show paywall
        const isPremium = await subscriptionService.checkPremiumAccess(user.uid);
        await analyticsService.logPaywallImpression(user.uid, 'meal_plan', isPremium);

        showPaywall('meal_plan');
        return;
      }

      setLoading(true);

      // Generate meal plan
      const plan = await mealPlanService.generateMealPlan(user.uid);

      // Log meal plan generation
      await analyticsService.logMealPlanGenerated(user.uid, 'weekly');

      // Log feature usage
      await analyticsService.logFeatureUsage(user.uid, 'meal_plan_generation', true, {
        plan_type: 'weekly',
        total_meals: plan.days.length * 5, // 5 meals per day
      });

      setMealPlan(plan);
    } catch (error) {
      console.error('Generate meal plan error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateMeal = async (dayIndex: number, mealType: string) => {
    if (!user || !mealPlan) return;

    try {
      // Regenerate meal
      const newMeal = await mealPlanService.regenerateMeal(mealPlan.id, dayIndex, mealType);

      // Log meal regeneration
      await analyticsService.logFeatureUsage(user.uid, 'meal_regeneration', true, {
        meal_type: mealType,
        day_index: dayIndex,
      });

      // Update meal plan
      const updatedPlan = { ...mealPlan };
      updatedPlan.days[dayIndex].meals[mealType] = newMeal;
      setMealPlan(updatedPlan);
    } catch (error) {
      console.error('Regenerate meal error:', error);
    }
  };

  return (
    // Meal plan UI
  );
}
```

---

## Subscription Paywall

Track paywall impressions, clicks, and conversions.

```typescript
// components/SubscriptionPaywall.tsx
import { useEffect, useState } from 'react';
import { analyticsService } from '../services/analyticsService';
import { SubscriptionService } from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';

interface PaywallProps {
  trigger: 'scan_limit' | 'ai_coach' | 'meal_plan' | 'trial_end';
  onDismiss: () => void;
}

export default function SubscriptionPaywall({ trigger, onDismiss }: PaywallProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const subscriptionService = SubscriptionService.getInstance();

  useEffect(() => {
    if (user) {
      // Log paywall impression
      logImpression();
    }
  }, [user]);

  const logImpression = async () => {
    if (!user) return;

    const isPremium = await subscriptionService.checkPremiumAccess(user.uid);
    await analyticsService.logPaywallImpression(user.uid, trigger, isPremium);
  };

  const handleSubscribe = async (tier: 'monthly' | 'yearly' | 'lifetime') => {
    if (!user) return;

    try {
      // Log CTA click
      await analyticsService.logPaywallCTAClick(user.uid, trigger, tier);

      setLoading(true);

      // Get subscription status before purchase
      const statusBefore = await subscriptionService.getSubscriptionStatus(user.uid);

      // Handle purchase
      const result = await subscriptionService.handlePurchase(user.uid, `nutrilytics_${tier}`);

      if (result.success) {
        // Determine conversion type
        const conversionType = statusBefore.isInTrial ? 'trial_to_paid' : 'free_to_paid';

        // Get tier price
        const tierPrices = { monthly: 199, yearly: 999, lifetime: 2999 };
        const revenue = tierPrices[tier];

        // Log conversion
        await analyticsService.logConversion(user.uid, tier, revenue, conversionType);

        // Show success message
        showSuccessMessage();

        // Close paywall
        onDismiss();
      } else {
        // Show error message
        showErrorMessage(result.error);
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      showErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    if (user) {
      await analyticsService.logPaywallDismissed(user.uid, trigger);
    }
    onDismiss();
  };

  return (
    <View>
      {/* Paywall UI */}
      <Button onPress={() => handleSubscribe('monthly')}>
        Start Monthly Subscription
      </Button>
      <Button onPress={() => handleSubscribe('yearly')}>
        Start Annual Subscription (Best Value)
      </Button>
      <Button onPress={() => handleSubscribe('lifetime')}>
        Buy Lifetime Access
      </Button>
      <Button onPress={handleDismiss}>
        Maybe Later
      </Button>
    </View>
  );
}
```

---

## Trial Activation

Track trial activation from onboarding.

```typescript
// app/trial-activation.tsx
import { useState } from 'react';
import { analyticsService } from '../services/analyticsService';
import { SubscriptionService } from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';

export default function TrialActivationScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'monthly' | 'yearly'>('yearly');
  const subscriptionService = SubscriptionService.getInstance();

  const handleStartTrial = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get offerings from RevenueCat
      const offerings = await subscriptionService.getOfferings();
      if (!offerings) {
        throw new Error('No offerings available');
      }

      // Find the selected package
      const packageToPurchase = offerings.availablePackages.find(
        (pkg) => pkg.identifier === `nutrilytics_${selectedTier}`
      );

      if (!packageToPurchase) {
        throw new Error('Package not found');
      }

      // Start trial
      const result = await subscriptionService.startFreeTrial(user.uid, packageToPurchase);

      if (result.success) {
        // Log trial activation
        await analyticsService.logTrialActivation(user.uid, 'onboarding', selectedTier);

        // Show success message
        showSuccessMessage();

        // Navigate to home
        router.replace('/(tabs)');
      } else {
        showErrorMessage(result.error);
      }
    } catch (error) {
      console.error('Start trial error:', error);
      showErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (user) {
      // User chose to continue with free plan
      // This could be tracked as a conversion opportunity lost
      await analyticsService.logFeatureUsage(user.uid, 'trial_skipped', false, {
        source: 'onboarding',
      });
    }

    // Navigate to home
    router.replace('/(tabs)');
  };

  return (
    <View>
      {/* Trial activation UI */}
      <Button onPress={() => setSelectedTier('monthly')}>
        Monthly Plan - ₹199/month
      </Button>
      <Button onPress={() => setSelectedTier('yearly')}>
        Annual Plan - ₹999/year (Best Value)
      </Button>
      <Button onPress={handleStartTrial} disabled={loading}>
        {loading ? 'Starting Trial...' : 'Start My Free Trial'}
      </Button>
      <Button onPress={handleSkip}>
        Continue with Free Plan
      </Button>
    </View>
  );
}
```

---

## Subscription Management

Track subscription cancellations and renewals.

```typescript
// screens/SubscriptionManagementScreen.tsx
import { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';
import { SubscriptionService } from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';

export default function SubscriptionManagementScreen() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [winBackOffer, setWinBackOffer] = useState(null);
  const subscriptionService = SubscriptionService.getInstance();

  useEffect(() => {
    if (user) {
      loadSubscriptionStatus();
    }
  }, [user]);

  const loadSubscriptionStatus = async () => {
    if (!user) return;

    const subscriptionStatus = await subscriptionService.getSubscriptionStatus(user.uid);
    setStatus(subscriptionStatus);

    // Check for win-back offer if cancelled
    if (subscriptionStatus.isCancelled) {
      const offer = await subscriptionService.getWinBackOffer(user.uid);
      setWinBackOffer(offer);
    }
  };

  const handleCancelSubscription = async (reason: string) => {
    if (!user || !status) return;

    try {
      // Show confirmation dialog
      const confirmed = await showConfirmDialog(
        'Cancel Subscription',
        'Are you sure you want to cancel? You will lose access to premium features.'
      );

      if (!confirmed) return;

      // Handle cancellation
      await subscriptionService.handleCancellation(user.uid);

      // Log cancellation
      await analyticsService.logCancellation(user.uid, reason, status.tier?.id || 'unknown');

      // Reload status to show win-back offer
      await loadSubscriptionStatus();

      showMessage('Subscription cancelled. You will have access until the end of your billing period.');
    } catch (error) {
      console.error('Cancel subscription error:', error);
      showErrorMessage(error.message);
    }
  };

  const handleAcceptWinBackOffer = async () => {
    if (!user || !winBackOffer) return;

    try {
      // Log CTA click
      await analyticsService.logPaywallCTAClick(user.uid, 'win_back_offer', winBackOffer.tier.id);

      // Handle purchase with discount
      // This would require special handling in RevenueCat for promotional offers
      const result = await subscriptionService.handlePurchase(user.uid, winBackOffer.tier.id);

      if (result.success) {
        // Log conversion
        await analyticsService.logConversion(
          user.uid,
          winBackOffer.tier.id,
          winBackOffer.tier.price * (1 - winBackOffer.discountPercent / 100),
          'free_to_paid'
        );

        showSuccessMessage('Welcome back! Your subscription has been reactivated.');
        await loadSubscriptionStatus();
      }
    } catch (error) {
      console.error('Accept win-back offer error:', error);
      showErrorMessage(error.message);
    }
  };

  return (
    <View>
      {/* Subscription management UI */}
      {status?.isActive && (
        <View>
          <Text>Current Plan: {status.tier?.name}</Text>
          <Text>Renews: {status.expiresAt?.toLocaleDateString()}</Text>
          <Button onPress={() => handleCancelSubscription('too_expensive')}>
            Cancel Subscription
          </Button>
        </View>
      )}

      {winBackOffer && (
        <View>
          <Text>Special Offer: {winBackOffer.discountPercent}% off for {winBackOffer.durationMonths} months!</Text>
          <Button onPress={handleAcceptWinBackOffer}>
            Reactivate with Discount
          </Button>
        </View>
      )}
    </View>
  );
}
```

---

## Settings Screen

Display analytics metrics and subscription info.

```typescript
// app/(tabs)/settings.tsx
import { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';
import { SubscriptionService } from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsScreen() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [status, setStatus] = useState(null);
  const subscriptionService = SubscriptionService.getInstance();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Load subscription status
    const subscriptionStatus = await subscriptionService.getSubscriptionStatus(user.uid);
    setStatus(subscriptionStatus);

    // Load conversion metrics (for admin/debug purposes)
    const conversionMetrics = await analyticsService.getConversionMetrics(30);
    setMetrics(conversionMetrics);
  };

  return (
    <ScrollView>
      {/* Profile section */}
      <View>
        <Text>Email: {user?.email}</Text>
      </View>

      {/* Subscription section */}
      <View>
        {status?.isActive ? (
          <View>
            <Text>Premium Member</Text>
            <Text>Plan: {status.tier?.name}</Text>
            {status.isInTrial && (
              <Text>Trial ends in {status.daysRemaining} days</Text>
            )}
            <Button onPress={() => router.push('/subscription-management')}>
              Manage Subscription
            </Button>
          </View>
        ) : (
          <View>
            <Text>Free Plan</Text>
            <Button onPress={() => router.push('/subscription?trigger=settings')}>
              Upgrade to Premium
            </Button>
          </View>
        )}
      </View>

      {/* Debug metrics (remove in production) */}
      {__DEV__ && metrics && (
        <View>
          <Text>Debug Metrics (Last 30 Days)</Text>
          <Text>Trial to Paid: {metrics.trialToPayRate}%</Text>
          <Text>Free to Paid: {metrics.freeToPayRate}%</Text>
          <Text>Churn Rate: {metrics.churnRate}%</Text>
          <Text>ARPU: ₹{metrics.averageRevenuePerUser}</Text>
          <Text>DAU: {metrics.dailyActiveUsers}</Text>
        </View>
      )}
    </ScrollView>
  );
}
```

---

## Summary

These examples demonstrate how to:

1. **Initialize analytics** when the app starts
2. **Track user authentication** and profile updates
3. **Monitor onboarding** progress and completion
4. **Log feature usage** with quota enforcement
5. **Track paywall interactions** and conversions
6. **Monitor trial activations** and expirations
7. **Track subscription events** including cancellations
8. **Calculate and display metrics** for business intelligence

Remember to:
- Always wrap analytics calls in try-catch blocks
- Never block UI for analytics operations
- Use the provided constants for consistency
- Test analytics in Firebase DebugView
- Respect user privacy and data protection laws
