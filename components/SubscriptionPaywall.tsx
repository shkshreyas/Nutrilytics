/**
 * SubscriptionPaywall Component
 * Full-screen paywall with gradient background, animated hero section,
 * feature showcase, pricing cards, and contextual messaging
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Dimensions,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { X, Check, Star, Shield, Users, Sparkles, Zap, Heart, TrendingUp } from 'lucide-react-native';
import { GradientButton, GradientCard } from './design-system';
import { gradients, colorPalette } from '@/constants/colors';
import { animations } from '@/constants/animations';
import { hapticFeedback } from '@/utils/haptics';
import { SubscriptionService } from '@/services/subscriptionService';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptions';
import { useTheme } from '@/contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface SubscriptionPaywallProps {
    visible: boolean;
    trigger: 'scan_limit' | 'ai_coach' | 'meal_plan' | 'trial_end';
    onDismiss: () => void;
    onSubscribe: (tier: string) => void;
}

export const SubscriptionPaywall: React.FC<SubscriptionPaywallProps> = ({
    visible,
    trigger,
    onDismiss,
    onSubscribe,
}) => {
    const { isDark } = useTheme();
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | 'lifetime'>('yearly');
    const [loading, setLoading] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const floatAnim1 = useRef(new Animated.Value(0)).current;
    const floatAnim2 = useRef(new Animated.Value(0)).current;
    const floatAnim3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Entrance animations
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    damping: 15,
                    mass: 1,
                    stiffness: 150,
                    useNativeDriver: true,
                }),
            ]).start();

            // Pulse animation for "Best Value" badge
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Floating animations for food icons
            Animated.loop(
                Animated.sequence([
                    Animated.timing(floatAnim1, {
                        toValue: -20,
                        duration: 3000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(floatAnim1, {
                        toValue: 0,
                        duration: 3000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            Animated.loop(
                Animated.sequence([
                    Animated.timing(floatAnim2, {
                        toValue: -15,
                        duration: 2500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(floatAnim2, {
                        toValue: 0,
                        duration: 2500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            Animated.loop(
                Animated.sequence([
                    Animated.timing(floatAnim3, {
                        toValue: -25,
                        duration: 3500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(floatAnim3, {
                        toValue: 0,
                        duration: 3500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            fadeAnim.setValue(0);
            slideAnim.setValue(50);
        }
    }, [visible]);

    const getContextualMessage = () => {
        switch (trigger) {
            case 'scan_limit':
                return {
                    title: 'Daily Scan Limit Reached',
                    subtitle: 'Upgrade to scan unlimited foods and unlock AI-powered nutrition coaching',
                };
            case 'ai_coach':
                return {
                    title: 'Unlock Your AI Nutrition Coach',
                    subtitle: 'Get personalized nutrition advice and meal plans powered by AI',
                };
            case 'meal_plan':
                return {
                    title: 'Get Personalized Meal Plans',
                    subtitle: 'AI-generated weekly meal plans tailored to your allergies and goals',
                };
            case 'trial_end':
                return {
                    title: 'Your Trial is Ending Soon',
                    subtitle: "Don't lose access to your personalized nutrition journey",
                };
            default:
                return {
                    title: 'Unlock Your Full Nutrition Potential',
                    subtitle: 'Get unlimited access to all premium features',
                };
        }
    };

    const handleSubscribe = async () => {
        try {
            setLoading(true);
            hapticFeedback.medium();

            // Call the subscription handler
            await onSubscribe(selectedPlan);

            // Show confetti animation
            setShowConfetti(true);
            hapticFeedback.success();

            // Hide confetti after 2 seconds
            setTimeout(() => {
                setShowConfetti(false);
                onDismiss();
            }, 2000);
        } catch (error) {
            console.error('Subscription error:', error);
            hapticFeedback.error();
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        hapticFeedback.light();
        onDismiss();
    };

    const contextualMessage = getContextualMessage();

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={false}
            onRequestClose={onDismiss}
        >
            <LinearGradient
                colors={[...gradients.primary, ...gradients.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                <Animated.View
                    style={[
                        styles.content,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    {/* Close Button */}
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleClose}
                    >
                        <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.closeButtonBlur}>
                            <X size={24} color="#FFFFFF" />
                        </BlurView>
                    </TouchableOpacity>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Hero Section with Floating Icons */}
                        <View style={styles.heroSection}>
                            {/* Floating Food Icons */}
                            <Animated.View
                                style={[
                                    styles.floatingIcon,
                                    styles.floatingIcon1,
                                    { transform: [{ translateY: floatAnim1 }] },
                                ]}
                            >
                                <Text style={styles.foodEmoji}>🥗</Text>
                            </Animated.View>
                            <Animated.View
                                style={[
                                    styles.floatingIcon,
                                    styles.floatingIcon2,
                                    { transform: [{ translateY: floatAnim2 }] },
                                ]}
                            >
                                <Text style={styles.foodEmoji}>🍎</Text>
                            </Animated.View>
                            <Animated.View
                                style={[
                                    styles.floatingIcon,
                                    styles.floatingIcon3,
                                    { transform: [{ translateY: floatAnim3 }] },
                                ]}
                            >
                                <Text style={styles.foodEmoji}>🥑</Text>
                            </Animated.View>

                            <Text style={styles.heroTitle}>{contextualMessage.title}</Text>
                            <Text style={styles.heroSubtitle}>{contextualMessage.subtitle}</Text>
                        </View>

                        {/* Feature Showcase */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.featuresContainer}
                        >
                            <FeatureCard
                                icon={<Zap size={32} color="#FFFFFF" />}
                                title="Unlimited Scans"
                                description="Scan any food, anytime"
                            />
                            <FeatureCard
                                icon={<Sparkles size={32} color="#FFFFFF" />}
                                title="AI Nutrition Coach"
                                description="24/7 personalized guidance"
                            />
                            <FeatureCard
                                icon={<Heart size={32} color="#FFFFFF" />}
                                title="Meal Plans"
                                description="Custom weekly plans"
                            />
                            <FeatureCard
                                icon={<TrendingUp size={32} color="#FFFFFF" />}
                                title="Track Progress"
                                description="Achieve your goals faster"
                            />
                        </ScrollView>

                        {/* Pricing Cards */}
                        <View style={styles.pricingSection}>
                            <Text style={styles.sectionTitle}>Choose Your Plan</Text>

                            {/* Monthly Plan */}
                            <PricingCard
                                title={SUBSCRIPTION_PLANS.MONTHLY.title}
                                price={SUBSCRIPTION_PLANS.MONTHLY.price}
                                duration="month"
                                features={[
                                    'Unlimited food scanning',
                                    'AI Nutrition Coach',
                                    'Personalized meal plans',
                                    'Advanced allergen detection',
                                    'No advertisements',
                                ]}
                                selected={selectedPlan === 'monthly'}
                                onSelect={() => {
                                    setSelectedPlan('monthly');
                                    hapticFeedback.light();
                                }}
                                badge={null}
                            />

                            {/* Annual Plan (Best Value) */}
                            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                <PricingCard
                                    title={SUBSCRIPTION_PLANS.YEARLY.title}
                                    price={SUBSCRIPTION_PLANS.YEARLY.price}
                                    duration="year"
                                    features={[
                                        'Everything in Monthly',
                                        'Save 58% compared to monthly',
                                        'Priority support',
                                        'Early access to new features',
                                    ]}
                                    selected={selectedPlan === 'yearly'}
                                    onSelect={() => {
                                        setSelectedPlan('yearly');
                                        hapticFeedback.light();
                                    }}
                                    badge="BEST VALUE"
                                    highlighted
                                />
                            </Animated.View>

                            {/* Lifetime Plan */}
                            <PricingCard
                                title={SUBSCRIPTION_PLANS.LIFETIME.title}
                                price={SUBSCRIPTION_PLANS.LIFETIME.price}
                                duration="one-time"
                                features={[
                                    'Everything in Annual',
                                    'Lifetime access',
                                    'All future features included',
                                    'VIP support',
                                ]}
                                selected={selectedPlan === 'lifetime'}
                                onSelect={() => {
                                    setSelectedPlan('lifetime');
                                    hapticFeedback.light();
                                }}
                                badge="LIFETIME ACCESS"
                            />
                        </View>

                        {/* Trust Indicators */}
                        <View style={styles.trustSection}>
                            <TrustIndicator
                                icon={<Users size={20} color={colorPalette.primary.start} />}
                                text="Join 50,000+ users"
                            />
                            <TrustIndicator
                                icon={<Star size={20} color={colorPalette.warning.start} />}
                                text="4.8/5 rating"
                            />
                            <TrustIndicator
                                icon={<Shield size={20} color={colorPalette.success.start} />}
                                text="30-day money-back guarantee"
                            />
                        </View>

                        {/* Subscribe Button */}
                        <GradientButton
                            title={loading ? 'Processing...' : 'Start Free Trial'}
                            onPress={handleSubscribe}
                            variant="primary"
                            size="large"
                            fullWidth
                            loading={loading}
                            disabled={loading}
                            style={styles.subscribeButton}
                        />

                        {/* Auto-pay Disclosure */}
                        <Text style={styles.disclosure}>
                            14-day free trial. Payment will be charged automatically after trial ends unless cancelled.
                            Cancel anytime in Google Play settings.
                        </Text>

                        <TouchableOpacity onPress={handleClose}>
                            <Text style={styles.termsLink}>Terms & Conditions</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </Animated.View>

                {/* Confetti Animation */}
                {showConfetti && <ConfettiAnimation />}
            </LinearGradient>
        </Modal>
    );
};

