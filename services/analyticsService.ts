import { getAnalytics, logEvent, setUserProperties, setUserId } from 'firebase/analytics';
import { app, firestore } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, increment, Timestamp } from 'firebase/firestore';

// Initialize Firebase Analytics
const analytics = getAnalytics(app);

// Analytics Event Names
export const ANALYTICS_EVENTS = {
    // Trial & Subscription Events
    TRIAL_ACTIVATION: 'trial_activation',
    TRIAL_REMINDER_SENT: 'trial_reminder_sent',
    TRIAL_EXPIRED: 'trial_expired',
    SUBSCRIPTION_PURCHASED: 'subscription_purchased',
    SUBSCRIPTION_RENEWED: 'subscription_renewed',
    SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
    SUBSCRIPTION_RESTORED: 'subscription_restored',

    // Conversion Events
    TRIAL_TO_PAID_CONVERSION: 'trial_to_paid_conversion',
    FREE_TO_PAID_CONVERSION: 'free_to_paid_conversion',

    // Feature Usage Events
    FEATURE_USED: 'feature_used',
    BARCODE_SCAN: 'barcode_scan',
    PHOTO_SCAN: 'photo_scan',
    AI_MESSAGE_SENT: 'ai_message_sent',
    MEAL_PLAN_GENERATED: 'meal_plan_generated',
    MEAL_REGENERATED: 'meal_regenerated',

    // Paywall Events
    PAYWALL_IMPRESSION: 'paywall_impression',
    PAYWALL_DISMISSED: 'paywall_dismissed',
    PAYWALL_CTA_CLICKED: 'paywall_cta_clicked',

    // Quota Events
    QUOTA_EXHAUSTED: 'quota_exhausted',
    QUOTA_RESET: 'quota_reset',

    // User Journey Events
    ONBOARDING_STARTED: 'onboarding_started',
    ONBOARDING_COMPLETED: 'onboarding_completed',
    ONBOARDING_ABANDONED: 'onboarding_abandoned',

    // Engagement Events
    APP_OPENED: 'app_opened',
    SESSION_START: 'session_start',
    SESSION_END: 'session_end',
} as const;

// Analytics User Properties
export const USER_PROPERTIES = {
    SUBSCRIPTION_TIER: 'subscription_tier',
    IS_PREMIUM: 'is_premium',
    IS_IN_TRIAL: 'is_in_trial',
    DAYS_SINCE_SIGNUP: 'days_since_signup',
    ALLERGEN_COUNT: 'allergen_count',
    HEALTH_GOAL: 'health_goal',
    PREFERRED_LANGUAGE: 'preferred_language',
    ACQUISITION_SOURCE: 'acquisition_source',
} as const;

// Interfaces
export interface AnalyticsEvent {
    name: string;
    params: Record<string, any>;
    timestamp: Date;
}

export interface ConversionMetrics {
    trialToPayRate: number;
    freeToPayRate: number;
    churnRate: number;
    averageRevenuePerUser: number;
    dailyActiveUsers: number;
}

export interface AnalyticsMetricsData {
    date: string;
    dailyActiveUsers: number;
    trialActivations: number;
    conversions: number;
    revenue: number;
    churnCount: number;
    barcodeScans: number;
    photoScans: number;
    aiMessages: number;
    mealPlansGenerated: number;
    paywallImpressions: number;
    paywallConversions: number;
}

export class AnalyticsService {
    private static instance: AnalyticsService;

    private constructor() { }

    public static getInstance(): AnalyticsService {
        if (!AnalyticsService.instance) {
            AnalyticsService.instance = new AnalyticsService();
        }
        return AnalyticsService.instance;
    }

    // ============ User Identification ============

    /**
     * Set user ID for analytics tracking
     */
    setUser(userId: string): void {
        try {
            setUserId(analytics, userId);
        } catch (error) {
            console.error('Error setting user ID:', error);
        }
    }

    /**
     * Set user properties for segmentation
     */
    setUserProperty(property: string, value: string | number | boolean): void {
        try {
            setUserProperties(analytics, { [property]: value });
        } catch (error) {
            console.error('Error setting user property:', error);
        }
    }

    /**
     * Update user properties based on profile
     */
    async updateUserProperties(userId: string): Promise<void> {
        try {
            const userRef = doc(firestore, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                return;
            }

            const userData = userDoc.data();

            // Set user properties
            this.setUserProperty(USER_PROPERTIES.ALLERGEN_COUNT, userData.allergens?.length || 0);
            this.setUserProperty(USER_PROPERTIES.HEALTH_GOAL, userData.healthGoal || 'unknown');
            this.setUserProperty(USER_PROPERTIES.PREFERRED_LANGUAGE, userData.language || 'en');

            // Calculate days since signup
            if (userData.createdAt) {
                const signupDate = userData.createdAt.toDate();
                const daysSinceSignup = Math.floor(
                    (Date.now() - signupDate.getTime()) / (1000 * 60 * 60 * 24)
                );
                this.setUserProperty(USER_PROPERTIES.DAYS_SINCE_SIGNUP, daysSinceSignup);
            }
        } catch (error) {
            console.error('Error updating user properties:', error);
        }
    }

