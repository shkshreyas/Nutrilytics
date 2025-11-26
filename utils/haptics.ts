/**
 * Haptic Feedback Utility
 * Provides consistent haptic feedback across the app
 */

import * as Haptics from 'expo-haptics';

export const hapticFeedback = {
    /**
     * Light impact for button presses and selections
     */
    light: async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            // Haptics not available on this device
            console.debug('Haptics not available:', error);
        }
    },

    /**
     * Medium impact for confirmations and toggles
     */
    medium: async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {
            console.debug('Haptics not available:', error);
        }
    },

    /**
     * Heavy impact for important actions
     */
    heavy: async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } catch (error) {
            console.debug('Haptics not available:', error);
        }
    },

    /**
     * Success notification for completed actions
     */
    success: async () => {
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.debug('Haptics not available:', error);
        }
    },

    /**
     * Warning notification for cautionary actions
     */
    warning: async () => {
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch (error) {
            console.debug('Haptics not available:', error);
        }
    },

    /**
     * Error notification for failed actions
     */
    error: async () => {
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (error) {
            console.debug('Haptics not available:', error);
        }
    },

    /**
     * Selection feedback for picker/slider changes
     */
    selection: async () => {
        try {
            await Haptics.selectionAsync();
        } catch (error) {
            console.debug('Haptics not available:', error);
        }
    },
};
