# Nutrilytics Firebase Cloud Functions

This directory contains Firebase Cloud Functions for managing subscription webhooks and scheduled tasks.

## Functions Overview

### HTTP Functions

#### `revenueCatWebhook`
- **Trigger:** HTTP POST request from RevenueCat
- **Purpose:** Handle subscription lifecycle events (purchase, renewal, cancellation, etc.)
- **URL:** `https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/revenueCatWebhook`

### Scheduled Functions

#### `scheduledQuotaReset`
- **Trigger:** Daily at midnight UTC
- **Purpose:** Reset daily usage quotas for free users
- **Schedule:** `0 0 * * *` (cron format)

#### `scheduledTrialCheck`
- **Trigger:** Every 6 hours
- **Purpose:** Check for trial expirations, send reminders, handle grace periods
- **Schedule:** `0 */6 * * *` (cron format)

## Setup Instructions

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Configure Firebase

Make sure you have Firebase CLI installed:

```bash
npm install -g firebase-tools
firebase login
```

Initialize Firebase in your project root (if not already done):

```bash
firebase init functions
```

Select:
- TypeScript
- ESLint (optional)
- Install dependencies

### 3. Set Environment Variables

Set the RevenueCat webhook secret:

```bash
firebase functions:config:set revenuecat.webhook_secret="YOUR_WEBHOOK_SECRET"
```

To view current config:

```bash
firebase functions:config:get
```

### 4. Build Functions

```bash
npm run build
```

### 5. Deploy Functions

Deploy all functions:

```bash
npm run deploy
```

Or deploy specific functions:

```bash
firebase deploy --only functions:revenueCatWebhook
firebase deploy --only functions:scheduledQuotaReset
firebase deploy --only functions:scheduledTrialCheck
```

## RevenueCat Webhook Configuration

### 1. Get Your Function URL

After deployment, get your webhook URL:

```bash
firebase functions:list
```

Look for `revenueCatWebhook` and copy the URL.

### 2. Configure in RevenueCat Dashboard

1. Go to RevenueCat Dashboard → Project Settings → Webhooks
2. Click "Add Webhook"
3. Enter your function URL: `https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/revenueCatWebhook`
4. Set Authorization Header: `Bearer YOUR_WEBHOOK_SECRET`
5. Enable these events:
   - Initial Purchase
   - Renewal
   - Cancellation
   - Uncancellation
   - Non-Renewing Purchase
   - Expiration
   - Billing Issue
   - Product Change

### 3. Test Webhook

RevenueCat provides a "Send Test" button to verify your webhook is working.

## Local Development

### Run Functions Locally

```bash
npm run serve
```

This starts the Firebase emulator. Your functions will be available at:
- `http://localhost:5001/YOUR_PROJECT/YOUR_REGION/revenueCatWebhook`

### Test Webhook Locally

Use a tool like Postman or curl to send test payloads:

```bash
curl -X POST http://localhost:5001/YOUR_PROJECT/YOUR_REGION/revenueCatWebhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_WEBHOOK_SECRET" \
  -d @test-payload.json
```

## Monitoring

### View Logs

```bash
npm run logs
```

Or view specific function logs:

```bash
firebase functions:log --only revenueCatWebhook
```

### Firebase Console

View logs, metrics, and errors in the Firebase Console:
- Go to Firebase Console → Functions
- Click on a function to see details
- View logs, metrics, and health

## Firestore Data Structure

### Subscription Data
```
/users/{userId}/subscription/data
  - tier: string
  - isActive: boolean
  - trialStartedAt: timestamp
  - trialEndsAt: timestamp
  - subscriptionStartedAt: timestamp
  - subscriptionEndsAt: timestamp
  - revenueCatCustomerId: string
  - lastPaymentAmount: number
  - lastPaymentCurrency: string
  - lastPaymentDate: timestamp
  - isCancelled: boolean
  - cancelledAt: timestamp
  - cancellationReason: string
  - billingIssue: boolean
  - gracePeriodEndsAt: timestamp
  - reminderSent: boolean
```

### Usage Data
```
/users/{userId}/usage/data
  - barcodeScansToday: number
  - photoScansToday: number
  - aiMessagesToday: number
  - lastResetAt: timestamp
```

### Win-back Offer
```
/users/{userId}/subscription/winback
  - discountPercent: number
  - durationMonths: number
  - expiresAt: timestamp
  - createdAt: timestamp
```

### Notifications
```
/users/{userId}/notifications/{notificationId}
  - type: string
  - title: string
  - body: string
  - data: object
  - read: boolean
  - createdAt: timestamp
```

## Error Handling

All functions include comprehensive error handling:
- Webhook validation failures return 401
- Invalid payloads return 400
- Processing errors return 500
- All errors are logged to Firebase Console

## Security

- Webhook authentication via Bearer token
- Firestore security rules should restrict write access to Cloud Functions
- Environment variables stored securely in Firebase config

## Troubleshooting

### Webhook Not Receiving Events

1. Check RevenueCat webhook configuration
2. Verify authorization header matches your secret
3. Check Firebase function logs for errors
4. Ensure function is deployed and active

### Quota Reset Not Working

1. Check scheduled function logs
2. Verify cron schedule is correct
3. Ensure function has Firestore write permissions

### Trial Reminders Not Sending

1. Check trial expiration function logs
2. Verify notification collection is being written
3. Integrate with push notification service (FCM)

## Cost Considerations

### Free Tier Limits
- Cloud Functions: 2M invocations/month
- Firestore: 50K reads, 20K writes/day

### Optimization Tips
- Batch Firestore operations where possible
- Use caching to reduce reads
- Monitor function execution time
- Set appropriate timeout limits

## Future Enhancements

- [ ] Integrate with Firebase Cloud Messaging for push notifications
- [ ] Add email notifications via SendGrid/Mailgun
- [ ] Implement A/B testing for win-back offers
- [ ] Add analytics dashboard
- [ ] Implement fraud detection
- [ ] Add subscription upgrade/downgrade logic
- [ ] Create admin API for subscription management
