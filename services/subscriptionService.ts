import Purchases, {
  PurchasesOffering,
  CustomerInfo,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  REVENUECAT_PUBLIC_SDK_KEY,
  ENTITLEMENT_ID,
} from '../config/subscriptions';
import { firestore } from '../lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

// Interfaces
export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: 'monthly' | 'yearly' | 'lifetime';
  features: string[];
}

export interface SubscriptionStatus {
  isActive: boolean;
  tier: SubscriptionTier | null;
  expiresAt: Date | null;
  isInTrial: boolean;
  trialEndsAt: Date | null;
  daysRemaining: number;
  isCancelled: boolean;
}

export interface UsageQuota {
  barcodeScans: { used: number; limit: number };
  photoScans: { used: number; limit: number };
  aiMessages: { used: number; limit: number };
  resetsAt: Date;
}

export interface WinBackOffer {
  tier: SubscriptionTier;
  discountPercent: number;
  durationMonths: number;
  expiresAt: Date;
}

// Constants
const TRIAL_DURATION_DAYS = 14;
const FREE_TIER_LIMITS = {
  barcodeScans: 5,
  photoScans: 3,
  aiMessages: 3,
};

const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  monthly: {
    id: 'monthly',
    name: 'Monthly Premium',
    price: 199,
    currency: 'INR',
    duration: 'monthly',
    features: [
      'Unlimited barcode scans',
      'Unlimited photo scans',
      'AI Nutrition Coach',
      'Personalized meal plans',
      'Advanced allergen detection',
      'No advertisements',
    ],
  },
  yearly: {
    id: 'yearly',
    name: 'Annual Premium',
    price: 999,
    currency: 'INR',
    duration: 'yearly',
    features: [
      'Unlimited barcode scans',
      'Unlimited photo scans',
      'AI Nutrition Coach',
      'Personalized meal plans',
      'Advanced allergen detection',
      'No advertisements',
      'Save 58%',
    ],
  },
  lifetime: {
    id: 'lifetime',
    name: 'Lifetime Premium',
    price: 2999,
    currency: 'INR',
    duration: 'lifetime',
    features: [
      'Unlimited barcode scans',
      'Unlimited photo scans',
      'AI Nutrition Coach',
      'Personalized meal plans',
      'Advanced allergen detection',
      'No advertisements',
      'Lifetime access',
      'All future features',
    ],
  },
};

const CACHE_KEYS = {
  PREMIUM_STATUS: 'premium_status_cache',
  SUBSCRIPTION_DATA: 'subscription_data_cache',
  USAGE_QUOTA: 'usage_quota_cache',
};

export class SubscriptionService {
  private static instance: SubscriptionService;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  private async initialize() {
    if (Platform.OS === 'android') {
      await Purchases.configure({ apiKey: REVENUECAT_PUBLIC_SDK_KEY.google });
    }
    // Add iOS configuration here if needed in future
  }

  // ============ Trial Management ============

  /**
   * Start free trial with payment authorization
   * This captures payment method but doesn't charge immediately
   */
  async startFreeTrial(
    userId: string,
    packageToPurchase: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Purchase package (RevenueCat handles trial logic)
      const { customerInfo } = await Purchases.purchasePackage(
        packageToPurchase
      );

      // Calculate trial end date
      const trialStartDate = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DURATION_DAYS);

      // Store trial data in Firestore
      const subscriptionRef = doc(firestore, 'users', userId, 'subscription', 'data');
      await setDoc(subscriptionRef, {
        tier: 'trial',
        isActive: true,
        trialStartedAt: Timestamp.fromDate(trialStartDate),
        trialEndsAt: Timestamp.fromDate(trialEndDate),
        subscriptionStartedAt: null,
        subscriptionEndsAt: null,
        revenueCatCustomerId: customerInfo.originalAppUserId,
        lastPaymentAmount: 0,
        lastPaymentDate: null,
        isCancelled: false,
        updatedAt: serverTimestamp(),
      });

      // Initialize usage quota
      await this.resetUsageQuota(userId);

      // Cache premium status
      await this.cachePremiumStatus(userId, true);

