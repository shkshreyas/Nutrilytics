/**
 * SubscriptionPaywall Example Usage
 * Demonstrates how to integrate the SubscriptionPaywall component
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SubscriptionPaywall } from './SubscriptionPaywall';
import { GradientButton } from './design-system';
import { SubscriptionService } from '@/services/subscriptionService';
import { useAuth } from '@/contexts/AuthContext';

export const SubscriptionPaywallExample: React.FC = () => {
    const [paywallVisible, setPaywallVisible] = useState(false);
    const [trigger, setTrigger] = useState<'scan_limit' | 'ai_coach' | 'meal_plan' | 'trial_end'>('scan_limit');
    const { user } = useAuth();

    const handleSubscribe = async (tier: string) => {
        try {
            if (!user) {
                console.error('User not authenticated');
                return;
            }

            const subscriptionService = SubscriptionService.getInstance();
            
            // Get available offerings from RevenueCat
            const offerings = await subscriptionService.getOfferings();
            
            if (!offerings) {
                console.error('No offerings available');
                return;
            }

            // Find the package based on tier
            let packageId = '';
            switch (tier) {
                case 'monthly':
                    packageId = 'nutrilytics_monthly';
                    break;
                case 'yearly':
                    packageId = 'nutrilytics_yearly';
                    break;
                case 'lifetime':
                    packageId = 'nutrilytics_lifetime';
                    break;
            }

            const packageToPurchase = offerings.availablePackages.find(
                (pkg) => pkg.identifier === packageId
            );

            if (!packageToPurchase) {
                console.error('Package not found');
                return;
            }

            // Handle purchase
            const result = await subscriptionService.handlePurchase(user.uid, packageId);
            
            if (result.success) {
                console.log('Subscription successful!');
                // Close paywall and show success message
                setPaywallVisible(false);
            } else {
                console.error('Subscription failed:', result.er