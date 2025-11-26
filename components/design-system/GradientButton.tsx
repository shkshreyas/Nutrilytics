/**
 * GradientButton Component
 * Reusable button with gradient background and animations
 */

import React, { useRef } from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ViewStyle,
    TextStyle,
    Animated,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '@/constants/colors';
import { animations } from '@/constants/animations';
import { hapticFeedback } from '@/utils/haptics';

interface GradientButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    fullWidth?: boolean;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    style,
    textStyle,
    fullWidth = false,
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        if (!disabled && !loading) {
            hapticFeedback.light();
            Animated.spring(scaleAnim, {
                toValue: animations.buttonPress.scale,
                useNativeDriver: true,
                ...animations.buttonPress,
            }).start();
        }
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            damping: 15,
            mass: 1,
            stiffness: 150,
        }).start();
    };

    const handlePress = () => {
        if (!disabled && !loading) {
            hapticFeedback.medium();
            onPress();
        }
    };

    const gradientColors = gradients[variant];
    const sizeStyles = styles[size] as ViewStyle;
    const textSizeStyles = textStyles[size] as TextStyle;

    return (
        <Animated.View
            style={[
                { transform: [{ scale: scaleAnim }] },
                fullWidth && styles.fullWidth,
                style,
            ]}
        >
            <TouchableOpacity
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handlePress}
                disabled={disabled || loading}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        styles.button,
                        sizeStyles,
                        disabled && styles.disabled,
                    ]}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={[styles.text, textSizeStyles, textStyle]}>
                            {title}
                        </Text>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    button: {
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    small: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    medium: {
        paddingVertical: 14,
        paddingHorizontal: 24,
    },
    large: {
        paddingVertical: 18,
        paddingHorizontal: 32,
    },
    disabled: {
        opacity: 0.5,
    },
    fullWidth: {
        width: '100%',
    },
    text: {
        color: '#FFFFFF',
        fontWeight: '700',
        textAlign: 'center',
    },
});

const textStyles = StyleSheet.create({
    small: {
        fontSize: 14,
    },
    medium: {
        fontSize: 16,
    },
    large: {
        fontSize: 18,
    },
});
