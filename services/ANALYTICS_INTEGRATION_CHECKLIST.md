# Analytics Service Integration Checklist

Use this checklist to ensure the analytics service is properly integrated throughout the Nutrilytics app.

## ✅ Setup & Configuration

- [x] Firebase Analytics installed (`@firebase/analytics` in package.json)
- [x] Analytics initialized in `lib/firebase.ts`
- [x] Analytics service created (`services/analyticsService.ts`)
- [ ] Firebase Analytics enabled in Firebase Console
- [ ] measurementId configured in `.env` file
- [ ] Debug mode tested with DebugView

## ✅ User Management Integration

- [ ] Set user ID on sign-up (`analyticsService.setUser()`)
- [ ] Set user ID on sign-in (`analyticsService.setUser()`)
- [ ] Update user properties after profile changes (`analyticsService.updateUserProperties()`)
- [ ] Track app opens (`analyticsService.logAppOpened()`)

## ✅ Onboarding Flow Integration

- [ ] Log onboarding started (`analyticsService.logOnboardingStarted()`)
- [ ] Log onboarding completed with duration (`analyticsService.logOnboardingCompleted()`)
- [ ] Set user properties for allergens (`analyticsService.setUserProperty()`)
- [ ] Set user properties for health goal (`analyticsService.setUserProperty()`)
- [ ] Set user properties for language (`analyticsService.setUserProperty()`)

## ✅ Trial Activation Integration

- [ ] Log trial activation with source (`analyticsService.logTrialActivation()`)
- [ ] Track which tier was selected (monthly/yearly)
- [ ] Set user properties for trial status (`is_in_trial`, `subscription_tier`)
- [ ] Track trial skips/dismissals

## ✅ Barcode Scanner Integration

- [ ] Check quota before scan (`subscriptionService.canUseFeature()`)
- [ ] Log quota exhaustion (`analyticsService.logQuotaExhausted()`)
- [ ] Log paywall impression on quota limit (`analyticsService.logPaywallImpression()`)
- [ ] Increment usage after scan (`subscriptionService.incrementUsage()`)
- [ ] Log barcode scan (`analyticsService.logBarcodeScan()`)
- [ ] Log feature usage with custom params (`analyticsService.logFeatureUsage()`)

## ✅ Photo Scanner Integration

- [ ] Check quota before scan (`subscriptionService.canUseFeature()`)
- [ ] Log quota exhaustion (`analyticsService.logQuotaExhausted()`)
- [ ] Log paywall impression on quota limit (`analyticsService.logPaywallImpression()`)
- [ ] Increment usage after scan (`subscriptionService.incrementUsage()`)
- [ ] Log photo scan (`analyticsService.logPhotoScan()`)
- [ ] Log feature usage with custom params (`analyticsService.logFeatureUsage()`)

## ✅ AI Chat Integration

- [ ] Check quota before message (`subscriptionService.canUseFeature()`)
- [ ] Log quota exhaustion (`analyticsService.logQuotaExhausted()`)
- [ ] Log paywall impression on quota limit (`analyticsService.logPaywallImpression()`)
- [ ] Increment usage after message (`subscriptionService.incrementUsage()`)
- [ ] Log AI message (`analyticsService.logAIMessage()`)
- [ ] Log feature usage with message length (`analyticsService.logFeatureUsage()`)

## ✅ Meal Plan Integration

- [ ] Check premium access (`subscriptionService.canUseFeature()`)
- [ ] Log paywall impression for free users (`analyticsService.logPaywallImpression()`)
- [ ] Log meal plan generation (`analyticsService.logMealPlanGenerated()`)
- [ ] Log meal regeneration (`analyticsService.logFeatureUsage()`)
- [ ] Log feature usage with plan details (`analyticsService.logFeatureUsage()`)

## ✅ Paywall Integration

- [ ] Log paywall impression on mount (`analyticsService.logPaywallImpression()`)
- [ ] Include trigger parameter (scan_limit, ai_coach, meal_plan, trial_end)
- [ ] Log CTA click (`analyticsService.logPaywallCTAClick()`)
- [ ] Include selected tier in CTA click
- [ ] Log paywall dismissal (`analyticsService.logPaywallDismissed()`)
- [ ] Track which tier was selected

## ✅ Subscription Purchase Integration

- [ ] Get subscription status before purchase
- [ ] Determine conversion type (trial_to_paid or free_to_paid)
- [ ] Log conversion with revenue (`analyticsService.logConversion()`)
- [ ] Update user properties (`is_premium`, `subscription_tier`)
- [ ] Track purchase success/failure

## ✅ Subscription Management Integration

- [ ] Display current subscription status
- [ ] Log cancellation with reason (`analyticsService.logCancellation()`)
- [ ] Log renewal events (`analyticsService.logRenewal()`)
- [ ] Track win-back offer impressions
- [ ] Track win-back offer conversions

## ✅ Settings Screen Integration

- [ ] Display subscription status
- [ ] Link to subscription management
- [ ] Track settings changes
- [ ] Display metrics (optional, for debug)

## ✅ Notification Integration

- [ ] Track trial reminder notifications sent
- [ ] Track notification opens
- [ ] Track notification dismissals

## ✅ Error Handling

- [ ] All analytics calls wrapped in try-catch
- [ ] Analytics failures don't crash app
- [ ] Console logging for debugging
- [ ] Graceful degradation on errors

