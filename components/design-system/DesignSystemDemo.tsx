/**
 * Design System Demo
 * Example usage of all design system components
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import {
    GradientButton,
    GradientCard,
    GradientText,
    GlassmorphismCard,
    ShimmerLoader,
    PulseLoader,
    SpinnerLoader,
} from './index';
import { useTheme } from '@/contexts/ThemeContext';

export const DesignSystemDemo: React.FC = () => {
    const { colors, toggleTheme, isDark } = useTheme();

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Gradient Text
                </Text>
                <GradientText variant="primary" style={styles.largeText}>
                    Welcome to Nutrilytics
                </GradientText>
                <GradientText variant="secondary" style={styles.mediumText}>
                    Your AI Nutrition Coach
                </GradientText>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Gradient Buttons
                </Text>
                <GradientButton
                    title="Primary Button"
                    onPress={() => console.log('Primary pressed')}
                    variant="primary"
                    size="large"
                    fullWidth
                    style={styles.button}
                />
                <GradientButton
                    title="Secondary Button"
                    onPress={() => console.log('Secondary pressed')}
                    variant="secondary"
                    size="medium"
                    fullWidth
                    style={styles.button}
                />
                <GradientButton
                    title="Success Button"
                    onPress={() => console.log('Success pressed')}
                    variant="success"
                    size="small"
                    style={styles.button}
                />
                <GradientButton
                    title="Loading..."
                    onPress={() => { }}
                    variant="primary"
                    loading
                    style={styles.button}
                />
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Gradient Cards
                </Text>
                <GradientCard variant="primary" style={styles.card}>
                    <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>
                        Card with Gradient Border
                    </Text>
                    <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
                        This card has a gradient border effect
                    </Text>
                </GradientCard>

                <GradientCard variant="secondary" gradientBackground style={styles.card}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                        Card with Gradient Background
                    </Text>
                    <Text style={{ color: '#FFFFFF', marginTop: 8, opacity: 0.9 }}>
                        This card has a gradient background
                    </Text>
                </GradientCard>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Glassmorphism Card
                </Text>
                <View style={[styles.glassBackground, { backgroundColor: colors.surface }]}>
                    <GlassmorphismCard intensity={80} style={styles.card}>
                        <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>
                            Glassmorphism Effect
                        </Text>
                        <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
                            This card has a blur effect with semi-transparent background
                        </Text>
                    </GlassmorphismCard>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Loading Components
                </Text>

                <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Shimmer Loader
                </Text>
                <ShimmerLoader width="100%" height={60} borderRadius={12} style={styles.loader} />
                <ShimmerLoader width="80%" height={20} borderRadius={8} style={styles.loader} />
                <ShimmerLoader width="60%" height={20} borderRadius={8} style={styles.loader} />

                <Text style={[styles.label, { color: colors.textSecondary, marginTop: 20 }]}>
                    Pulse Loader
                </Text>
                <View style={styles.loaderRow}>
                    <PulseLoader size={60} variant="primary" />
                    <PulseLoader size={60} variant="secondary" />
                    <PulseLoader size={60} variant="success" />
                </View>

                <Text style={[styles.label, { color: colors.textSecondary, marginTop: 20 }]}>
                    Spinner Loader
                </Text>
                <View style={styles.loaderRow}>
                    <SpinnerLoader size={40} variant="primary" />
                    <SpinnerLoader size={40} variant="secondary" />
                    <SpinnerLoader size={40} variant="danger" />
                </View>
            </View>

            <View style={styles.section}>
                <GradientButton
                    title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
                    onPress={toggleTheme}
                    variant="primary"
                    fullWidth
                />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
    },
    largeText: {
        fontSize: 32,
        marginBottom: 8,
    },
    mediumText: {
        fontSize: 20,
    },
    button: {
        marginBottom: 12,
    },
    card: {
        marginBottom: 16,
    },
    glassBackground: {
        padding: 20,
        borderRadius: 16,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
    },
    loader: {
        marginBottom: 12,
    },
    loaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginTop: 12,
    },
});
