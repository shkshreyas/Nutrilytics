# Firebase Cloud Functions Deployment Guide

This guide walks you through deploying the Nutrilytics Cloud Functions for subscription management.

## Prerequisites

1. **Firebase Project**: You must have a Firebase project created
2. **Firebase CLI**: Install globally with `npm install -g firebase-tools`
3. **Node.js**: Version 18 or higher
4. **RevenueCat Account**: With Android app configured
5. **Google Play Console**: With subscription products created

## Step-by-Step Deployment

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

This will open a browser window for authentication.

### 3. Initialize Firebase Project

From your project root directory:

```bash
firebase init
```

Select:
- **Functions**: Configure Cloud Functions
- **Firestore**: Configure Firestore database
- Choose **Use an existing project**
- Select your Firebase project
- Choose **TypeScript** for Cloud Functions
- Choose **Yes** for ESLint (optional)
- Choose **Yes** to install dependencies

### 4. Install Function Dependencies

```bash
cd functions
npm install
```

### 5. Configure Environment Variables

Set the RevenueCat webhook secret:

```bash
firebase functions:config:set revenuecat.webhook_secret="YOUR_WEBHOOK_SECRET_HERE"
```

**Where to find your webhook secret:**
- Generate a secure random string (e.g., using `openssl rand -base64 32`)
- Store it securely - you'll need it for RevenueCat configuration

To verify configuration:

```bash
firebase functions:config:get
```

### 6. Build Functions

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `lib/` directory.

### 7. Deploy Functions

Deploy all functions:

```bash
npm run deploy
```

Or deploy from project root:

```bash
firebase deploy --only functions
```

To deploy specific functions:

```bash
firebase deploy --only functions:revenueCatWebhook
firebase deploy --only functions:scheduledQuotaReset
firebase deploy --only functions:scheduledTrialCheck
```

### 8. Deploy Firestore Rules and Indexes

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 9. Get Function URLs

After deployment, get your function URLs:

```bash
firebase functions:list
```

Copy the URL for `revenueCatWebhook`. It will look like:
```
https://us-central1-your-project.cloudfunctions.net/revenueCatWebhook
```

## Configure RevenueCat Webhook

### 1. Access RevenueCat Dashboard

1. Go to https://app.revenuecat.com
2. Select your project
3. Navigate to **Project Settings** → **Webhooks**

### 2. Add Webhook

1. Click **Add Webhook**
2. **URL**: Paste your Cloud Function URL
3. **Authorization Header**: `Bearer YOUR_WEBHOOK_SECRET`
4. **Events to Send**: Select all:
   - ✅ Initial Purchase
   - ✅ Renewal
   - ✅ Cancellation
   - ✅ Uncancellation
   - ✅ Non-Renewing Purchase
   - ✅ Expiration
   - ✅ Billing Issue
   - ✅ Product Change
   - ✅ Transfer

### 3. Test Webhook

1. Click **Send Test** in RevenueCat dashboard
2. Check Firebase Console → Functions → Logs
3. Verify you see "Received webhook event" log entry

## Verify Deployment

### 1. Check Function Status

```bash
firebase functions:list
```

All functions should show status: **ACTIVE**

### 2. View Logs

```bash
firebase functions:log
```

Or view specific function:

```bash
firebase functions:log --only revenueCatWebhook
```

### 3. Test Webhook Manually

Use curl to test:

```bash
curl -X POST https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/revenueCatWebhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_WEBHOOK_SECRET" \
  -d @functions/test-payload.json
```

Expected response: `OK` with status 200

### 4. Check Scheduled Functions

Scheduled functions will run automatically:
- `scheduledQuotaReset`: Daily at midnight UTC
- `scheduledTrialCheck`: Every 6 hours

To verify they're scheduled:
1. Go to Firebase Console → Functions
2. Click on the scheduled function
3. Check "Trigger" tab - should show schedule

## Monitoring

### Firebase Console

