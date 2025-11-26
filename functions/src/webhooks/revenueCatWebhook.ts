/**
 * RevenueCat Webhook Handler
 * 
 * Handles webhook events from RevenueCat for subscription lifecycle:
 * - Initial purchase
 * - Renewal
 * - Cancellation
 * - Expiration
 * - Billing issues
 */

import { Request, Response } from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

const db = admin.firestore();

// RevenueCat webhook event types
enum RevenueCatEventType {
    INITIAL_PURCHASE = 'INITIAL_PURCHASE',
    RENEWAL = 'RENEWAL',
    CANCELLATION = 'CANCELLATION',
    UNCANCELLATION = 'UNCANCELLATION',
    NON_RENEWING_PURCHASE = 'NON_RENEWING_PURCHASE',
    EXPIRATION = 'EXPIRATION',
    BILLING_ISSUE = 'BILLING_ISSUE',
    PRODUCT_CHANGE = 'PRODUCT_CHANGE',
    TRANSFER = 'TRANSFER',
}

interface RevenueCatWebhookPayload {
    event: {
        type: RevenueCatEventType;
        app_user_id: string;
        product_id: string;
        period_type: 'TRIAL' | 'NORMAL' | 'INTRO';
        purchased_at_ms: number;
        expiration_at_ms: number | null;
        store: 'APP_STORE' | 'PLAY_STORE' | 'STRIPE' | 'PROMOTIONAL';
        environment: 'SANDBOX' | 'PRODUCTION';
        entitlement_ids: string[];
        presented_offering_id: string | null;
        transaction_id: string;
        original_transaction_id: string;
        is_trial_conversion: boolean;
        price: number;
        currency: string;
        takehome_percentage: number;
        cancellation_reason: string | null;
    };
    api_version: string;
}

/**
 * Main webhook handler
 */
export async function handleRevenueCatWebhook(
    req: Request,
    res: Response
): Promise<void> {
    try {
        // Validate webhook authentication
        if (!validateWebhookAuth(req)) {
            functions.logger.warn('Unauthorized webhook request');
            res.status(401).send('Unauthorized');
            return;
        }

        // Parse webhook payload
        const payload: RevenueCatWebhookPayload = req.body;

        if (!payload || !payload.event) {
            functions.logger.error('Invalid webhook payload');
            res.status(400).send('Invalid payload');
            return;
        }

        functions.logger.info('Received webhook event', {
            type: payload.event.type,
            userId: payload.event.app_user_id,
            productId: payload.event.product_id,
        });

        // Route to appropriate handler based on event type
        switch (payload.event.type) {
            case RevenueCatEventType.INITIAL_PURCHASE:
                await handleInitialPurchase(payload);
                break;

            case RevenueCatEventType.RENEWAL:
                await handleRenewal(payload);
                break;

            case RevenueCatEventType.CANCELLATION:
                await handleCancellation(payload);
                break;

            case RevenueCatEventType.UNCANCELLATION:
                await handleUncancellation(payload);
                break;

            case RevenueCatEventType.NON_RENEWING_PURCHASE:
                await handleNonRenewingPurchase(payload);
                break;

            case RevenueCatEventType.EXPIRATION:
                await handleExpiration(payload);
                break;

            case RevenueCatEventType.BILLING_ISSUE:
                await handleBillingIssue(payload);
                break;

            case RevenueCatEventType.PRODUCT_CHANGE:
                await handleProductChange(payload);
                break;

            default:
                functions.logger.warn('Unhandled event type', { type: payload.event.type });
        }

        // Acknowledge receipt
        res.status(200).send('OK');
    } catch (error) {
        functions.logger.error('Error processing webhook', error);
        res.status(500).send('Internal server error');
    }
}

/**
 * Validate webhook authentication
 * RevenueCat sends an authorization header that should match your webhook secret
 */
function validateWebhookAuth(req: Request): boolean {
    const authHeader = req.headers.authorization;
    const webhookSecret = functions.config().revenuecat?.webhook_secret;

    if (!webhookSecret) {
        functions.logger.warn('Webhook secret not configured');
        return true; // Allow in development, but should be configured in production
    }

    return authHeader === `Bearer ${webhookSecret}`;
}

/**
 * Handle initial purchase (including trial start)
 */
