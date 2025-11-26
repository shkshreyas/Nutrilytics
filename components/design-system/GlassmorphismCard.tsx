/**
 * GlassmorphismCard Component
 * Card with blur effect, semi-transparent background, and optional gradient border
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/theme';

interface GlassmorphismCardProps {
    children: ReactNode;
    intensity?: number;
    style?: ViewStyle;
    contentStyle?: ViewStyle;
    hasGradientBorder?: boolean;
}

export const GlassmorphismCard: React.FC<GlassmorphismCardProps> = ({
    children,
    intensity = 80,
    style,
    contentStyle,
    hasGradientBorder = false,
}) => {
    const { isDark } = useTheme();

    const CardContent = () => (
        <BlurView
            intensity={intensity}
            tint={isDark ? 'dark' : 'light'}
            style={styles.blurView}
        >
            <View style={[styles.content, contentStyle]}>
                {children}
            </View>
        </BlurView>
    );

    if (hasGradientBorder) {
        return (
            <View style={[styles.container, style]}>
                <LinearGradient
                    colors={Colors.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBorder}
                >
                    <View style={styles.innerContainer}>
                        <CardContent />
                    </View>
                </LinearGradient>
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
            <CardContent />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    gradientBorder: {
        padding: 1.5,
        borderRadius: 24,
    },
    innerContainer: {
        borderRadius: 23,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    blurView: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
    },
    content: {
        padding: 20,
    },
});
