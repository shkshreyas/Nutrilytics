/**
 * PulseLoader Component
 * Animated pulse effect for loading states
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { animations } from '@/constants/animations';
import { gradients } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

interface PulseLoaderProps {
    size?: number;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    style?: ViewStyle;
}

export const PulseLoader: React.FC<PulseLoaderProps> = ({
    size = 60,
    variant = 'primary',
    style,
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(scaleAnim, {
                        toValue: 1.3,
                        duration: animations.pulse.duration,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: animations.pulse.duration,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.sequence([
                    Animated.timing(opacityAnim, {
                        toValue: 0.3,
                        duration: animations.pulse.duration,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 1,
                        duration: animations.pulse.duration,
                        useNativeDriver: true,
                    }),
                ]),
            ])
        );

        animation.start();

        return () => animation.stop();
    }, []);

    const gradientColors = gradients[variant];

    return (
        <View style={[styles.container, style]}>
            <Animated.View
                style={[
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        transform: [{ scale: scaleAnim }],
                        opacity: opacityAnim,
                    },
                ]}
            >
                <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        styles.gradient,
                        {
                            width: size,
                            height: size,
                            borderRadius: size / 2,
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
    gradient: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
});
