/**
 * Daily Quota Reset Scheduled Function
 * 
 * Runs daily at midnight UTC to reset usage quotas for all free users
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

const db = admin.firestore();

/**
 * Reset daily usage quotas for all users
 * This runs as a scheduled Cloud Function at midnight UTC
 */
export async function dailyQuotaReset(context: functions.EventContext): Promise<void> {
    try {
        functions.logger.info('Starting daily quota reset');

        // Get all users
        const usersSnapshot = await db.collection('users').get();

        if (usersSnapshot.empty) {
            functions.logger.info('No users found for quota reset');
            return;
        }

        const batchSize = 500; // Firestore batch limit
        let batch = db.batch();
        let operationCount = 0;
        let totalReset = 0;

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;

            // Check if user has premium access
            const subscriptionRef = db
                .collection('users')
                .doc(userId)
                .collection('subscription')
                .doc('data');

            const subscriptionDoc = await subscriptionRef.get();
            const hasPremium = subscriptionDoc.exists && subscriptionDoc.data()?.isActive === true;

            // Only reset quota for free users
            if (!hasPremium) {
                const usageRef = db
                    .collection('users')
                    .doc(userId)
                    .collection('usage')
                    .doc('data');

                batch.set(
                    usageRef,
                    {
                        barcodeScansToday: 0,
                        photoScansToday: 0,
                        aiMessagesToday: 0,
                        lastResetAt: admin.firestore.FieldValue.serverTimestamp(),
                    },
                    { merge: true }
                );

                operationCount++;
                totalReset++;

                // Commit batch when reaching limit
                if (operationCount >= batchSize) {
                    await batch.commit();
                    batch = db.batch();
                    operationCount = 0;
                    functions.logger.info(`Committed batch of ${batchSize} quota resets`);
                }
            }
        }

        // Commit remaining operations
        if (operationCount > 0) {
            await batch.commit();
            functions.logger.info(`Committed final batch of ${operationCount} quota resets`);
        }

        functions.logger.info(`Daily quota reset completed. Total users reset: ${totalReset}`);

        // Log metrics
        await logQuotaResetMetrics(totalReset);
    } catch (error) {
        functions.logger.error('Error during daily quota reset', error);
        throw error;
    }
}

/**
 * Log quota reset metrics to analytics collection
 */
async function logQuotaResetMetrics(totalReset: number): Promise<void> {
    try {
        const metricsRef = db.collection('analytics').doc('metrics');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await metricsRef.set(
            {
                [`quotaResets.${today.toISOString().split('T')[0]}`]: {
                    totalUsersReset: totalReset,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                },
            },
            { merge: true }
        );
    } catch (error) {
        functions.logger.error('Error logging quota reset metrics', error);
    }
}