## ✅ Testing

- [ ] Debug mode enabled for development
- [ ] Events visible in Firebase DebugView
- [ ] All event names correct
- [ ] All parameters correct
- [ ] User properties set correctly
- [ ] Daily metrics incrementing
- [ ] Conversion metrics calculating

## ✅ Firebase Console Setup

- [ ] Firebase Analytics enabled
- [ ] Custom events visible in Events tab
- [ ] User properties visible in User Properties tab
- [ ] Audiences created:
  - [ ] Trial users
  - [ ] Premium users
  - [ ] High-value users
  - [ ] Churned users
- [ ] Funnels created:
  - [ ] Onboarding → Trial → Conversion
  - [ ] Paywall → CTA → Purchase
  - [ ] Free → Quota → Paywall → Conversion
- [ ] Google Play Console linked
- [ ] Revenue tracking enabled

## ✅ Documentation

- [ ] Team trained on analytics service
- [ ] Integration examples reviewed
- [ ] Quick reference accessible
- [ ] Troubleshooting guide available

## ✅ Privacy & Compliance

- [ ] No PII in event parameters
- [ ] Privacy policy updated
- [ ] GDPR compliance verified
- [ ] User consent obtained (if required)
- [ ] Data retention policy set

## ✅ Performance

- [ ] Analytics calls don't block UI
- [ ] No performance degradation
- [ ] Firestore writes optimized
- [ ] Caching implemented where appropriate

## ✅ Production Readiness

- [ ] All debug logging removed/disabled
- [ ] Error handling production-ready
- [ ] Firebase quota limits understood
- [ ] Monitoring and alerting set up
- [ ] Backup analytics solution (optional)

## Integration Priority

### High Priority (Must Have)
1. User management (sign-up, sign-in, app open)
2. Trial activation
3. Subscription purchase/conversion
4. Paywall impressions
5. Feature usage (scans, AI, meal plans)
6. Quota exhaustion

### Medium Priority (Should Have)
7. Onboarding flow
8. Subscription cancellation
9. Paywall CTA clicks and dismissals
10. Feature usage details

### Low Priority (Nice to Have)
11. Detailed feature parameters
12. Win-back offer tracking
13. Notification tracking
14. Settings changes

## Common Integration Patterns

### Pattern 1: Feature with Quota Check
```typescript
const canUse = await subscriptionService.canUseFeature(userId, 'feature');
if (!canUse.allowed) {
  await analyticsService.logQuotaExhausted(userId, 'feature_type');
  await analyticsService.logPaywallImpression(userId, 'trigger', false);
  showPaywall();
  return;
}
await subscriptionService.incrementUsage(userId, 'type');
await analyticsService.logFeatureUsage(userId, 'feature', isPremium);
```

### Pattern 2: Paywall Flow
```typescript
// On mount
await analyticsService.logPaywallImpression(userId, trigger, isPremium);

// On CTA click
await analyticsService.logPaywallCTAClick(userId, trigger, tier);

// On purchase success
await analyticsService.logConversion(userId, tier, revenue, conversionType);

// On dismiss
await analyticsService.logPaywallDismissed(userId, trigger);
```

### Pattern 3: Trial Activation
```typescript
const result = await subscriptionService.startFreeTrial(userId, package);
if (result.success) {
  await analyticsService.logTrialActivation(userId, source, tier);
}
```

## Verification Steps

1. **Install app in debug mode**
2. **Enable Firebase DebugView**
3. **Complete user journey:**
   - Sign up
   - Complete onboarding
   - Start trial
   - Use features
   - Hit quota limits
   - View paywall
   - Purchase subscription
4. **Verify events in DebugView:**
   - All events firing
   - Parameters correct
   - User properties set
5. **Check Firestore:**
   - Daily metrics updating
   - DAU tracking working
   - Aggregated metrics present
6. **Wait 24 hours**
7. **Check Firebase Analytics dashboard:**
   - Events in standard reports
   - User properties visible
   - Audiences populating
   - Funnels working

## Troubleshooting

### Events not appearing
- Check Firebase initialization
- Verify measurementId in config
- Enable debug mode
- Check console for errors
- Wait 24 hours for standard reports

### Metrics not calculating
- Check Firestore security rules
- Verify aggregated_metrics document exists
- Check for Firestore write errors
- Verify increment() calls working

### User properties not set
- Check setUserProperties() calls
- Verify Firebase Analytics initialized
- Check for errors in console
- Wait for property propagation

## Support Resources

- **Service Guide**: `services/ANALYTICS_SERVICE_GUIDE.md`
- **Integration Examples**: `services/ANALYTICS_INTEGRATION_EXAMPLE.md`
- **Quick Reference**: `services/ANALYTICS_QUICK_REFERENCE.md`
- **Implementation Summary**: `services/TASK_5_IMPLEMENTATION_SUMMARY.md`
- **Firebase Docs**: https://firebase.google.com/docs/analytics

## Sign-off

- [ ] Analytics service fully integrated
- [ ] All events tested and verified
- [ ] Firebase Console configured
- [ ] Team trained
- [ ] Documentation complete
- [ ] Production ready

**Completed by:** _________________  
**Date:** _________________  
**Verified by:** _________________  
**Date:** _________________
