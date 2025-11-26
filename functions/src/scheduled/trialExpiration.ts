/**
 * Trial Expiration Check Scheduled Function
 * 
 * Runs every 6 hours to:
 * 1. Check for trials expiring soon (Day 12) and send reminders
 * 2. Handle trial expirations and auto-charge logic
 * 3. Manage grace periods for failed payments
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

const db = admin.firestore();

/**
 * Check trial expirations and handle auto-charge logic
 */
export async function checkTrialExpirations(context: functions.EventContext): Promise<void> {
    try {
        functions.logger.info('Starting trial expiration check');

        const now = new Date();
        const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

        // Get all users with active trials
        const usersSnapshot = await db.collection('users').get();

        let trialsExpiringSoon = 0;
        let trialsExpired = 0;
        let gracePeriodExpired = 0;

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;

            const subscriptionRef = db
                .collection('users')
                .doc(userId)
                .collection('subscription')
                .doc('data');

            const subscriptionDoc = await subscriptionRef.get();

            if (!subscriptionDoc.exists) {
                continue;
            }

            const subscriptionData = subscriptionDoc.data();

            // Check for trials expiring in 2 days (Day 12 reminder)
            if (subscriptionData?.trialEndsAt) {
                const trialEndDate = subscriptionData.trialEndsAt.toDate();

                // Send reminder if trial expires in ~2 days and reminder not sent yet
                if (
                    trialEndDate > now &&
                    trialEndDate <= twoDaysFromNow &&
                    !subscriptionData.reminderSent
                ) {
                    await sendTrialExpirationReminder(userId, trialEndDate);
                    await subscriptionRef.update({
                        reminderSent: true,
                        reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    trialsExpiringSoon++;
                }

                // Handle expired trials
                if (trialEndDate <= now && subscriptionData.isActive) {
                    await handleTrialExpiration(userId, subscriptionData);
                    trialsExpired++;
                }
            }

            // Check for expired grace periods
            if (subscriptionData?.gracePeriodEndsAt) {
                const gracePeriodEnd = subscriptionData.gracePeriodEndsAt.toDate();

                if (gracePeriodEnd <= now && subscriptionData.isActive) {
                    await handleGracePeriodExpiration(userId);
                    gracePeriodExpired++;
                }
            }
        }

        functions.logger.info('Trial expiration check completed', {
            trialsExpiringSoon,
            trialsExpired,
            gracePeriodExpired,
        });

        // Log metrics
        await logTrialMetrics(trialsExpiringSoon, trialsExpired, gracePeriodExpired);
    } catch (error) {
        functions.logger.error('Error during trial expiration check', error);
        throw error;
    }
}

/**
 * Send trial expiration reminder notification
 * This would integrate with your notification service
 */
async function sendTrialExpirationReminder(
    userId: string,
    trialEndDate: Date
): Promise<void> {
    try {
        // Get user data for notification
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();

        if (!userData) {
            return;
        }

        // Calculate hours remaining
        const hoursRemaining = Math.ceil(
            (trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60)
        );

        // Store notification in Firestore for the app to pick up
        const notificationRef = db
            .collection('users')
            .doc(userId)
            .collection('notifications')
            .doc();

        await notificationRef.set({
            type: 'trial_expiring',
            title: 'Your trial ends soon!',
            body: `Your free trial ends in ${hoursRemaining} hours. You will be charged automatically unless you cancel.`,
            data: {
                screen: 'subscription',
                action: 'manage_subscription',
            },
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        functions.logger.info('Trial expiration reminder sent', {
            userId,
            hoursRemaining,
        });

        // TODO: Integrate with push notification service (FCM)
        // This would send an actual push notification to the user's device
    } catch (error) {
        functions.logger.error('Error sending trial expiration reminder', error);
    }
}

/**
 * Handle trial expiration and auto-charge
 * RevenueCat handles the actual charging, we just update our records
 */
async function handleTrialExpiration(
    userId: string,
    subscriptionData: any
): Promise<void> {
    try {
        const subscriptionRef = db
            .collection('users')
            .doc(userId)
            .collection('subscription')
            .doc('data');

        // Check if user cancelled during trial
        if (subscriptionData.isCancelled) {
            // Trial expired and user cancelled - revert to free tier
            await subscriptionRef.update({
                isActive: false,
                tier: 'free',
                trialEndsAt: null,
                expiredAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            functions.logger.info('Trial expired - user cancelled', { userId });
        } else {
            // Trial expired - RevenueCat should auto-charge
            // We'll wait for the webhook to confirm the charge
            // Just mark that trial period ended
            await subscriptionRef.update({
                isInTrial: false,
                trialEndedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            functions.logger.info('Trial expired - awaiting auto-charge confirmation', {
                userId,
            });

            // Send notification about successful conversion
            await sendTrialConversionNotification(userId);
        }
    } catch (error) {
        functions.logger.error('Error handling trial expiration', error);
        throw error;
    }
}

/**
 * Handle grace period expiration (payment failed and grace period ended)
 */
async function handleGracePeriodExpiration(userId: string): Promise<void> {
    try {
        const subscriptionRef = db
            .collection('users')
            .doc(userId)
            .collection('subscription')
            .doc('data');

        // Deactivate subscription
        await subscriptionRef.update({
            isActive: false,
            tier: 'free',
            gracePeriodExpiredAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Send notification about subscription deactivation
        const notificationRef = db
            .collection('users')
            .doc(userId)
            .collection('notifications')
            .doc();

        await notificationRef.set({
            type: 'subscription_deactivated',
            title: 'Subscription Deactivated',
            body: 'Your subscription has been deactivated due to payment failure. Please update your payment method to continue.',
            data: {
                screen: 'subscription',
                action: 'update_payment',
            },
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        functions.logger.info('Grace period expired - subscription deactivated', {
            userId,
        });
    } catch (error) {
        functions.logger.error('Error handling grace period expiration', error);
        throw error;
    }
}

/**
 * Send trial conversion notification
 */
async function sendTrialConversionNotification(userId: string): Promise<void> {
    try {
        const notificationRef = db
            .collection('users')
            .doc(userId)
            .collection('notifications')
            .doc();

        await notificationRef.set({
            type: 'trial_converted',
            title: 'Welcome to Premium!',
            body: 'Your trial has ended and your subscription is now active. Enjoy unlimited access to all features!',
            data: {
                screen: 'home',
            },
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        functions.logger.info('Trial conversion notification sent', { userId });
    } catch (error) {
        functions.logger.error('Error sending trial conversion notification', error);
    }
}

/**
 * Log trial metrics to analytics collection
 */
async function logTrialMetrics(
    trialsExpiringSoon: number,
    trialsExpired: number,
    gracePeriodExpired: number
): Promise<void> {
    try {
        const metricsRef = db.collection('analytics').doc('metrics');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await metricsRef.set(
            {
                [`trialMetrics.${today.toISOString().split('T')[0]}`]: {
                    trialsExpiringSoon,
                    trialsExpired,
                    gracePeriodExpired,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                },
            },
            { merge: true }
        );
    } catch (error) {
        functions.logger.error('Error logging trial metrics', error);
    }
}
