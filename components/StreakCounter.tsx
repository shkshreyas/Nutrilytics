import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Flame } from 'lucide-react-native';
import { Colors } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

interface StreakCounterProps {
    streak: number;
}

export default function StreakCounter({ streak }: StreakCounterProps) {
    const scaleAnim = new Animated.Value(1);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.badge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <Flame size={20} color="#FFF" fill="#FFF" />
                </Animated.View>
                <Text style={styles.text}>{streak} Day Streak</Text>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        shadowColor: '#FFA500',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    text: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