    // ============ Trial & Subscription Events ============

    /**
     * Log trial activation event
     */
    async logTrialActivation(userId: string, source: string, tier: string): Promise<void> {
        try {
            logEvent(analytics, ANALYTICS_EVENTS.TRIAL_ACTIVATION, {
                user_id: userId,
                acquisition_source: source,
                subscription_tier: tier,
                timestamp: new Date().toISOString(),
            });

            // Update user properties
            this.setUserProperty(USER_PROPERTIES.IS_IN_TRIAL, true);
            this.setUserProperty(USER_PROPERTIES.ACQUISITION_SOURCE, source);
            this.setUserProperty(USER_PROPERTIES.SUBSCRIPTION_TIER, tier);

            // Update daily metrics
            await this.incrementDailyMetric('trialActivations');
        } catch (error) {
            console.error('Error logging trial activation:', error);
        }
    }

    /**
     * Log conversion event (trial-to-paid or free-to-paid)
     */
    async logConversion(
        userId: string,
        tier: string,
        revenue: number,
        conversionType: 'trial_to_paid' | 'free_to_paid'
    ): Promise<void> {
        try {
            const eventName =
                conversionType === 'trial_to_paid'
                    ? ANALYTICS_EVENTS.TRIAL_TO_PAID_CONVERSION
                    : ANALYTICS_EVENTS.FREE_TO_PAID_CONVERSION;

            logEvent(analytics, eventName, {
                user_id: userId,
                subscription_tier: tier,
                revenue: revenue,
                currency: 'INR',
                timestamp: new Date().toISOString(),
            });

            // Log standard purchase event for Google Analytics
            logEvent(analytics, 'purchase', {
                transaction_id: `${userId}_${Date.now()}`,
                value: revenue,
                currency: 'INR',
                items: [
                    {
                        item_id: tier,
                        item_name: `${tier} subscription`,
                        price: revenue,
                    },
                ],
            });

            // Update user properties
            this.setUserProperty(USER_PROPERTIES.IS_PREMIUM, true);
            this.setUserProperty(USER_PROPERTIES.IS_IN_TRIAL, false);
            this.setUserProperty(USER_PROPERTIES.SUBSCRIPTION_TIER, tier);

            // Update daily metrics
            await this.incrementDailyMetric('conversions');
            await this.incrementDailyMetric('revenue', revenue);
        } catch (error) {
            console.error('Error logging conversion:', error);
        }
    }

    /**
     * Log subscription cancellation
     */
    async logCancellation(userId: string, reason: string, tier: string): Promise<void> {
        try {
            logEvent(analytics, ANALYTICS_EVENTS.SUBSCRIPTION_CANCELLED, {
                user_id: userId,
                cancellation_reason: reason,
                subscription_tier: tier,
                timestamp: new Date().toISOString(),
            });

            // Update daily metrics
            await this.incrementDailyMetric('churnCount');
        } catch (error) {
            console.error('Error logging cancellation:', error);
        }
    }

    /**
     * Log subscription renewal
     */
    async logRenewal(userId: string, tier: string, revenue: number): Promise<void> {
        try {
            logEvent(analytics, ANALYTICS_EVENTS.SUBSCRIPTION_RENEWED, {
                user_id: userId,
                subscription_tier: tier,
                revenue: revenue,
                currency: 'INR',
                timestamp: new Date().toISOString(),
            });

            // Update daily metrics
            await this.incrementDailyMetric('revenue', revenue);
        } catch (error) {
            console.error('Error logging renewal:', error);
        }
    }

    // ============ Feature Usage Events ============

    /**
     * Log feature usage
     */
    async logFeatureUsage(
        userId: string,
        feature: string,
        isPremium: boolean,
        additionalParams?: Record<string, any>
    ): Promise<void> {
        try {
            logEvent(analytics, ANALYTICS_EVENTS.FEATURE_USED, {
                user_id: userId,
                feature_name: feature,
                is_premium: isPremium,
                timestamp: new Date().toISOString(),
                ...additionalParams,
            });
        } catch (error) {
            console.error('Error logging feature usage:', error);
        }
    }

