/**
 * Design System - Animation Configuration
 * Consistent animation timings and easing functions
 */

export const animations = {
    // Entrance animations
    fadeIn: {
        duration: 300,
        easing: 'ease-out' as const,
    },
    slideUp: {
        duration: 400,
        easing: 'spring' as const,
    },
    scaleIn: {
        duration: 250,
        easing: 'ease-out' as const,
    },

    // Micro-interactions
    buttonPress: {
        scale: 0.95,
        duration: 100,
    },
    cardHover: {
        scale: 1.02,
        duration: 200,
    },
    shimmer: {
        duration: 1500,
        loop: true,
    },

    // Loading states
    pulse: {
        duration: 1000,
        loop: true,
    },
    spin: {
        duration: 800,
        loop: true,
    },

    // Success feedback
    successBounce: {
        scale: [1, 1.2, 1],
        duration: 500,
    },
    confetti: {
        duration: 2000,
    },
};

// Timing functions for Animated API
export const timingConfig = {
    fast: 150,
    normal: 300,
    slow: 500,
};

// Spring configurations
export const springConfig = {
    default: {
        damping: 15,
        mass: 1,
        stiffness: 150,
    },
    bouncy: {
        damping: 10,
        mass: 1,
        stiffness: 100,
    },
    gentle: {
        damping: 20,
        mass: 1,
        stiffness: 120,
    },
};
