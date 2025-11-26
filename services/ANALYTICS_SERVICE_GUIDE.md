# Analytics Service Guide

## Overview

The Analytics Service provides comprehensive event tracking and metrics calculation for Nutrilytics. It integrates with Firebase Analytics to track user behavior, subscription conversions, feature usage, and business metrics.

## Features

- **Trial & Subscription Tracking**: Monitor trial activations, conversions, renewals, and cancellations
- **Feature Usage Analytics**: Track barcode scans, photo scans, AI messages, and meal plan generation
- **Paywall Analytics**: Monitor paywall impressions, clicks, and conversions
- **Conversion Metrics**: Calculate trial-to-paid, free-to-paid conversion rates, and churn
- **User Segmentation**: Set user properties for targeted analysis
- **Daily Metrics**: Aggregate daily statistics for business intelligence

## Installation

The Analytics Service is already configured and ready to use. Firebase Analytics is initialized in `lib/firebase.ts`.

## Usage

### Import the Service

```typescript
import { analyticsService, ANALYTICS_EVENTS, USER_PROPERTIES } from '../services/analyticsService';
```

### Set User Identity

When a user signs in or signs up:

```typescript
// Set user ID
analyticsService.setUser(userId);

// Update user properties
await analyticsService.updateUserProperties(userId);
```

### Track Trial Activation

When a user starts a free trial:

```typescript
await analyticsService.logTrialActivation(
  userId,
  'onboarding', // acquisition source: 'onboarding', 'paywall', 'settings'
  'monthly' // tier: 'monthly', 'yearly', 'lifetime'
);
```

### Track Conversions

When a user converts from trial or free to paid:

```typescript
// Trial to paid conversion
await analyticsService.logConversion(
  userId,
  'yearly', // subscription tier
  999, // revenue in INR
  'trial_to_paid'
);

// Free to paid conversion
await analyticsService.logConversion(
  userId,
  'monthly',
  199,
  'free_to_paid'
);
```

### Track Feature Usage

#### Barcode Scan

```typescript
await analyticsService.logBarcodeScan(
  userId,
  isPremium,
  'Maggi Noodles' // optional product name
);
```

#### Photo Scan

```typescript
await analyticsService.logPhotoScan(userId, isPremium);
```

#### AI Message

```typescript
await analyticsService.logAIMessage(
  userId,
  isPremium,
  message.length // message length in characters
);
```

#### Meal Plan Generation

```typescript
await analyticsService.logMealPlanGenerated(
  userId,
  'weekly' // plan type: 'weekly', 'monthly'
);
```

### Track Paywall Events

#### Paywall Impression

```typescript
await analyticsService.logPaywallImpression(
  userId,
  'scan_limit', // trigger: 'scan_limit', 'ai_coach', 'meal_plan', 'trial_end'
  isPremium
);
```

#### Paywall CTA Click

```typescript
await analyticsService.logPaywallCTAClick(
  userId,
  'scan_limit',
  'yearly' // selected tier
);
```

#### Paywall Dismissed

```typescript
await analyticsService.logPaywallDismissed(userId, 'scan_limit');
```

### Track Subscription Events

#### Cancellation

```typescript
await analyticsService.logCancellation(
  userId,
  'too_expensive', // reason
  'monthly' // tier
);
```

#### Renewal

```typescript
await analyticsService.logRenewal(
  userId,
  'yearly',
  999 // revenue
);
```

### Track User Journey

#### Onboarding

```typescript
// Onboarding started
await analyticsService.logOnboardingStarted(userId);

// Onboarding completed
await analyticsService.logOnboardingCompleted(
  userId,
  120 // duration in seconds
);
```

#### App Opened

```typescript
await analyticsService.logAppOpened(userId);
```

### Track Quota Events

```typescript
await analyticsService.logQuotaExhausted(
  userId,
  'barcode_scan' // quota type: 'barcode_scan', 'photo_scan', 'ai_message'
);
```

### Get Conversion Metrics

```typescript
const metrics = await analyticsService.getConversionMetrics(30); // last 30 days

console.log('Trial to Paid Rate:', metrics.trialToPayRate + '%');
console.log('Free to Paid Rate:', metrics.freeToPayRate + '%');
console.log('Churn Rate:', metrics.churnRate + '%');
console.log('Average Revenue Per User:', '₹' + metrics.averageRevenuePerUser);
console.log('Daily Active Users:', metrics.dailyActiveUsers);
```

### Get Daily Metrics

```typescript
const today = new Date();
const dailyMetrics = await analyticsService.getDailyMetrics(today);

if (dailyMetrics) {
  console.log('Daily Active Users:', dailyMetrics.dailyActiveUsers);
  console.log('Trial Activations:', dailyMetrics.trialActivations);
  console.log('Conversions:', dailyMetrics.conversions);
  console.log('Revenue:', dailyMetrics.revenue);
  console.log('Barcode Scans:', dailyMetrics.barcodeScans);
  console.log('Photo Scans:', dailyMetrics.photoScans);
  console.log('AI Messages:', dailyMetrics.aiMessages);
  console.log('Meal Plans Generated:', dailyMetrics.mealPlansGenerated);
  console.log('Paywall Impressions:', dailyMetrics.paywallImpressions);
}
```