    /**
     * Log barcode scan
     */
    async logBarcodeScan(userId: string, isPremium: boolean, productName?: string): Promise<void> {
        try {
            logEvent(analytics, ANALYTICS_EVENTS.BARCODE_SCAN, {
                user_id: userId,
                is_premium: isPremium,
                product_name: productName,
                timestamp: new Date().toISOString(),
            });

            await this.incrementDailyMetric('barcodeScans');
        } catch (error) {
            console.error('Error logging barcode scan:', error);
        }
    }

    /**
     * Log photo scan
     */
    async logPhotoScan(userId: string, isPremium: boolean): Promise<void> {
        try {
            logEvent(analytics, ANALYTICS_EVENTS.PHOTO_SCAN, {
                user_id: userId,
                is_premium: isPremium,
                timestamp: new Date().toISOString(),
            });

            await this.incrementDailyMetric('photoScans');
        } catch (error) {
            console.error('Error logging photo scan:', error);
        }
    }

    /**
     * Log AI message sent
     */
    async logAIMessage(userId: string, isPremium: boolean, messageLength: number): Promise<void> {
        try {
            logEvent(analytics, ANALYTICS_EVENTS.AI_MESSAGE_SENT, {
                user_id: userId,
                is_premium: isPremium,
                message_length: messageLength,
                timestamp: new Date().toISOString(),
            });

            await this.incrementDailyMetric('aiMessages');
        } catch (error) {
            console.error('Error logging AI message:', error);
        }
    }

    /**
     * Log meal plan generation
     */
    async logMealPlanGenerated(userId: string, planType: string): Promise<void> {
        try {
            logEvent(analytics, ANALYTICS_EVENTS.MEAL_PLAN_GENERATED, {
                user_id: userId,
                plan_type: planType,
                timestamp: new Date().toISOString(),
            });

            await this.incrementDailyMetric('mealPlansGenerated');
        } catch (error) {
            console.error('Error logging meal plan generation:', error);
        }
    }

    // ============ Paywall Events ============

    /**
     * Log paywall impression
     */
    async logPaywallImpression(userId: string, trigger: string, isPremium: boolean): Promise<void> {
        try {
            logEvent(analytics, ANALYTICS_EVENTS.PAYWALL_IMPRESSION, {
                user_id: userId,
                trigger: trigger,
                is_premium: isPremium,
                timestamp: new Date().toISOString(),
            });

            await this.incrementDailyMetric('paywallImpressions');
        } catch (error) {
            console.error('Error logging paywall impression:', error);
        }
    }