// Feature Card Component
interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
    return (
        <BlurView intensity={60} tint="dark" style={styles.featureCard}>
            <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.featureIconContainer}
            >
                {icon}
            </LinearGradient>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureDescription}>{description}</Text>
            <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>PREMIUM</Text>
            </View>
        </BlurView>
    );
};

// Pricing Card Component
interface PricingCardProps {
    title: string;
    price: string;
    duration: string;
    features: string[];
    selected: boolean;
    onSelect: () => void;
    badge: string | null;
    highlighted?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({
    title,
    price,
    duration,
    features,
    selected,
    onSelect,
    badge,
    highlighted = false,
}) => {
    return (
        <TouchableOpacity onPress={onSelect} activeOpacity={0.8}>
            <View style={[styles.pricingCard, highlighted && styles.pricingCardHighlighted]}>
                {badge && (
                    <LinearGradient
                        colors={highlighted ? gradients.warning : gradients.success}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.badge}
                    >
                        <Text style={styles.badgeText}>{badge}</Text>
                    </LinearGradient>
                )}

                <BlurView
                    intensity={selected ? 100 : 80}
                    tint="dark"
                    style={[
                        styles.pricingCardContent,
                        selected && styles.pricingCardSelected,
                    ]}
                >
                    <View style={styles.pricingHeader}>
                        <Text style={styles.pricingTitle}>{title}</Text>
                        <View style={styles.priceContainer}>
                            <Text style={styles.price}>{price}</Text>
                            <Text style={styles.duration}>/{duration}</Text>
                        </View>
                    </View>

                    <View style={styles.featuresListContainer}>
                        {features.map((feature, index) => (
                            <View key={index} style={styles.featureItem}>
                                <Check size={16} color={colorPalette.success.start} />
                                <Text style={styles.featureText}>{feature}</Text>
                            </View>
                        ))}
                    </View>

                    {selected && (
                        <View style={styles.selectedIndicator}>
                            <Check size={20} color="#FFFFFF" />
                        </View>
                    )}
                </BlurView>
            </View>
        </TouchableOpacity>
    );
};

