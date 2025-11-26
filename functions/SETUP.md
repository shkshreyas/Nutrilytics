# Cloud Functions Setup Guide

Quick setup guide for Nutrilytics Firebase Cloud Functions.

## Quick Start

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Build Functions

```bash
npm run build
```

### 3. Configure Webhook Secret

```bash
firebase functions:config:set revenuecat.webhook_secret="$(openssl rand -base64 32)"
```

Save the generated secret - you'll need it for RevenueCat configuration.

### 4. Deploy

```bash
npm run deploy
```

## What Gets Deployed

### HTTP Functions

1. **revenueCatWebhook** - Handles subscription events from RevenueCat
   - URL: `https://[region]-[project].cloudfunctions.net/revenueCatWebhook`
   - Method: POST
   - Auth: Bearer token

### Scheduled Functions

2. **scheduledQuotaReset** - Resets daily usage quotas
   - Schedule: Daily at midnight UTC
   - Resets: barcode scans, photo scans, AI messages

3. **scheduledTrialCheck** - Manages trial expirations
   - Schedule: Every 6 hours
   - Actions: Send reminders, handle expirations, manage grace periods

## Event Handling

The webhook handles these RevenueCat events:

| Event | Action |
|-------|--------|
| INITIAL_PURCHASE | Create subscription record, start trial |
| RENEWAL | Update subscription, clear grace period |
| CANCELLATION | Mark cancelled, create win-back offer |
| UNCANCELLATION | Reactivate subscription |
| NON_RENEWING_PURCHASE | Handle lifetime purchase |
| EXPIRATION | Deactivate subscription |
| BILLING_ISSUE | Set grace period, notify user |
| PRODUCT_CHANGE | Update subscription tier |

## Data Flow

### Trial Activation
```
User starts trial → RevenueCat webhook → Cloud Function
  → Update Firestore subscription data
  → Initialize usage quota
  → Cache premium status
```

### Trial Expiration
```
Scheduled function runs → Check trial end dates
  → Day 12: Send reminder notification
  → Day 14: Handle expiration
    → If cancelled: Revert to free tier
    → If not cancelled: Wait for auto-charge webhook
```

### Subscription Renewal
```
RevenueCat auto-charges → Webhook event → Cloud Function
  → Update subscription data
  → Clear grace period
  → Update premium status
```

### Payment Failure
```
Payment fails → Billing issue webhook → Cloud Function
  → Set 3-day grace period
  → Send notification to user
  → If grace period expires: Deactivate subscription
```

## Firestore Structure

### Created/Updated Collections

```
/users/{userId}/subscription/data
  - tier: 'monthly' | 'yearly' | 'lifetime' | 'trial' | 'free'
  - isActive: boolean
  - trialStartedAt: timestamp
  - trialEndsAt: timestamp
  - subscriptionStartedAt: timestamp
  - subscriptionEndsAt: timestamp
  - isCancelled: boolean
  - billingIssue: boolean
  - gracePeriodEndsAt: timestamp
  - reminderSent: boolean

/users/{userId}/subscription/winback
  - discountPercent: 50
  - durationMonths: 3
  - expiresAt: timestamp

/users/{userId}/usage/data
  - barcodeScansToday: number
  - photoScansToday: number
  - aiMessagesToday: number
  - lastResetAt: timestamp

/users/{userId}/notifications/{notificationId}
  - type: string
  - title: string
  - body: string
  - data: object
  - read: boolean
  - createdAt: timestamp

/analytics/metrics
  - quotaResets: { date: { totalUsersReset, timestamp } }
  - trialMetrics: { date: { trialsExpiringSoon, trialsExpired, ... } }
```

## Testing

### Local Testing

1. Start emulator:
```bash
npm run serve
```

2. Test webhook:
```bash
curl -X POST http://localhost:5001/YOUR_PROJECT/us-central1/revenueCatWebhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SECRET" \
  -d @test-payload.json
```

### Production Testing

1. Use RevenueCat "Send Test" button
2. Monitor logs:
```bash
firebase functions:log --only revenueCatWebhook
```

## Monitoring

### View Logs

```bash
# All functions
npm run logs

# Specific function
firebase functions:log --only revenueCatWebhook

# Follow logs in real-time
firebase functions:log --only revenueCatWebhook --follow
```

### Firebase Console

1. Go to Firebase Console → Functions
2. View metrics, logs, and health
3. Set up alerts for errors

## Common Issues

### Webhook Returns 401

- Check authorization header in RevenueCat
- Verify webhook secret matches: `firebase functions:config:get`

### Scheduled Function Not Running

- Check Firebase Console → Functions → Logs
- Verify schedule in function details
- May take up to 1 hour for first run after deployment

### Firestore Permission Denied

- Deploy Firestore rules: `firebase deploy --only firestore:rules`
- Verify rules allow Cloud Functions to write

### High Execution Time

- Check Firestore query efficiency
- Add indexes: `firebase deploy --only firestore:indexes`
- Optimize batch operations

## Security

### Webhook Authentication

The webhook validates requests using Bearer token:
```typescript
Authorization: Bearer YOUR_WEBHOOK_SECRET
```

### Firestore Rules

Cloud Functions bypass Firestore rules, but client access is restricted:
- Users can read their own subscription data
- Only Cloud Functions can write subscription data
- Users can update usage counters (for client-side tracking)

### Environment Variables

Never commit secrets to git:
- Use Firebase config: `firebase functions:config:set`
- Access in code: `functions.config().revenuecat.webhook_secret`

## Performance

### Optimization Tips

1. **Batch Operations**: Process multiple users in single invocation
2. **Indexes**: Deploy Firestore indexes for queries
3. **Caching**: Cache frequently accessed data
4. **Timeouts**: Set appropriate timeout (default: 60s)
5. **Memory**: Use minimum required (default: 256MB)

### Current Performance

- Webhook response time: < 500ms
- Quota reset: ~1-2 seconds per 100 users
- Trial check: ~2-3 seconds per 100 users

## Costs

### Free Tier

- Cloud Functions: 2M invocations/month
- Firestore: 50K reads, 20K writes/day
- Cloud Scheduler: 3 jobs free

### Estimated Usage

For 10,000 users:
- Webhook: ~1,000 invocations/month (100 events/day)
- Quota reset: 30 invocations/month (daily)
- Trial check: 180 invocations/month (every 6 hours)
- Total: ~1,210 invocations/month (well within free tier)

## Next Steps

1. ✅ Deploy functions
2. ✅ Configure RevenueCat webhook
3. ✅ Test webhook with sample payload
4. ✅ Deploy Firestore rules and indexes
5. ✅ Monitor logs for first few days
6. ✅ Set up alerts in Firebase Console
7. ✅ Integrate push notifications (optional)
8. ✅ Add email notifications (optional)

## Support

- Firebase Docs: https://firebase.google.com/docs/functions
- RevenueCat Docs: https://docs.revenuecat.com/docs/webhooks
- Issues: Create issue in project repository
