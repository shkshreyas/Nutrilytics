/**
 * Theme Context
 * Manages light/dark mode switching across the app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorPalette } from '@/constants/colors';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeColors {
    background: string;
    surface: string;
    card: string;
    textPrimary: string;
    textSecondary: string;
}

interface ThemeContextType {
    mode: ThemeMode;
    isDark: boolean;
    colors: ThemeColors;
    setMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@nutrilytics_theme_mode';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [mode, setModeState] = useState<ThemeMode>('auto');

    // Determine if dark mode is active
    const isDark = mode === 'auto'
        ? systemColorScheme === 'dark'
        : mode === 'dark';

    // Get theme colors based on current mode
    const colors: ThemeColors = {
        background: isDark ? colorPalette.background.dark : colorPalette.background.light,
        surface: isDark ? colorPalette.surface.dark : colorPalette.surface.light,
        card: isDark ? colorPalette.card.dark : colorPalette.card.light,
        textPrimary: isDark ? colorPalette.text.primary.dark : colorPalette.text.primary.light,
        textSecondary: isDark ? colorPalette.text.secondary.dark : colorPalette.text.secondary.light,
    };

    // Load saved theme preference on mount
    useEffect(() => {
        loadThemePreference();
    }, []);

    const loadThemePreference = async () => {
        try {
            const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (savedMode && (savedMode === 'light' || savedMode === 'dark' || savedMode === 'auto')) {
                setModeState(savedMode as ThemeMode);
            }
        } catch (error) {
            console.error('Failed to load theme preference:', error);
        }
    };

    const setMode = async (newMode: ThemeMode) => {
        try {
            setModeState(newMode);
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
        } catch (error) {
            console.error('Failed to save theme preference:', error);
        }
    };

    const toggleTheme = () => {
        const newMode = isDark ? 'light' : 'dark';
        setMode(newMode);
    };

    return (
        <ThemeContext.Provider value={{ mode, isDark, colors, setMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
