/**
 * Design System - Color Palette
 * Futuristic color scheme with gradient definitions
 */

export const colorPalette = {
    // Primary gradient (used for CTAs, highlights)
    primary: {
        start: '#6366F1', // Indigo
        middle: '#8B5CF6', // Purple
        end: '#EC4899', // Pink
    },

    // Secondary gradient (used for cards, backgrounds)
    secondary: {
        start: '#10B981', // Emerald
        middle: '#06B6D4', // Cyan
        end: '#3B82F6', // Blue
    },

    // Success/Safe gradient
    success: {
        start: '#34D399',
        end: '#10B981',
    },

    // Warning/Allergen gradient
    warning: {
        start: '#FBBF24',
        end: '#F59E0B',
    },

    // Danger/High Risk gradient
    danger: {
        start: '#F87171',
        end: '#EF4444',
    },

    // Neutral colors
    background: {
        light: '#FFFFFF',
        dark: '#0F172A', // Slate 900
    },
    surface: {
        light: '#F8FAFC', // Slate 50
        dark: '#1E293B', // Slate 800
    },
    card: {
        light: 'rgba(255, 255, 255, 0.8)', // Glassmorphism
        dark: 'rgba(30, 41, 59, 0.8)',
    },
    text: {
        primary: {
            light: '#0F172A',
            dark: '#F8FAFC',
        },
        secondary: {
            light: '#64748B',
            dark: '#94A3B8',
        },
    },
};

// Gradient arrays for LinearGradient component
export const gradients = {
    primary: [colorPalette.primary.start, colorPalette.primary.middle, colorPalette.primary.end],
    secondary: [colorPalette.secondary.start, colorPalette.secondary.middle, colorPalette.secondary.end],
    success: [colorPalette.success.start, colorPalette.success.end],
    warning: [colorPalette.warning.start, colorPalette.warning.end],
    danger: [colorPalette.danger.start, colorPalette.danger.end],
};

// Gradient locations for smooth transitions
export const gradientLocations = [0, 0.5, 1];