    /**
     * Log paywall CTA click
     */
    async logPaywallCTAClick(userId: string, trigger: string, selectedTier: string): Promise<void> {
        try {
            logEvent(analytics, ANALYTICS_EVENTS.PAYWALL_CTA_CLICKED, {
                user_id: userId,
                trigger: trigger,
                selected_tier: selectedTier,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            console.error('Error logging paywall CTA click:', error);
        }
    }

    /**
     * Log paywall dismissal
     */
    async logPaywallDismissed(userId: string, trigger: string): Promise<void> {
        try {
            logEvent(analytics, ANALYTICS_EVENTS.PAYWALL_DISMISSED, {
                user_id: userId,
                trigger: trigger,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            console.error('Error logging paywall dismissal:', error);
        }
    }

    // ============ Quota Events ============

    /**
     * Log quota exhaustion
     */
    async logQuotaExhausted(userId: string, quotaType: string): Promise<void> {
        try {
            logEvent(analytics, ANALYTICS_EVENTS.QUOTA_EXHAUSTED, {
                user_id: userId,
                quota_type: quotaType,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            console.error('Error logging quota exhaustion:', error);
        }
    }

    // ============ User Journey Events ============

    /**
     * Log onboarding started
     */
    async logOnboardingStarted(userId: string): Promise<void> {
        try {
            logEvent(analytics, ANALYTICS_EVENTS.ONBOARDING_STARTED, {
                user_id: userId,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            console.error('Error logging onboarding started:', error);
        }
    }

    /**
     * Log onboarding completed
     */
    async logOnboardingCompleted(userId: string, duration: number): Promise<void> {
        try {
            logEvent(analytics, ANALYTICS_EVENTS.ONBOARDING_COMPLETED, {
                user_id: userId,
                duration_seconds: duration,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            console.error('Error logging onboarding completed:', error);
        }
    }

    // ============ Engagement Events ============

    /**
     * Log app opened
     */
    async logAppOpened(userId: string): Promise<void> {
        try {
            logEvent(analytics, ANALYTICS_EVENTS.APP_OPENED, {
                user_id: userId,
                timestamp: new Date().toISOString(),
            });

            // Update daily active users
            await this.trackDailyActiveUser(userId);
        } catch (error) {
            console.error('Error logging app opened:', error);
        }
    }

    // ============ Metrics Calculation ============

    /**
     * Get conversion metrics
     */
    async getConversionMetrics(days: number = 30): Promise<ConversionMetrics> {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            // Get metrics from Firestore
            const metricsRef = doc(firestore, 'analytics', 'aggregated_metrics');
            const metricsDoc = await getDoc(metricsRef);

            if (!metricsDoc.exists()) {
                return {
                    trialToPayRate: 0,
                    freeToPayRate: 0,
                    churnRate: 0,
                    averageRevenuePerUser: 0,
                    dailyActiveUsers: 0,
                };
            }

            const data = metricsDoc.data();

            // Calculate conversion rates
            const trialToPayRate =
                data.totalTrialActivations > 0
                    ? (data.trialToPayConversions / data.totalTrialActivations) * 100
                    : 0;

            const freeToPayRate =
                data.totalFreeUsers > 0 ? (data.freeToPayConversions / data.totalFreeUsers) * 100 : 0;

            const churnRate =
                data.totalPaidUsers > 0 ? (data.totalChurns / data.totalPaidUsers) * 100 : 0;

            const averageRevenuePerUser =
                data.totalPaidUsers > 0 ? data.totalRevenue / data.totalPaidUsers : 0;

            return {
                trialToPayRate: Math.round(trialToPayRate * 100) / 100,
                freeToPayRate: Math.round(freeToPayRate * 100) / 100,
                churnRate: Math.round(churnRate * 100) / 100,
                averageRevenuePerUser: Math.round(averageRevenuePerUser * 100) / 100,
                dailyActiveUsers: data.dailyActiveUsers || 0,
            };
        } catch (error) {
            console.error('Error getting conversion metrics:', error);
            return {
                trialToPayRate: 0,
                freeToPayRate: 0,
                churnRate: 0,
                averageRevenuePerUser: 0,
                dailyActiveUsers: 0,
            };
        }
    }

    /**
     * Get daily metrics for a specific date
     */
    async getDailyMetrics(date: Date): Promise<AnalyticsMetricsData | null> {
        try {
            const dateStr = this.formatDate(date);
            const metricsRef = doc(firestore, 'analytics', 'daily_metrics', dateStr, 'data');
            const metricsDoc = await getDoc(metricsRef);

            if (!metricsDoc.exists()) {
                return null;
            }

            return metricsDoc.data() as AnalyticsMetricsData;
        } catch (error) {
            console.error('Error getting daily metrics:', error);
            return null;
        }
    }

    // ============ Internal Helper Methods ============

    /**
     * Track daily active user
     */
    private async trackDailyActiveUser(userId: string): Promise<void> {
        try {
            const today = this.formatDate(new Date());
            const dauRef = doc(firestore, 'analytics', 'daily_active_users', today, userId);

            await setDoc(
                dauRef,
                {
                    lastSeen: serverTimestamp(),
                },
                { merge: true }
            );

            // Increment DAU count
            await this.incrementDailyMetric('dailyActiveUsers');
        } catch (error) {
            console.error('Error tracking daily active user:', error);
        }
    }

    /**
     * Increment daily metric
     */
    private async incrementDailyMetric(metric: string, value: number = 1): Promise<void> {
        try {
            const today = this.formatDate(new Date());
            const metricsRef = doc(firestore, 'analytics', 'daily_metrics', today, 'data');

            await setDoc(
                metricsRef,
                {
                    date: today,
                    [metric]: increment(value),
                    updatedAt: serverTimestamp(),
                },
                { merge: true }
            );
        } catch (error) {
            console.error(`Error incrementing daily metric ${metric}:`, error);
        }
    }

    /**
     * Format date as YYYY-MM-DD
     */
    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // ============ Aggregated Metrics Update ============

    /**
     * Update aggregated metrics (should be called periodically)
     */
    async updateAggregatedMetrics(): Promise<void> {
        try {
            const metricsRef = doc(firestore, 'analytics', 'aggregated_metrics');
            const metricsDoc = await getDoc(metricsRef);

            // Get current counts from Firestore
            // This would typically be done by a Cloud Function
            // For now, we just ensure the document exists

            if (!metricsDoc.exists()) {
                await setDoc(metricsRef, {
                    totalTrialActivations: 0,
                    trialToPayConversions: 0,
                    totalFreeUsers: 0,
                    freeToPayConversions: 0,
                    totalPaidUsers: 0,
                    totalChurns: 0,
                    totalRevenue: 0,
                    dailyActiveUsers: 0,
                    updatedAt: serverTimestamp(),
                });
            }
        } catch (error) {
            console.error('Error updating aggregated metrics:', error);
        }
    }
}

// Export singleton instance
export const analyticsService = AnalyticsService.getInstance();