1. Go to Firebase Console → Functions
2. View metrics:
   - Invocations
   - Execution time
   - Memory usage
   - Errors

### View Logs in Console

1. Firebase Console → Functions
2. Click on a function
3. Click "Logs" tab
4. Filter by severity (Info, Warning, Error)

### Set Up Alerts

1. Firebase Console → Functions
2. Click on a function
3. Click "Alerts" tab
4. Configure alerts for:
   - High error rate
   - High execution time
   - Function crashes

## Troubleshooting

### Function Deployment Fails

**Error: "Permission denied"**
```bash
firebase login --reauth
```

**Error: "Build failed"**
```bash
cd functions
npm run build
# Check for TypeScript errors
```

### Webhook Not Receiving Events

1. **Check URL**: Verify RevenueCat has correct function URL
2. **Check Auth**: Verify authorization header matches secret
3. **Check Logs**: Look for 401 errors in function logs
4. **Test Manually**: Use curl to send test payload

### Scheduled Functions Not Running

1. **Check Schedule**: Verify cron expression is correct
2. **Check Logs**: Look for execution logs at scheduled times
3. **Check Permissions**: Ensure function has Firestore access
4. **Manual Trigger**: Test function manually in Firebase Console

### Firestore Permission Errors

**Error: "Missing or insufficient permissions"**

1. Deploy Firestore rules:
```bash
firebase deploy --only firestore:rules
```

2. Verify rules in Firebase Console → Firestore → Rules

### High Costs

Monitor usage in Firebase Console → Usage and Billing

**Optimization tips:**
- Reduce function timeout (default: 60s)
- Optimize Firestore queries
- Use caching where possible
- Batch operations

## Updating Functions

### 1. Make Code Changes

Edit files in `functions/src/`

### 2. Build

```bash
cd functions
npm run build
```

### 3. Test Locally (Optional)

```bash
npm run serve
```

### 4. Deploy

```bash
npm run deploy
```

Or deploy specific function:

```bash
firebase deploy --only functions:revenueCatWebhook
```

## Rollback

If deployment causes issues:

```bash
firebase functions:delete FUNCTION_NAME
firebase deploy --only functions:FUNCTION_NAME
```

Or restore from previous version in Firebase Console.

## Security Best Practices

1. **Webhook Secret**: Use strong, random secret (32+ characters)
2. **Environment Variables**: Never commit secrets to git
3. **Firestore Rules**: Restrict write access to Cloud Functions only
4. **HTTPS Only**: Cloud Functions automatically use HTTPS
5. **Rate Limiting**: Consider adding rate limiting for webhook endpoint
6. **Logging**: Don't log sensitive user data

## Cost Optimization

### Free Tier Limits
- **Cloud Functions**: 2M invocations/month
- **Firestore**: 50K reads, 20K writes/day
- **Cloud Scheduler**: 3 jobs free

### Optimization Strategies
1. **Batch Operations**: Process multiple users in single function call
2. **Caching**: Cache frequently accessed data
3. **Efficient Queries**: Use indexes, limit results
4. **Timeout Settings**: Set appropriate timeouts (default: 60s)
5. **Memory Allocation**: Use minimum required (default: 256MB)

### Monitor Costs

1. Firebase Console → Usage and Billing
2. Set up budget alerts
3. Monitor function execution time
4. Review Firestore read/write counts

## Support

### Firebase Support
- Documentation: https://firebase.google.com/docs/functions
- Community: https://firebase.google.com/support

### RevenueCat Support
- Documentation: https://docs.revenuecat.com
- Support: support@revenuecat.com

### Troubleshooting Checklist

- [ ] Firebase CLI installed and logged in
- [ ] Functions deployed successfully
- [ ] Environment variables configured
- [ ] Firestore rules deployed
- [ ] RevenueCat webhook configured
- [ ] Webhook secret matches in both places
- [ ] Test webhook successful
- [ ] Logs show no errors
- [ ] Scheduled functions running
- [ ] Monitoring and alerts set up
