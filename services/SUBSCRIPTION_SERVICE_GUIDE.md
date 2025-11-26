# Enhanced Subscription Service Guide

This guide explains how to use the enhanced Subscription Service with auto-pay trial and usage quotas.

## Overview

The enhanced Subscription Service provides:
- **14-day free trial** with payment authorization (no immediate charge)
- **Usage quota tracking** for free users (5 barcode scans, 3 photo scans, 3 AI messages per day)
- **Feature gating** to control access to premium features
- **Win-back offers** for cancelled subscriptions (50% off for 3 months)
- **Offline support** with local caching of premium status

## Table of Contents

1. [Getting Started](#getting-started)
2. [Trial Management](#trial-management)
3. [Subscription Status](#subscription-status)
4. [Usage Quota Management](#usage-quota-management)
5. [Feature Gating](#feature-gating)
6. [Purchase Handling](#purchase-handling)
7. [Cancellation & Win-back](#cancellation--win-back)
8. [Offline Support](#offline-support)
9. [Integration Examples](#integration-examples)

## Getting Started

### Initialize the Service

```typescript
import { SubscriptionService } from './services/subscriptionService';

const subscriptionService = SubscriptionService.getInstance();
```

### Configuration

Update `config/subscriptions.ts` with your RevenueCat API keys:

```typescript
export const REVENUECAT_PUBLIC_SDK_KEY = {
  google: 'YOUR_GOOGLE_PLAY_KEY',
};
```

## Trial Management

### Start Free Trial

```typescript
// Get offerings from RevenueCat
const offerings = await subscriptionService.getOfferings();
const packageToPurchase = offerings?.availablePackages[0];

if (packageToPurchase) {
  const result = await subscriptionService.startFreeTrial(userId, packageToPurchase);
  
  if (result.success) {
    console.log('Trial started successfully!');
    // Navigate to home screen with premium access
  } else {
    console.error('Trial start failed:', result.error);
    // Show error message to user
  }
}
```

**What happens:**
1. Payment method is authorized (no charge)
2. Trial data is stored in Firestore
3. Trial end date is set to 14 days from now
4. Usage quota is initialized
5. Premium status is cached locally

## Subscription Status

### Check Premium Access

```typescript
const hasPremium = await subscriptionService.checkPremiumAccess(userId);

if (hasPremium) {
  // User has premium access (trial or paid)
  // Show premium features
} else {
  // User is on free tier
  // Show limited features with upgrade prompts
}
```

### Get Detailed Status

```typescript
const status = await subscriptionService.getSubscriptionStatus(userId);

console.log('Is Active:', status.isActive);
console.log('Is In Trial:', status.isInTrial);
console.log('Days Remaining:', status.daysRemaining);
console.log('Tier:', status.tier?.name);
console.log('Expires At:', status.expiresAt);
console.log('Is Cancelled:', status.isCancelled);
```

**Use cases:**
- Display trial countdown banner
- Show subscription renewal date
- Display "Days left in trial" message
- Show cancellation status

## Usage Quota Management

### Get Usage Quota

```typescript
const quota = await subscriptionService.getUsageQuota(userId);

console.log('Barcode Scans:', quota.barcodeScans.used, '/', quota.barcodeScans.limit);
console.log('Photo Scans:', quota.photoScans.used, '/', quota.photoScans.limit);
console.log('AI Messages:', quota.aiMessages.used, '/', quota.aiMessages.limit);
console.log('Resets At:', quota.resetsAt);
```

### Increment Usage

```typescript
// Before allowing a barcode scan
const canScan = await subscriptionService.incrementUsage(userId, 'barcode');

if (canScan) {
  // Proceed with barcode scan
  performBarcodeScan();
} else {
  // Quota exceeded, show paywall
  showUpgradePrompt('scan_limit');
}
```

**Usage types:**
- `'barcode'` - Barcode scans (limit: 5/day)
- `'photo'` - Photo scans (limit: 3/day)
- `'ai'` - AI messages (limit: 3/day)

**Quota reset:**
- Automatically resets daily at midnight UTC
- No manual intervention required

## Feature Gating

### Check Feature Access

```typescript
const result = await subscriptionService.canUseFeature(userId, 'barcode_scan');

if (result.allowed) {
  // User can use the feature
  performBarcodeScan();
} else {
  // User cannot use the feature
  console.log('Reason:', result.reason);
  showUpgradePrompt('scan_limit');
}
```

**Available features:**
- `'barcode_scan'` - Barcode scanning (5/day for free users)
- `'photo_scan'` - Photo scanning (3/day for free users)
- `'ai_coach'` - AI Nutrition Coach (3 messages/day for free users)
- `'meal_plan'` - Meal planning (premium only)

### Integration Example

```typescript
// In your barcode scanner component
async function handleBarcodeScan() {
  const canUse = await subscriptionService.canUseFeature(userId, 'barcode_scan');
  
  if (!canUse.allowed) {
    Alert.alert(
      'Scan Limit Reached',
      canUse.reason,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade', onPress: () => navigation.navigate('Subscription') }
      ]
    );
    return;
  }
  
  // Increment usage
  await subscriptionService.incrementUsage(userId, 'barcode');
  
  // Proceed with scan
  const result = await scanBarcode();
  // ... handle result
}
```

## Purchase Handling

### Handle Subscription Purchase

```typescript
// When user selects a subscription plan
const result = await subscriptionService.handlePurchase(userId, 'nutrilytics_yearly');

if (result.success) {
  console.log('Purchase successful!');
  // Show success screen with confetti
  // Navigate to home screen
} else {
  console.error('Purchase failed:', result.error);
  // Show error message
}
```

**What happens:**
1. Package is purchased via RevenueCat
2. Subscription data is synced to Firestore
3. Premium status is cached locally
4. User gets immediate access to premium features

## Cancellation & Win-back

### Handle Cancellation

```typescript
// When user cancels subscription
await subscriptionService.handleCancellation(userId);

// Win-back offer is automatically created
const offer = await subscriptionService.getWinBackOffer(userId);

if (offer) {
  console.log('Win-back offer:', offer.discountPercent, '% off for', offer.durationMonths, 'months');
  // Show win-back offer to user
}
```

### Display Win-back Offer

```typescript
const offer = await subscriptionService.getWinBackOffer(userId);

if (offer) {
  Alert.alert(
    'Special Offer!',
    `Come back and get ${offer.discountPercent}% off for ${offer.durationMonths} months!`,
    [
      { text: 'Not Now', style: 'cancel' },
      { text: 'Claim Offer', onPress: () => handleWinBackPurchase(offer) }
    ]
  );
}
```

**Win-back offer details:**
- 50% discount
- Valid for 3 months
- Expires 30 days after cancellation
- Automatically created on cancellation

## Offline Support

The service caches premium status locally for offline access:

```typescript
// Premium status is cached for 1 hour
const hasPremium = await subscriptionService.checkPremiumAccess(userId);

// If offline, returns cached status
// If online, fetches fresh status and updates cache
```

**Cache behavior:**
- Premium status cached for 1 hour
- Automatically refreshed when online
- Falls back to cache when offline
- Ensures app works without internet

## Integration Examples

### Home Screen with Quota Display

```typescript
function HomeScreen() {
  const { user } = useAuth();
  const [quota, setQuota] = useState(null);
  const [hasPremium, setHasPremium] = useState(false);
  
  useEffect(() => {
    loadSubscriptionData();
  }, []);
  
  async function loadSubscriptionData() {
    const subscriptionService = SubscriptionService.getInstance();
    
    // Check premium status
    const premium = await subscriptionService.checkPremiumAccess(user.uid);
    setHasPremium(premium);
    
    // Get quota for free users
    if (!premium) {
      const userQuota = await subscriptionService.getUsageQuota(user.uid);
      setQuota(userQuota);
    }
  }
  
  return (
    <View>
      {!hasPremium && quota && (
        <View style={styles.quotaCard}>
          <Text>Scans left today: {quota.barcodeScans.limit - quota.barcodeScans.used}</Text>
          <Text>AI messages left: {quota.aiMessages.limit - quota.aiMessages.used}</Text>
          <Button title="Upgrade to Premium" onPress={() => navigation.navigate('Subscription')} />
        </View>
      )}
      
      {/* Rest of home screen */}
    </View>
  );
}
```

### Trial Progress Banner

```typescript
function TrialProgressBanner() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  
  useEffect(() => {
    loadTrialStatus();
  }, []);
  
  async function loadTrialStatus() {
    const subscriptionService = SubscriptionService.getInstance();
    const subscriptionStatus = await subscriptionService.getSubscriptionStatus(user.uid);
    
    if (subscriptionStatus.isInTrial) {
      setStatus(subscriptionStatus);
    }
  }
  
  if (!status?.isInTrial) return null;
  
  return (
    <View style={styles.banner}>
      <Text style={styles.title}>
        {status.daysRemaining} days left in your trial
      </Text>
      <Text style={styles.subtitle}>
        Upgrade now to keep unlimited access
      </Text>
      <Button title="Upgrade" onPress={() => navigation.navigate('Subscription')} />
    </View>
  );
}
```

### Barcode Scanner with Quota Check

```typescript
function BarcodeScanner() {
  const { user } = useAuth();
  const subscriptionService = SubscriptionService.getInstance();
  
  async function handleScan() {
    // Check if user can scan
    const canScan = await subscriptionService.canUseFeature(user.uid, 'barcode_scan');
    
    if (!canScan.allowed) {
      Alert.alert(
        'Scan Limit Reached',
        canScan.reason + '\n\nUpgrade to Premium for unlimited scans!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Subscription') }
        ]
      );
      return;
    }
    
    // Increment usage
    const incremented = await subscriptionService.incrementUsage(user.uid, 'barcode');
    
    if (!incremented) {
      Alert.alert('Error', 'Failed to update usage. Please try again.');
      return;
    }
    
    // Proceed with scan
    const result = await performBarcodeScan();
    // ... handle result
  }
  
  return (
    <View>
      <Button title="Scan Barcode" onPress={handleScan} />
    </View>
  );
}
```

### AI Chat with Message Quota

```typescript
function AIChatScreen() {
  const { user } = useAuth();
  const subscriptionService = SubscriptionService.getInstance();
  
  async function sendMessage(message: string) {
    // Check if user can send message
    const canSend = await subscriptionService.canUseFeature(user.uid, 'ai_coach');
    
    if (!canSend.allowed) {
      Alert.alert(
        'Message Limit Reached',
        canSend.reason + '\n\nUpgrade to Premium for unlimited AI chat!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Subscription') }
        ]
      );
      return;
    }
    
    // Increment usage
    await subscriptionService.incrementUsage(user.uid, 'ai');
    
    // Send message to AI
    const response = await AINutritionCoachService.sendMessage(user.uid, message);
    // ... handle response
  }
  
  return (
    <View>
      {/* Chat UI */}
    </View>
  );
}
```

## Firestore Data Structure

The service stores data in Firestore with the following structure:

```
/users/{userId}
  /subscription
    /data
      - tier: 'trial' | 'monthly' | 'yearly' | 'lifetime'
      - isActive: boolean
      - trialStartedAt: timestamp
      - trialEndsAt: timestamp
      - subscriptionStartedAt: timestamp
      - subscriptionEndsAt: timestamp
      - revenueCatCustomerId: string
      - lastPaymentAmount: number
      - lastPaymentDate: timestamp
      - isCancelled: boolean
      - cancelledAt: timestamp
      - updatedAt: timestamp
    
    /winback
      - discountPercent: number (50)
      - durationMonths: number (3)
      - expiresAt: timestamp
      - createdAt: timestamp
  
  /usage
    /data
      - barcodeScansToday: number
      - photoScansToday: number
      - aiMessagesToday: number
      - lastResetAt: timestamp
      - updatedAt: timestamp
```

## Best Practices

1. **Always check feature access before allowing actions**
   ```typescript
   const canUse = await subscriptionService.canUseFeature(userId, 'barcode_scan');
   if (!canUse.allowed) {
     // Show upgrade prompt
     return;
   }
   ```

2. **Increment usage after successful feature check**
   ```typescript
   await subscriptionService.incrementUsage(userId, 'barcode');
   ```

3. **Cache premium status for better performance**
   ```typescript
   // Premium status is automatically cached for 1 hour
   const hasPremium = await subscriptionService.checkPremiumAccess(userId);
   ```

4. **Handle offline scenarios gracefully**
   ```typescript
   try {
     const hasPremium = await subscriptionService.checkPremiumAccess(userId);
   } catch (error) {
     // Falls back to cached status automatically
   }
   ```

5. **Show quota information to free users**
   ```typescript
   const quota = await subscriptionService.getUsageQuota(userId);
   // Display remaining scans/messages
   ```

6. **Display trial progress prominently**
   ```typescript
   const status = await subscriptionService.getSubscriptionStatus(userId);
   if (status.isInTrial && status.daysRemaining <= 2) {
     // Show urgent trial ending banner
   }
   ```

## Troubleshooting

### Premium status not updating
- Check RevenueCat configuration
- Verify webhook is set up correctly
- Check Firestore security rules
- Clear cache: Delete AsyncStorage key `premium_status_cache_{userId}`

### Quota not resetting
- Verify `lastResetAt` timestamp in Firestore
- Check if date comparison logic is working
- Manually reset: Call `resetUsageQuota(userId)` (private method)

### Trial not starting
- Check RevenueCat trial configuration
- Verify payment method is authorized
- Check Firestore write permissions
- Review error logs in console

### Win-back offer not appearing
- Verify cancellation was processed
- Check offer expiration date
- Ensure user actually cancelled (not just expired)
- Check Firestore `/users/{userId}/subscription/winback` document

## Support

For issues or questions:
1. Check Firebase Console for errors
2. Review RevenueCat dashboard for subscription events
3. Check Firestore data structure
4. Review console logs for error messages
5. Refer to the test file for usage examples

## Next Steps

1. Configure RevenueCat in Google Play Console
2. Set up subscription products (Monthly, Annual, Lifetime)
3. Configure Firebase Cloud Functions for webhooks
4. Test trial flow end-to-end
5. Implement UI components for subscription screens
6. Add analytics tracking for conversion events
