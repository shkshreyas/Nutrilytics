# Analytics Service Quick Reference

## Import

```typescript
import { analyticsService, ANALYTICS_EVENTS, USER_PROPERTIES } from '../services/analyticsService';
```

## Common Operations

### Set User

```typescript
analyticsService.setUser(userId);
```

### Update User Properties

```typescript
await analyticsService.updateUserProperties(userId);
```

### Log App Opened

```typescript
await analyticsService.logAppOpened(userId);
```

## Trial & Subscription

### Trial Activation

```typescript
await analyticsService.logTrialActivation(userId, 'onboarding', 'yearly');
```

### Conversion

```typescript
// Trial to paid
await analyticsService.logConversion(userId, 'yearly', 999, 'trial_to_paid');

// Free to paid
await analyticsService.logConversion(userId, 'monthly', 199, 'free_to_paid');
```

### Cancellation

```typescript
await analyticsService.logCancellation(userId, 'too_expensive', 'monthly');
```

### Renewal

```typescript
await analyticsService.logRenewal(userId, 'yearly', 999);
```

## Feature Usage

### Barcode Scan

```typescript
await analyticsService.logBarcodeScan(userId, isPremium, 'Product Name');
```

### Photo Scan

```typescript
await analyticsService.logPhotoScan(userId, isPremium);
```

### AI Message

```typescript
await analyticsService.logAIMessage(userId, isPremium, message.length);
```

### Meal Plan

```typescript
await analyticsService.logMealPlanGenerated(userId, 'weekly');
```

### Generic Feature

```typescript
await analyticsService.logFeatureUsage(userId, 'feature_name', isPremium, {
  custom_param: 'value'
});
```

## Paywall

### Impression

```typescript
await analyticsService.logPaywallImpression(userId, 'scan_limit', isPremium);
```

### CTA Click

```typescript
await analyticsService.logPaywallCTAClick(userId, 'scan_limit', 'yearly');
```

### Dismissed

```typescript
await analyticsService.logPaywallDismissed(userId, 'scan_limit');
```

## Quota

### Exhausted

```typescript
await analyticsService.logQuotaExhausted(userId, 'barcode_scan');
```

## Onboarding

### Started

```typescript
await analyticsService.logOnboardingStarted(userId);
```

### Completed

```typescript
await analyticsService.logOnboardingCompleted(userId, durationSeconds);
```

## Metrics

### Get Conversion Metrics

```typescript
const metrics = await analyticsService.getConversionMetrics(30); // last 30 days

// Returns:
// {
//   trialToPayRate: number,
//   freeToPayRate: number,
//   churnRate: number,
//   averageRevenuePerUser: number,
//   dailyActiveUsers: number
// }
```

### Get Daily Metrics

```typescript
const dailyMetrics = await analyticsService.getDailyMetrics(new Date());

// Returns:
// {
//   date: string,
//   dailyActiveUsers: number,
//   trialActivations: number,
//   conversions: number,
//   revenue: number,
//   churnCount: number,
//   barcodeScans: number,
//   photoScans: number,
//   aiMessages: number,
//   mealPlansGenerated: number,
//   paywallImpressions: number,
//   paywallConversions: number
// }
```

## Event Names (Constants)

```typescript
ANALYTICS_EVENTS.TRIAL_ACTIVATION
ANALYTICS_EVENTS.TRIAL_TO_PAID_CONVERSION
ANALYTICS_EVENTS.FREE_TO_PAID_CONVERSION
ANALYTICS_EVENTS.SUBSCRIPTION_CANCELLED
ANALYTICS_EVENTS.SUBSCRIPTION_RENEWED
ANALYTICS_EVENTS.BARCODE_SCAN
ANALYTICS_EVENTS.PHOTO_SCAN
ANALYTICS_EVENTS.AI_MESSAGE_SENT
ANALYTICS_EVENTS.MEAL_PLAN_GENERATED
ANALYTICS_EVENTS.PAYWALL_IMPRESSION
ANALYTICS_EVENTS.PAYWALL_CTA_CLICKED
ANALYTICS_EVENTS.PAYWALL_DISMISSED
ANALYTICS_EVENTS.QUOTA_EXHAUSTED
ANALYTICS_EVENTS.ONBOARDING_STARTED
ANALYTICS_EVENTS.ONBOARDING_COMPLETED
ANALYTICS_EVENTS.APP_OPENED
```

