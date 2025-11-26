/**
 * Firebase Cloud Functions for Nutrilytics Subscription Management
 * 
 * This module contains:
 * 1. RevenueCat webhook handler for subscription events
 * 2. Daily quota reset scheduled function
 * 3. Trial expiration handler
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Import function modules
import { handleRevenueCatWebhook } from './webhooks/revenueCatWebhook';
import { dailyQuotaReset } from './scheduled/quotaReset';
import { checkTrialExpirations } from './scheduled/trialExpiration';

// Export HTTP functions
export const revenueCatWebhook = functions.https.onRequest(handleRevenueCatWebhook);

// Export scheduled functions
export const scheduledQuotaReset = functions.pubsub
    .schedule('0 0 * * *') // Run daily at midnight UTC
    .timeZone('UTC')
    .onRun(dailyQuotaReset);

export const scheduledTrialCheck = functions.pubsub
    .schedule('0 */6 * * *') // Run every 6 hours
    .timeZone('UTC')
    .onRun(checkTrialExpirations);