async function handleInitialPurchase(
    payload: RevenueCatWebhookPayload
): Promise<void> {
    const { app_user_id, product_id, period_type, expiration_at_ms, price, currency } = payload.event;

    try {
        const subscriptionRef = db
            .collection('users')
            .doc(app_user_id)
            .collection('subscription')
            .doc('data');

        const tier = determineTier(product_id);
        const isTrialPurchase = period_type === 'TRIAL';

        const updateData: any = {
            tier,
            isActive: true,
            revenueCatCustomerId: app_user_id,
            lastPaymentAmount: price,
            lastPaymentCurrency: currency,
            lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
            isCancelled: false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (isTrialPurchase) {
            // Trial purchase
            updateData.trialStartedAt = admin.firestore.Timestamp.fromMillis(payload.event.purchased_at_ms);
            updateData.trialEndsAt = expiration_at_ms
                ? admin.firestore.Timestamp.fromMillis(expiration_at_ms)
                : null;
        } else {
            // Direct purchase (no trial)
            updateData.subscriptionStartedAt = admin.firestore.Timestamp.fromMillis(payload.event.purchased_at_ms);
            updateData.subscriptionEndsAt = expiration_at_ms
                ? admin.firestore.Timestamp.fromMillis(expiration_at_ms)
                : null;
        }

        await subscriptionRef.set(updateData, { merge: true });

        functions.logger.info('Initial purchase processed', {
            userId: app_user_id,
            tier,
            isTrial: isTrialPurchase,
        });
    } catch (error) {
        functions.logger.error('Error handling initial purchase', error);
        throw error;
    }
}

/**
 * Handle subscription renewal
 */
async function handleRenewal(payload: RevenueCatWebhookPayload): Promise<void> {
    const { app_user_id, product_id, expiration_at_ms, price, currency, is_trial_conversion } = payload.event;

    try {
        const subscriptionRef = db
            .collection('users')
            .doc(app_user_id)
            .collection('subscription')
            .doc('data');

        const tier = determineTier(product_id);

        const updateData: any = {
            tier,
            isActive: true,
            subscriptionEndsAt: expiration_at_ms
                ? admin.firestore.Timestamp.fromMillis(expiration_at_ms)
                : null,
            lastPaymentAmount: price,
            lastPaymentCurrency: currency,
            lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
            isCancelled: false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // If this is a trial conversion, update trial status
        if (is_trial_conversion) {
            updateData.subscriptionStartedAt = admin.firestore.FieldValue.serverTimestamp();
            updateData.isInTrial = false;
        }

        await subscriptionRef.set(updateData, { merge: true });

        // Clear grace period if it was set
        await clearGracePeriod(app_user_id);

        functions.logger.info('Renewal processed', {
            userId: app_user_id,
            tier,
            isTrialConversion: is_trial_conversion,
        });
    } catch (error) {
        functions.logger.error('Error handling renewal', error);
        throw error;
    }
}

/**
 * Handle subscription cancellation
 */
async function handleCancellation(payload: RevenueCatWebhookPayload): Promise<void> {
    const { app_user_id, expiration_at_ms, cancellation_reason } = payload.event;

    try {
        const subscriptionRef = db
            .collection('users')
            .doc(app_user_id)
            .collection('subscription')
            .doc('data');

        await subscriptionRef.update({
            isCancelled: true,
            cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
            cancellationReason: cancellation_reason || 'unknown',
            // Keep subscription active until expiration
            subscriptionEndsAt: expiration_at_ms
                ? admin.firestore.Timestamp.fromMillis(expiration_at_ms)
                : null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Create win-back offer
        await createWinBackOffer(app_user_id);

        functions.logger.info('Cancellation processed', {
            userId: app_user_id,
            reason: cancellation_reason,
        });
    } catch (error) {
        functions.logger.error('Error handling cancellation', error);
        throw error;
    }
}

/**
 * Handle subscription uncancellation (user reactivates)
 */
async function handleUncancellation(payload: RevenueCatWebhookPayload): Promise<void> {
    const { app_user_id } = payload.event;

    try {
        const subscriptionRef = db
            .collection('users')
            .doc(app_user_id)
            .collection('subscription')
            .doc('data');

        await subscriptionRef.update({
            isCancelled: false,
            cancelledAt: admin.firestore.FieldValue.delete(),
            cancellationReason: admin.firestore.FieldValue.delete(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Remove win-back offer
        await db
            .collection('users')
            .doc(app_user_id)
            .collection('subscription')
            .doc('winback')
            .delete();

        functions.logger.info('Uncancellation processed', { userId: app_user_id });
    } catch (error) {
        functions.logger.error('Error handling uncancellation', error);
        throw error;
    }
}

/**
 * Handle non-renewing purchase (lifetime)
 */
async function handleNonRenewingPurchase(
    payload: RevenueCatWebhookPayload
): Promise<void> {
    const { app_user_id, product_id, price, currency } = payload.event;

    try {
        const subscriptionRef = db
            .collection('users')
            .doc(app_user_id)
            .collection('subscription')
            .doc('data');

        await subscriptionRef.set(
            {
                tier: 'lifetime',
                isActive: true,
                subscriptionStartedAt: admin.firestore.FieldValue.serverTimestamp(),
                subscriptionEndsAt: null, // Lifetime has no expiration
                revenueCatCustomerId: app_user_id,
                lastPaymentAmount: price,
                lastPaymentCurrency: currency,
                lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
                isCancelled: false,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
        );

        functions.logger.info('Non-renewing purchase processed', {
            userId: app_user_id,
            productId: product_id,
        });
    } catch (error) {
        functions.logger.error('Error handling non-renewing purchase', error);
        throw error;
    }
}

/**
 * Handle subscription expiration
 */
async function handleExpiration(payload: RevenueCatWebhookPayload): Promise<void> {
    const { app_user_id } = payload.event;

    try {
        const subscriptionRef = db
            .collection('users')
            .doc(app_user_id)
            .collection('subscription')
            .doc('data');

        await subscriptionRef.update({
            isActive: false,
            expiredAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        functions.logger.info('Expiration processed', { userId: app_user_id });
    } catch (error) {
        functions.logger.error('Error handling expiration', error);
        throw error;
    }
}

/**
 * Handle billing issues (payment failed)
 */
async function handleBillingIssue(payload: RevenueCatWebhookPayload): Promise<void> {
    const { app_user_id, expiration_at_ms } = payload.event;

    try {
        const subscriptionRef = db
            .collection('users')
            .doc(app_user_id)
            .collection('subscription')
            .doc('data');

        // Set grace period (3 days for monthly, 7 days for yearly)
        const gracePeriodDays = 3;
        const gracePeriodEnd = new Date();
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays);

        await subscriptionRef.update({
            billingIssue: true,
            billingIssueDetectedAt: admin.firestore.FieldValue.serverTimestamp(),
            gracePeriodEndsAt: admin.firestore.Timestamp.fromDate(gracePeriodEnd),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        functions.logger.info('Billing issue processed', {
            userId: app_user_id,
            gracePeriodEnd,
        });

        // TODO: Send notification to user about payment failure
    } catch (error) {
        functions.logger.error('Error handling billing issue', error);
        throw error;
    }
}

/**
 * Handle product change (upgrade/downgrade)
 */
async function handleProductChange(payload: RevenueCatWebhookPayload): Promise<void> {
    const { app_user_id, product_id, expiration_at_ms } = payload.event;

    try {
        const subscriptionRef = db
            .collection('users')
            .doc(app_user_id)
            .collection('subscription')
            .doc('data');

        const tier = determineTier(product_id);

        await subscriptionRef.update({
            tier,
            subscriptionEndsAt: expiration_at_ms
                ? admin.firestore.Timestamp.fromMillis(expiration_at_ms)
                : null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        functions.logger.info('Product change processed', {
            userId: app_user_id,
            newTier: tier,
        });
    } catch (error) {
        functions.logger.error('Error handling product change', error);
        throw error;
    }
}

/**
 * Determine subscription tier from product ID
 */
function determineTier(productId: string): string {
    if (productId.includes('yearly') || productId.includes('annual')) {
        return 'yearly';
    } else if (productId.includes('lifetime')) {
        return 'lifetime';
    } else if (productId.includes('monthly')) {
        return 'monthly';
    }
    return 'monthly'; // Default
}

/**
 * Create win-back offer for cancelled users
 */
async function createWinBackOffer(userId: string): Promise<void> {
    try {
        const offerExpiresAt = new Date();
        offerExpiresAt.setDate(offerExpiresAt.getDate() + 30); // Offer valid for 30 days

        const winBackRef = db
            .collection('users')
            .doc(userId)
            .collection('subscription')
            .doc('winback');

        await winBackRef.set({
            discountPercent: 50,
            durationMonths: 3,
            expiresAt: admin.firestore.Timestamp.fromDate(offerExpiresAt),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        functions.logger.info('Win-back offer created', { userId });
    } catch (error) {
        functions.logger.error('Error creating win-back offer', error);
        throw error;
    }
}

/**
 * Clear grace period after successful payment
 */
async function clearGracePeriod(userId: string): Promise<void> {
    try {
        const subscriptionRef = db
            .collection('users')
            .doc(userId)
            .collection('subscription')
            .doc('data');

        await subscriptionRef.update({
            billingIssue: admin.firestore.FieldValue.delete(),
            billingIssueDetectedAt: admin.firestore.FieldValue.delete(),
            gracePeriodEndsAt: admin.firestore.FieldValue.delete(),
        });
    } catch (error) {
        functions.logger.error('Error clearing grace period', error);
    }
}