## Integration Examples

### Example 1: Barcode Scanner Component

```typescript
import { analyticsService } from '../services/analyticsService';
import { SubscriptionService } from '../services/subscriptionService';

const BarcodeScanner = ({ userId }) => {
  const subscriptionService = SubscriptionService.getInstance();

  const handleScan = async (barcode: string) => {
    // Check if user can scan
    const canScan = await subscriptionService.canUseFeature(userId, 'barcode_scan');
    
    if (!canScan.allowed) {
      // Log quota exhaustion
      await analyticsService.logQuotaExhausted(userId, 'barcode_scan');
      
      // Show paywall
      await analyticsService.logPaywallImpression(userId, 'scan_limit', false);
      showPaywall();
      return;
    }

    // Increment usage
    await subscriptionService.incrementUsage(userId, 'barcode');

    // Log scan
    const isPremium = await subscriptionService.checkPremiumAccess(userId);
    await analyticsService.logBarcodeScan(userId, isPremium, productName);

    // Process scan...
  };

  return (
    // Scanner UI
  );
};
```

### Example 2: AI Chat Component

```typescript
import { analyticsService } from '../services/analyticsService';
import { SubscriptionService } from '../services/subscriptionService';

const AIChatInterface = ({ userId }) => {
  const subscriptionService = SubscriptionService.getInstance();

  const handleSendMessage = async (message: string) => {
    // Check if user can use AI coach
    const canUse = await subscriptionService.canUseFeature(userId, 'ai_coach');
    
    if (!canUse.allowed) {
      // Log quota exhaustion
      await analyticsService.logQuotaExhausted(userId, 'ai_message');
      
      // Show paywall
      await analyticsService.logPaywallImpression(userId, 'ai_coach', false);
      showPaywall();
      return;
    }

    // Increment usage
    await subscriptionService.incrementUsage(userId, 'ai');

    // Log message
    const isPremium = await subscriptionService.checkPremiumAccess(userId);
    await analyticsService.logAIMessage(userId, isPremium, message.length);

    // Send message to AI...
  };

  return (
    // Chat UI
  );
};
```

### Example 3: Subscription Purchase Flow

```typescript
import { analyticsService } from '../services/analyticsService';
import { SubscriptionService } from '../services/subscriptionService';

const SubscriptionPaywall = ({ userId, trigger }) => {
  const subscriptionService = SubscriptionService.getInstance();

  useEffect(() => {
    // Log paywall impression
    const logImpression = async () => {
      const isPremium = await subscriptionService.checkPremiumAccess(userId);
      await analyticsService.logPaywallImpression(userId, trigger, isPremium);
    };
    logImpression();
  }, []);

  const handleSubscribe = async (tier: string) => {
    // Log CTA click
    await analyticsService.logPaywallCTAClick(userId, trigger, tier);

    // Handle purchase
    const result = await subscriptionService.handlePurchase(userId, tier);

    if (result.success) {
      // Determine conversion type
      const status = await subscriptionService.getSubscriptionStatus(userId);
      const conversionType = status.isInTrial ? 'trial_to_paid' : 'free_to_paid';

      // Get tier price
      const tierPrices = { monthly: 199, yearly: 999, lifetime: 2999 };
      const revenue = tierPrices[tier];

      // Log conversion
      await analyticsService.logConversion(userId, tier, revenue, conversionType);
    }
  };

  const handleDismiss = async () => {
    await analyticsService.logPaywallDismissed(userId, trigger);
  };

  return (
    // Paywall UI
  );
};
```

### Example 4: Trial Activation

```typescript
import { analyticsService } from '../services/analyticsService';
import { SubscriptionService } from '../services/subscriptionService';

const TrialActivationScreen = ({ userId, source }) => {
  const subscriptionService = SubscriptionService.getInstance();

  const handleStartTrial = async (tier: string, packageToPurchase: any) => {
    // Start trial
    const result = await subscriptionService.startFreeTrial(userId, packageToPurchase);

    if (result.success) {
      // Log trial activation
      await analyticsService.logTrialActivation(userId, source, tier);

      // Navigate to home
      navigation.navigate('Home');
    }
  };

  return (
    // Trial activation UI
  );
};
```

## Event Reference

### Trial & Subscription Events

- `trial_activation`: User starts free trial
- `trial_reminder_sent`: Reminder notification sent
- `trial_expired`: Trial period ended
- `subscription_purchased`: User purchases subscription
- `subscription_renewed`: Subscription auto-renewed
- `subscription_cancelled`: User cancels subscription
- `subscription_restored`: User restores previous purchase

### Conversion Events

- `trial_to_paid_conversion`: User converts from trial to paid
- `free_to_paid_conversion`: User converts from free to paid

### Feature Usage Events

