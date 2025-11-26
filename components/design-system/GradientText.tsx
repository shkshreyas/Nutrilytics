/**
 * GradientText Component
 * Text with gradient color effect using MaskedView
 */

import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '@/constants/colors';

interface GradientTextProps {
    children: string;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    style?: TextStyle;
}

export const GradientText: React.FC<GradientTextProps> = ({
    children,
    variant = 'primary',
    style,
}) => {
    const gradientColors = gradients[variant];

    return (
        <MaskedView
            maskElement={
                <Text style={[styles.text, style]}>
                    {children}
                </Text>
            }
        >
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                <Text style={[styles.text, style, styles.transparent]}>
                    {children}
                </Text>
            </LinearGradient>
        </MaskedView>
    );
};

const styles = StyleSheet.create({
    text: {
        fontWeight: '700',
        fontSize: 24,
    },
    transparent: {
        opacity: 0,
    },
});
