# Quick Start Guide

Get your Cloud Functions up and running in 5 minutes.

## Prerequisites

- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project created
- Logged in: `firebase login`

## 5-Minute Setup

### 1. Install Dependencies (1 min)

```bash
cd functions
npm install
```

### 2. Build Functions (30 sec)

```bash
npm run build
```

### 3. Set Webhook Secret (30 sec)

```bash
firebase functions:config:set revenuecat.webhook_secret="$(openssl rand -base64 32)"
```

**Windows (PowerShell):**
```powershell
$secret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
firebase functions:config:set revenuecat.webhook_secret="$secret"
```

Save the secret for RevenueCat configuration!

### 4. Deploy (2 min)

```bash
npm run deploy
```

### 5. Get Webhook URL (30 sec)

```bash
firebase functions:list
```

Copy the URL for `revenueCatWebhook`.

## Configure RevenueCat

1. Go to RevenueCat Dashboard → Project Settings → Webhooks
2. Click "Add Webhook"
3. Paste your function URL
4. Set Authorization: `Bearer YOUR_WEBHOOK_SECRET`
5. Enable all events
6. Click "Send Test"

## Verify

Check logs:
```bash
firebase functions:log --only revenueCatWebhook
```

You should see: "Received webhook event"

## Done! 🎉

Your Cloud Functions are now handling:
- ✅ Subscription webhooks
- ✅ Daily quota resets (midnight UTC)
- ✅ Trial expiration checks (every 6 hours)

## Next Steps

- Read [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed setup
- Read [INTEGRATION.md](../CLOUD_FUNCTIONS_INTEGRATION.md) for app integration
- Set up monitoring in Firebase Console

## Troubleshooting

**Deployment fails?**
```bash
firebase login --reauth
```

**Webhook returns 401?**
- Check authorization header matches secret
- Verify: `firebase functions:config:get`

**Need help?**
- See [README.md](README.md) for full documentation
- Check Firebase Console → Functions → Logs