## User Properties (Constants)

```typescript
USER_PROPERTIES.SUBSCRIPTION_TIER
USER_PROPERTIES.IS_PREMIUM
USER_PROPERTIES.IS_IN_TRIAL
USER_PROPERTIES.DAYS_SINCE_SIGNUP
USER_PROPERTIES.ALLERGEN_COUNT
USER_PROPERTIES.HEALTH_GOAL
USER_PROPERTIES.PREFERRED_LANGUAGE
USER_PROPERTIES.ACQUISITION_SOURCE
```

## Paywall Triggers

- `'scan_limit'` - User reached daily scan limit
- `'ai_coach'` - User tried to access AI coach
- `'meal_plan'` - User tried to generate meal plan
- `'trial_end'` - User's trial is ending
- `'settings'` - User clicked upgrade in settings

## Subscription Tiers

- `'monthly'` - Monthly subscription (₹199)
- `'yearly'` - Annual subscription (₹999)
- `'lifetime'` - Lifetime access (₹2,999)

## Conversion Types

- `'trial_to_paid'` - User converted from trial to paid
- `'free_to_paid'` - User converted from free to paid

## Quota Types

- `'barcode_scan'` - Barcode scan quota
- `'photo_scan'` - Photo scan quota
- `'ai_message'` - AI message quota

## Best Practices

1. **Always use try-catch** around analytics calls
2. **Don't block UI** - analytics should be async
3. **Use constants** for event names and properties
4. **Log early** - track events as they happen
5. **Be consistent** - use the same naming conventions
6. **Test in DebugView** - verify events before production
7. **Respect privacy** - follow GDPR and data protection laws

## Testing

### Enable Debug Mode (Android)

```bash
adb shell setprop debug.firebase.analytics.app com.nutrilytics
```

### View Events

Firebase Console → Analytics → DebugView

## Common Patterns

### Feature with Quota Check

```typescript
const canUse = await subscriptionService.canUseFeature(userId, 'barcode_scan');

if (!canUse.allowed) {
  await analyticsService.logQuotaExhausted(userId, 'barcode_scan');
  await analyticsService.logPaywallImpression(userId, 'scan_limit', false);
  showPaywall();
  return;
}

await subscriptionService.incrementUsage(userId, 'barcode');
const isPremium = await subscriptionService.checkPremiumAccess(userId);
await analyticsService.logBarcodeScan(userId, isPremium);
```

### Paywall Flow

```typescript
// On mount
await analyticsService.logPaywallImpression(userId, trigger, isPremium);

// On CTA click
await analyticsService.logPaywallCTAClick(userId, trigger, selectedTier);

// On purchase success
await analyticsService.logConversion(userId, tier, revenue, conversionType);

// On dismiss
await analyticsService.logPaywallDismissed(userId, trigger);
```

### Trial Activation Flow

```typescript
const result = await subscriptionService.startFreeTrial(userId, packageToPurchase);

if (result.success) {
  await analyticsService.logTrialActivation(userId, 'onboarding', tier);
}
```

## Troubleshooting

### Events not showing in Firebase Console

- Wait 24 hours for standard reports
- Use DebugView for real-time testing
- Check Firebase initialization
- Verify measurementId in config

### Analytics not working

- Check internet connection
- Verify Firebase config
- Enable debug mode
- Check console for errors

## Support

- Firebase Analytics Docs: https://firebase.google.com/docs/analytics
- Firebase Console: https://console.firebase.google.com
- DebugView: Firebase Console → Analytics → DebugView
