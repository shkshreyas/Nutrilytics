/**
 * SpinnerLoader Component
 * Animated spinning gradient loader
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { animations } from '@/constants/animations';
import { gradients } from '@/constants/colors';

interface SpinnerLoaderProps {
    size?: number;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    style?: ViewStyle;
}

export const SpinnerLoader: React.FC<SpinnerLoaderProps> = ({
    size = 40,
    variant = 'primary',
    style,
}) => {
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: animations.spin.duration,
                useNativeDriver: true,
            })
        );

        animation.start();

        return () => animation.stop();
    }, []);

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const gradientColors = gradients[variant];

    return (
        <View style={[styles.container, style]}>
            <Animated.View
                style={[
                    {
                        width: size,
                        height: size,
                        transform: [{ rotate }],
                    },
                ]}
            >
                <LinearGradient
                    colors={[...gradientColors, 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        styles.spinner,
                        {
                            width: size,
                            height: size,
                            borderRadius: size / 2,
                            borderWidth: size / 10,
                        },
                    ]}
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    spinner: {
        borderColor: 'transparent',
    },
});