- `feature_used`: Generic feature usage
- `barcode_scan`: Barcode scan performed
- `photo_scan`: Photo scan performed
- `ai_message_sent`: AI message sent
- `meal_plan_generated`: Meal plan generated
- `meal_regenerated`: Individual meal regenerated

### Paywall Events

- `paywall_impression`: Paywall shown to user
- `paywall_dismissed`: User dismisses paywall
- `paywall_cta_clicked`: User clicks paywall CTA

### Quota Events

- `quota_exhausted`: User reaches daily quota limit
- `quota_reset`: Daily quota reset

### User Journey Events

- `onboarding_started`: User starts onboarding
- `onboarding_completed`: User completes onboarding
- `onboarding_abandoned`: User abandons onboarding

### Engagement Events

- `app_opened`: User opens app
- `session_start`: User session starts
- `session_end`: User session ends

## User Properties

- `subscription_tier`: Current subscription tier (free, monthly, yearly, lifetime)
- `is_premium`: Whether user has premium access
- `is_in_trial`: Whether user is in trial period
- `days_since_signup`: Days since user signed up
- `allergen_count`: Number of allergens in user profile
- `health_goal`: User's health goal (weight_loss, muscle_gain, maintenance)
- `preferred_language`: User's preferred language
- `acquisition_source`: How user acquired the app

## Firestore Schema

### Daily Metrics

```
/analytics/daily_metrics/{YYYY-MM-DD}/data
  - date: string
  - dailyActiveUsers: number
  - trialActivations: number
  - conversions: number
  - revenue: number
  - churnCount: number
  - barcodeScans: number
  - photoScans: number
  - aiMessages: number
  - mealPlansGenerated: number
  - paywallImpressions: number
  - paywallConversions: number
  - updatedAt: timestamp
```

### Daily Active Users

```
/analytics/daily_active_users/{YYYY-MM-DD}/{userId}
  - lastSeen: timestamp
```

### Aggregated Metrics

```
/analytics/aggregated_metrics
  - totalTrialActivations: number
  - trialToPayConversions: number
  - totalFreeUsers: number
  - freeToPayConversions: number
  - totalPaidUsers: number
  - totalChurns: number
  - totalRevenue: number
  - dailyActiveUsers: number
  - updatedAt: timestamp
```

## Firebase Console Setup

### 1. Enable Firebase Analytics

1. Go to Firebase Console → Your Project
2. Navigate to Analytics → Dashboard
3. Analytics should be automatically enabled

### 2. Create Custom Events

Custom events are automatically logged by the SDK. View them in:
- Firebase Console → Analytics → Events

### 3. Create Custom Audiences

1. Go to Analytics → Audiences
2. Create audiences for:
   - Trial users (is_in_trial = true)
   - Premium users (is_premium = true)
   - High-value users (revenue > 999)
   - Churned users (subscription_cancelled in last 30 days)

### 4. Set Up Conversion Funnels

1. Go to Analytics → Funnels
2. Create funnels for:
   - Onboarding → Trial Activation → Conversion
   - Paywall Impression → CTA Click → Purchase
   - Free User → Quota Exhausted → Paywall → Conversion

### 5. Link to Google Play Console

1. Go to Project Settings → Integrations
2. Link Google Play Console
3. Enable automatic revenue tracking

## Best Practices

1. **Always log events asynchronously**: Don't block UI for analytics
2. **Use try-catch blocks**: Analytics should never crash the app
3. **Be consistent with naming**: Use the provided constants
4. **Don't over-track**: Focus on actionable metrics
5. **Respect user privacy**: Follow GDPR and data protection laws
6. **Test analytics**: Use Firebase DebugView during development
7. **Monitor quota**: Firebase has daily event limits on free tier

## Testing

### Enable Debug Mode

For Android:

```bash
adb shell setprop debug.firebase.analytics.app com.nutrilytics
```

For iOS:

Add `-FIRDebugEnabled` to Xcode scheme arguments.

### View Debug Events

1. Go to Firebase Console → Analytics → DebugView
2. Events will appear in real-time
3. Verify event names and parameters

## Troubleshooting

### Events not appearing in Firebase Console

- Wait 24 hours for events to appear in standard reports
- Use DebugView for real-time testing
- Check that Firebase is properly initialized
- Verify measurementId is set in config

### Analytics not working on Android

- Ensure Google Play Services is installed
- Check that app has internet permission
- Verify Firebase config is correct

### Metrics calculation errors

- Ensure Firestore security rules allow analytics writes
- Check that aggregated_metrics document exists
- Verify Cloud Functions are deployed (if using)

## Future Enhancements

1. **Cloud Functions for Aggregation**: Automate daily metrics calculation
2. **BigQuery Export**: Export analytics data for advanced analysis
3. **Custom Dashboards**: Build admin dashboard for real-time metrics
4. **A/B Testing**: Integrate Firebase Remote Config for experiments
5. **Predictive Analytics**: Use ML to predict churn and conversions

## Support

For issues or questions:
- Check Firebase Analytics documentation
- Review Firestore security rules
- Contact development team