      return { success: true };
    } catch (error: any) {
      console.error('Error starting free trial:', error);
      return { success: false, error: error.message };
    }
  }

  // ============ Subscription Status ============

  /**
   * Check if user has premium access (including trial)
   */
  async checkPremiumAccess(userId: string): Promise<boolean> {
    try {
      // Try to get from cache first for offline support
      const cachedStatus = await this.getCachedPremiumStatus(userId);
      if (cachedStatus !== null) {
        return cachedStatus;
      }

      // Check RevenueCat
      const customerInfo = await Purchases.getCustomerInfo();
      const hasEntitlement =
        customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

      if (hasEntitlement) {
        await this.cachePremiumStatus(userId, true);
        return true;
      }

      // Check Firestore for trial status
      const status = await this.getSubscriptionStatus(userId);
      const isPremium = status.isActive || status.isInTrial;

      await this.cachePremiumStatus(userId, isPremium);
      return isPremium;
    } catch (error) {
      console.error('Error checking premium access:', error);
      // Return cached status if available
      const cachedStatus = await this.getCachedPremiumStatus(userId);
      return cachedStatus ?? false;
    }
  }

  /**
   * Get detailed subscription status
   */
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    try {
      const subscriptionRef = doc(firestore, 'users', userId, 'subscription', 'data');
      const subscriptionDoc = await getDoc(subscriptionRef);

      if (!subscriptionDoc.exists()) {
        return {
          isActive: false,
          tier: null,
          expiresAt: null,
          isInTrial: false,
          trialEndsAt: null,
          daysRemaining: 0,
          isCancelled: false,
        };
      }

      const data = subscriptionDoc.data();
      const now = new Date();

      // Check if in trial
      let isInTrial = false;
      let trialEndsAt: Date | null = null;
      let daysRemaining = 0;

      if (data.trialEndsAt) {
        trialEndsAt = data.trialEndsAt.toDate();
        isInTrial = now < trialEndsAt;
        if (isInTrial) {
          daysRemaining = Math.ceil(
            (trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
        }
      }

      // Check if subscription is active
      let isActive = false;
      let expiresAt: Date | null = null;

      if (data.subscriptionEndsAt) {
        expiresAt = data.subscriptionEndsAt.toDate();
        isActive = now < expiresAt;
        if (isActive && !isInTrial) {
          daysRemaining = Math.ceil(
            (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
        }
      }

      // Get tier information
      let tier: SubscriptionTier | null = null;
      if (data.tier && data.tier !== 'trial' && SUBSCRIPTION_TIERS[data.tier]) {
        tier = SUBSCRIPTION_TIERS[data.tier];
      }

      return {
        isActive: isActive || isInTrial,
        tier,
        expiresAt,
        isInTrial,
        trialEndsAt,
        daysRemaining,
        isCancelled: data.isCancelled || false,
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      throw error;
    }
  }

  // ============ Usage Quota Management ============

  /**
   * Get usage quota for free users
   */
  async getUsageQuota(userId: string): Promise<UsageQuota> {
    try {
      const usageRef = doc(firestore, 'users', userId, 'usage', 'data');
      const usageDoc = await getDoc(usageRef);

      if (!usageDoc.exists()) {
        // Initialize usage quota
        await this.resetUsageQuota(userId);
        return {
          barcodeScans: { used: 0, limit: FREE_TIER_LIMITS.barcodeScans },
          photoScans: { used: 0, limit: FREE_TIER_LIMITS.photoScans },
          aiMessages: { used: 0, limit: FREE_TIER_LIMITS.aiMessages },
          resetsAt: this.getNextMidnightUTC(),
        };
      }

      const data = usageDoc.data();
      const lastResetAt = data.lastResetAt?.toDate() || new Date(0);
      const now = new Date();

      // Check if quota needs reset (daily at midnight UTC)
      if (this.shouldResetQuota(lastResetAt, now)) {
        await this.resetUsageQuota(userId);
        return {
          barcodeScans: { used: 0, limit: FREE_TIER_LIMITS.barcodeScans },
          photoScans: { used: 0, limit: FREE_TIER_LIMITS.photoScans },
          aiMessages: { used: 0, limit: FREE_TIER_LIMITS.aiMessages },
          resetsAt: this.getNextMidnightUTC(),
        };
      }

      return {
        barcodeScans: {
          used: data.barcodeScansToday || 0,
          limit: FREE_TIER_LIMITS.barcodeScans,
        },
        photoScans: {
          used: data.photoScansToday || 0,
          limit: FREE_TIER_LIMITS.photoScans,
        },
        aiMessages: {
          used: data.aiMessagesToday || 0,
          limit: FREE_TIER_LIMITS.aiMessages,
        },
        resetsAt: this.getNextMidnightUTC(),
      };
    } catch (error) {
      console.error('Error getting usage quota:', error);
      throw error;
    }
  }

  /**
   * Increment usage counter
   */
  async incrementUsage(
    userId: string,
    type: 'barcode' | 'photo' | 'ai'
  ): Promise<boolean> {
    try {
      // Check if user has premium access
      const hasPremium = await this.checkPremiumAccess(userId);
      if (hasPremium) {
        return true; // Premium users have unlimited access
      }

      const usageRef = doc(firestore, 'users', userId, 'usage', 'data');
      const usageDoc = await getDoc(usageRef);

      if (!usageDoc.exists()) {
        await this.resetUsageQuota(userId);
      }

      const quota = await this.getUsageQuota(userId);

      // Check if quota exceeded
      let field: string;
      let currentUsed: number;
      let limit: number;

      switch (type) {
        case 'barcode':
          field = 'barcodeScansToday';
          currentUsed = quota.barcodeScans.used;
          limit = quota.barcodeScans.limit;
          break;
        case 'photo':
          field = 'photoScansToday';
          currentUsed = quota.photoScans.used;
          limit = quota.photoScans.limit;
          break;
        case 'ai':
          field = 'aiMessagesToday';
          currentUsed = quota.aiMessages.used;
          limit = quota.aiMessages.limit;
          break;
      }

      if (currentUsed >= limit) {
        return false; // Quota exceeded
      }

      // Increment usage
      await updateDoc(usageRef, {
        [field]: currentUsed + 1,
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  }

  /**
   * Reset usage quota (called daily at midnight UTC)
   */
  private async resetUsageQuota(userId: string): Promise<void> {
    try {
      const usageRef = doc(firestore, 'users', userId, 'usage', 'data');
      await setDoc(
        usageRef,
        {
          barcodeScansToday: 0,
          photoScansToday: 0,
          aiMessagesToday: 0,
          lastResetAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error resetting usage quota:', error);
      throw error;
    }
  }

  /**
   * Check if quota should be reset
   */
  private shouldResetQuota(lastResetAt: Date, now: Date): boolean {
    const lastResetMidnight = new Date(
      Date.UTC(
        lastResetAt.getUTCFullYear(),
        lastResetAt.getUTCMonth(),
        lastResetAt.getUTCDate()
      )
    );
    const currentMidnight = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    return currentMidnight > lastResetMidnight;
  }

  /**
   * Get next midnight UTC
   */
  private getNextMidnightUTC(): Date {
    const now = new Date();
    const nextMidnight = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
    );
    return nextMidnight;
  }

  // ============ Feature Gating ============

  /**
   * Check if user can use a specific feature
   */
  async canUseFeature(
    userId: string,
    feature: 'barcode_scan' | 'photo_scan' | 'ai_coach' | 'meal_plan'
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Check premium access
      const hasPremium = await this.checkPremiumAccess(userId);

      if (hasPremium) {
        return { allowed: true };
      }

      // Free users have limited access
      switch (feature) {
        case 'barcode_scan': {
          const quota = await this.getUsageQuota(userId);
          if (quota.barcodeScans.used >= quota.barcodeScans.limit) {
            return {
              allowed: false,
              reason: `Daily barcode scan limit reached (${quota.barcodeScans.limit}/day)`,
            };
          }
          return { allowed: true };
        }

        case 'photo_scan': {
          const quota = await this.getUsageQuota(userId);
          if (quota.photoScans.used >= quota.photoScans.limit) {
            return {
              allowed: false,
              reason: `Daily photo scan limit reached (${quota.photoScans.limit}/day)`,
            };
          }
          return { allowed: true };
        }

        case 'ai_coach': {
          const quota = await this.getUsageQuota(userId);
          if (quota.aiMessages.used >= quota.aiMessages.limit) {
            return {
              allowed: false,
              reason: `Daily AI message limit reached (${quota.aiMessages.limit}/day)`,
            };
          }
          return { allowed: true };
        }

        case 'meal_plan':
          return {
            allowed: false,
            reason: 'Meal planning is a premium feature',
          };

        default:
          return { allowed: false, reason: 'Unknown feature' };
      }
    } catch (error) {
      console.error('Error checking feature access:', error);
      return { allowed: false, reason: 'Error checking access' };
    }
  }

  // ============ Purchase Handling ============

  /**
   * Handle subscription purchase
   */
  async handlePurchase(
    userId: string,
    packageId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const offerings = await this.getOfferings();
      if (!offerings) {
        return { success: false, error: 'No offerings available' };
      }

      // Find the package
      const packageToPurchase = offerings.availablePackages.find(
        (pkg) => pkg.identifier === packageId
      );

      if (!packageToPurchase) {
        return { success: false, error: 'Package not found' };
      }

      // Purchase the package
      const { customerInfo } = await Purchases.purchasePackage(
        packageToPurchase
      );

      // Update Firestore
      await this.syncSubscriptionData(userId, customerInfo);

      // Cache premium status
      await this.cachePremiumStatus(userId, true);

      return { success: true };
    } catch (error: any) {
      console.error('Error handling purchase:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync subscription data from RevenueCat to Firestore
   */
  private async syncSubscriptionData(
    userId: string,
    customerInfo: CustomerInfo
  ): Promise<void> {
    try {
      const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

      if (!entitlement) {
        return;
      }

      const subscriptionRef = doc(firestore, 'users', userId, 'subscription', 'data');

      // Determine tier from product identifier
      let tier = 'monthly';
      if (entitlement.productIdentifier.includes('yearly')) {
        tier = 'yearly';
      } else if (entitlement.productIdentifier.includes('lifetime')) {
        tier = 'lifetime';
      }

      await setDoc(
        subscriptionRef,
        {
          tier,
          isActive: true,
          subscriptionStartedAt: serverTimestamp(),
          subscriptionEndsAt: entitlement.expirationDate
            ? Timestamp.fromDate(new Date(entitlement.expirationDate))
            : null,
          revenueCatCustomerId: customerInfo.originalAppUserId,
          isCancelled: false,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error syncing subscription data:', error);
      throw error;
    }
  }

  // ============ Cancellation & Win-back ============

  /**
   * Handle subscription cancellation
   */
  async handleCancellation(userId: string): Promise<void> {
    try {
      const subscriptionRef = doc(firestore, 'users', userId, 'subscription', 'data');
      await updateDoc(subscriptionRef, {
        isCancelled: true,
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create win-back offer
      await this.createWinBackOffer(userId);
    } catch (error) {
      console.error('Error handling cancellation:', error);
      throw error;
    }
  }

  /**
   * Create win-back offer (50% off for 3 months)
   */
  private async createWinBackOffer(userId: string): Promise<void> {
    try {
      const offerExpiresAt = new Date();
      offerExpiresAt.setDate(offerExpiresAt.getDate() + 30); // Offer valid for 30 days

      const winBackRef = doc(firestore, 'users', userId, 'subscription', 'winback');
      await setDoc(winBackRef, {
        discountPercent: 50,
        durationMonths: 3,
        expiresAt: Timestamp.fromDate(offerExpiresAt),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error creating win-back offer:', error);
      throw error;
    }
  }

  /**
   * Get win-back offer for cancelled users
   */
  async getWinBackOffer(userId: string): Promise<WinBackOffer | null> {
    try {
      const winBackRef = doc(firestore, 'users', userId, 'subscription', 'winback');
      const winBackDoc = await getDoc(winBackRef);

      if (!winBackDoc.exists()) {
        return null;
      }

      const data = winBackDoc.data();
      const expiresAt = data.expiresAt.toDate();
      const now = new Date();

      if (now > expiresAt) {
        return null; // Offer expired
      }

      return {
        tier: SUBSCRIPTION_TIERS.monthly, // Default to monthly
        discountPercent: data.discountPercent,
        durationMonths: data.durationMonths,
        expiresAt,
      };
    } catch (error) {
      console.error('Error getting win-back offer:', error);
      return null;
    }
  }

  // ============ Caching for Offline Support ============

  /**
   * Cache premium status locally
   */
  private async cachePremiumStatus(
    userId: string,
    isPremium: boolean
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${CACHE_KEYS.PREMIUM_STATUS}_${userId}`,
        JSON.stringify({ isPremium, cachedAt: new Date().toISOString() })
      );
    } catch (error) {
      console.error('Error caching premium status:', error);
    }
  }

  /**
   * Get cached premium status
   */
  private async getCachedPremiumStatus(userId: string): Promise<boolean | null> {
    try {
      const cached = await AsyncStorage.getItem(
        `${CACHE_KEYS.PREMIUM_STATUS}_${userId}`
      );
      if (!cached) {
        return null;
      }

      const data = JSON.parse(cached);
      const cachedAt = new Date(data.cachedAt);
      const now = new Date();

      // Cache valid for 1 hour
      if (now.getTime() - cachedAt.getTime() > 60 * 60 * 1000) {
        return null;
      }

      return data.isPremium;
    } catch (error) {
      console.error('Error getting cached premium status:', error);
      return null;
    }
  }

  // ============ Legacy Methods (kept for backward compatibility) ============

  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('Error getting offerings:', error);
      return null;
    }
  }

  async purchasePackage(packageToPurchase: any): Promise<CustomerInfo | null> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(
        packageToPurchase
      );
      return customerInfo;
    } catch (error) {
      console.error('Error purchasing package:', error);
      return null;
    }
  }

  async restorePurchases(): Promise<CustomerInfo | null> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      return null;
    }
  }

  async checkSubscriptionStatus(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  async setUserAttributes(userId: string, email: string) {
    try {
      await Purchases.setAttributes({
        userId,
        email,
      });
      await Purchases.setEmail(email);
    } catch (error) {
      console.error('Error setting user attributes:', error);
    }
  }
}
