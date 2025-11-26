/**
 * GradientCard Component
 * Card with gradient border and optional gradient background
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';

interface GradientCardProps {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    borderWidth?: number;
    style?: ViewStyle;
    contentStyle?: ViewStyle;
    gradientBackground?: boolean;
}

export const GradientCard: React.FC<GradientCardProps> = ({
    children,
    variant = 'primary',
    borderWidth = 2,
    style,
    contentStyle,
    gradientBackground = false,
}) => {
    const { colors } = useTheme();
    const gradientColors = gradients[variant];

    if (gradientBackground) {
        return (
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, style]}
            >
                <View style={[styles.content, contentStyle]}>
                    {children}
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, style]}
        >
            <View
                style={[
                    styles.innerCard,
                    {
                        backgroundColor: colors.card,
                        margin: borderWidth,
                    },
                    contentStyle,
                ]}
            >
                {children}
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    innerCard: {
        borderRadius: 14,
        padding: 16,
    },
    content: {
        padding: 16,
    },
});