// Trust Indicator Component
interface TrustIndicatorProps {
    icon: React.ReactNode;
    text: string;
}

const TrustIndicator: React.FC<TrustIndicatorProps> = ({ icon, text }) => {
    return (
        <View style={styles.trustIndicator}>
            {icon}
            <Text style={styles.trustText}>{text}</Text>
        </View>
    );
};

// Confetti Animation Component
const ConfettiAnimation: React.FC = () => {
    const confettiPieces = Array.from({ length: 50 }, (_, i) => i);

    return (
        <View style={styles.confettiContainer} pointerEvents="none">
            {confettiPieces.map((i) => (
                <ConfettiPiece key={i} index={i} />
            ))}
        </View>
    );
};

const ConfettiPiece: React.FC<{ index: number }> = ({ index }) => {
    const translateY = useRef(new Animated.Value(-50)).current;
    const translateX = useRef(new Animated.Value(Math.random() * width)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: height + 50,
                duration: 2000 + Math.random() * 1000,
                useNativeDriver: true,
            }),
            Animated.timing(rotate, {
                toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
                duration: 2000,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const colors = [
        colorPalette.primary.start,
        colorPalette.primary.end,
        colorPalette.secondary.start,
        colorPalette.warning.start,
        colorPalette.success.start,
    ];

    const color = colors[index % colors.length];

    return (
        <Animated.View
            style={[
                styles.confettiPiece,
                {
                    backgroundColor: color,
                    transform: [
                        { translateX },
                        { translateY },
                        {
                            rotate: rotate.interpolate({
                                inputRange: [0, 360],
                                outputRange: ['0deg', '360deg'],
                            })
                        },
                    ],
                },
            ]}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        borderRadius: 20,
        overflow: 'hidden',
    },
    closeButtonBlur: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingTop: 100,
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 32,
        position: 'relative',
    },
    floatingIcon: {
        position: 'absolute',
    },
    floatingIcon1: {
        top: -20,
        left: 20,
    },
    floatingIcon2: {
        top: 40,
        right: 30,
    },
    floatingIcon3: {
        top: 80,
        left: 40,
    },
    foodEmoji: {
        fontSize: 48,
        opacity: 0.8,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 12,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    heroSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    featuresContainer: {
        paddingVertical: 20,
        gap: 16,
    },
    featureCard: {
        width: 160,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        overflow: 'hidden',
    },
    featureIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
    },
    premiumBadge: {
        marginTop: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    premiumBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    pricingSection: {
        marginTop: 32,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 20,
    },
    pricingCard: {
        marginBottom: 16,
        position: 'relative',
    },
    pricingCardHighlighted: {
        transform: [{ scale: 1.02 }],
    },
    badge: {
        position: 'absolute',
        top: -10,
        left: '50%',
        transform: [{ translateX: -60 }],
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12,
        zIndex: 1,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    pricingCardContent: {
        borderRadius: 16,
        padding: 20,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        overflow: 'hidden',
    },
    pricingCardSelected: {
        borderColor: '#FFFFFF',
        borderWidth: 3,
    },
    pricingHeader: {
        marginBottom: 16,
    },
    pricingTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    price: {
        fontSize: 36,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    duration: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
        marginLeft: 4,
    },
    featuresListContainer: {
        gap: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    featureText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        flex: 1,
    },
    selectedIndicator: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colorPalette.success.start,
        alignItems: 'center',
        justifyContent: 'center',
    },
    trustSection: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 32,
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16,
    },
    trustIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    trustText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    subscribeButton: {
        marginTop: 24,
    },
    disclosure: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 18,
        paddingHorizontal: 20,
    },
    termsLink: {
        fontSize: 12,
        color: '#FFFFFF',
        textAlign: 'center',
        marginTop: 12,
        textDecorationLine: 'underline',
    },
    confettiContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 100,
    },
    confettiPiece: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 2,
    },
});
