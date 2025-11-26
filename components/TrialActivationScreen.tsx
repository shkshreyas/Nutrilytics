/**
 * TrialActivationScreen Component
 * Animated trial activation screen with hero section, benefits list, payment method selection,
 * and clear auto-pay disclosure for onboarding flow
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
import {
  Check,
  Zap,
  Sparkles,
  Heart,
  TrendingUp,
  Lock,
  AlertCircle,
  ChevronRight,
  AlertTriangle,
  X,
} from 'lucide-react-native';
import { GradientButton } from './design-system';
import { gradients, colorPalette } from '@/constants/colors';
import { hapticFeedback } from '@/utils/haptics';
import { SubscriptionService } from '@/services/subscriptionService';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptions';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

interface TrialActivationScreenProps {
  visible: boolean;
  onActivateTrial: (
    paymentMethod: 'monthly' | 'annual',
    methodType: 'google_pay' | 'card'
  ) => Promise<void>;
  onSkipTrial: () => void;
  onDismiss: () => void;
}

export const TrialActivationScreen: React.FC<TrialActivationScreenProps> = ({
  visible,
  onActivateTrial,
  onSkipTrial,
  onDismiss,
}) => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>(
    'annual'
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    'google_pay' | 'card'
  >('google_pay');
  const [loading, setLoading] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const checkmark1Anim = useRef(new Animated.Value(0)).current;
  const checkmark2Anim = useRef(new Animated.Value(0)).current;
  const checkmark3Anim = useRef(new Animated.Value(0)).current;

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

      // Sequential checkmark animations
      Animated.sequence([
        Animated.timing(checkmark1Anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(checkmark2Anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(checkmark3Anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      checkmark1Anim.setValue(0);
      checkmark2Anim.setValue(0);
      checkmark3Anim.setValue(0);
    }
  }, [visible]);

  const handleActivateTrial = async () => {
    try {
      setLoading(true);
      hapticFeedback.medium();

      await onActivateTrial(selectedPlan, selectedPaymentMethod);

      hapticFeedback.success();
      // Close screen after successful activation
      setTimeout(() => {
        onDismiss();
      }, 1000);
    } catch (error) {
      console.error('Trial activation error:', error);
      hapticFeedback.error();
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setShowSkipModal(true);
  };

  const confirmSkip = () => {
    hapticFeedback.light();
    setShowSkipModal(false);
    onSkipTrial();
  };

  const BenefitItem: React.FC<{
    anim: Animated.Value;
    icon: React.ReactNode;
    title: string;
    description: string;
  }> = ({ anim, icon, title, description }) => {
    return (
      <Animated.View
        style={[
          styles.benefitItem,
          {
            opacity: anim,
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.benefitIconContainer}
        >
          {icon}
        </LinearGradient>
        <View style={styles.benefitContent}>
          <Text style={styles.benefitTitle}>{title}</Text>
          <Text style={styles.benefitDescription}>{description}</Text>
        </View>
      </Animated.View>
    );
  };

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
          <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
            <BlurView
              intensity={80}
              tint={isDark ? 'dark' : 'light'}
              style={styles.closeButtonBlur}
            >
              <X size={24} color="#FFFFFF" />
            </BlurView>
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Hero Section with Sequential Checkmarks */}
            <View style={styles.heroSection}>
              <Text style={styles.heroTag}>EXCLUSIVE OFFER</Text>
              <Text style={styles.heroTitle}>14 Days Free</Text>
              <Text style={styles.heroSubtitle}>
                Try all premium features, no payment required
              </Text>

              {/* Sequential Checkmarks */}
              <View style={styles.checkmarkContainer}>
                <Animated.View
                  style={[
                    styles.checkmarkWrapper,
                    {
                      opacity: checkmark1Anim,
                      transform: [
                        {
                          scale: checkmark1Anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.5, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.checkmarkCircle}>
                    <Check size={24} color="#FFFFFF" strokeWidth={3} />
                  </View>
                </Animated.View>

                <View style={styles.checkmarkLine} />

                <Animated.View
                  style={[
                    styles.checkmarkWrapper,
                    {
                      opacity: checkmark2Anim,
                      transform: [
                        {
                          scale: checkmark2Anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.5, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.checkmarkCircle}>
                    <Check size={24} color="#FFFFFF" strokeWidth={3} />
                  </View>
                </Animated.View>

                <View style={styles.checkmarkLine} />

                <Animated.View
                  style={[
                    styles.checkmarkWrapper,
                    {
                      opacity: checkmark3Anim,
                      transform: [
                        {
                          scale: checkmark3Anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.5, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.checkmarkCircle}>
                    <Check size={24} color="#FFFFFF" strokeWidth={3} />
                  </View>
                </Animated.View>
              </View>

              <Text style={styles.checkmarkText}>No card required</Text>
            </View>

            {/* Benefits Section */}
            <View style={styles.benefitsSection}>
              <Text style={styles.sectionTitle}>What You'll Get</Text>

              <BenefitItem
                anim={checkmark1Anim}
                icon={<Zap size={32} color="#FFFFFF" />}
                title="Unlimited Scans"
                description="Scan as many foods as you want"
              />

              <BenefitItem
                anim={checkmark2Anim}
                icon={<Sparkles size={32} color="#FFFFFF" />}
                title="AI Nutrition Coach"
                description="24/7 personalized nutrition guidance"
              />

              <BenefitItem
                anim={checkmark3Anim}
                icon={<Heart size={32} color="#FFFFFF" />}
                title="Meal Plans"
                description="Custom weekly meal plans for your goals"
              />
            </View>

            {/* Plan Selection */}
            <View style={styles.planSelectionSection}>
              <Text style={styles.sectionTitle}>Choose Your Plan</Text>

              {/* Monthly Plan */}
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'monthly' && styles.planCardSelected,
                ]}
                onPress={() => {
                  setSelectedPlan('monthly');
                  hapticFeedback.light();
                }}
                activeOpacity={0.8}
              >
                <BlurView
                  intensity={selectedPlan === 'monthly' ? 100 : 80}
                  tint="dark"
                  style={styles.planCardContent}
                >
                  <View style={styles.planHeader}>
                    <Text style={styles.planTitle}>Monthly Premium</Text>
                    {selectedPlan === 'monthly' && (
                      <Check size={20} color={colorPalette.success.start} />
                    )}
                  </View>
                  <View style={styles.planPriceContainer}>
                    <Text style={styles.planPrice}>
                      ₹{SUBSCRIPTION_PLANS.MONTHLY.priceValue}
                    </Text>
                    <Text style={styles.planDuration}>/month after trial</Text>
                  </View>
                  <Text style={styles.planFeature}>• Auto-renews monthly</Text>
                  <Text style={styles.planFeature}>• Cancel anytime</Text>
                </BlurView>
              </TouchableOpacity>

              {/* Annual Plan (Most Popular) */}
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'annual' && styles.planCardSelected,
                  styles.planCardHighlighted,
                ]}
                onPress={() => {
                  setSelectedPlan('annual');
                  hapticFeedback.light();
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={gradients.warning}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.badgeContainer}
                >
                  <Text style={styles.mostPopularBadge}>MOST POPULAR</Text>
                </LinearGradient>

                <BlurView
                  intensity={selectedPlan === 'annual' ? 100 : 80}
                  tint="dark"
                  style={styles.planCardContent}
                >
                  <View style={styles.planHeader}>
                    <Text style={styles.planTitle}>Annual Premium</Text>
                    {selectedPlan === 'annual' && (
                      <Check size={20} color={colorPalette.success.start} />
                    )}
                  </View>
                  <View style={styles.planPriceContainer}>
                    <Text style={styles.planPrice}>
                      ₹{SUBSCRIPTION_PLANS.YEARLY.priceValue}
                    </Text>
                    <Text style={styles.planDuration}>/year after trial</Text>
                  </View>
                  <Text style={styles.planFeature}>• Save 58% vs monthly</Text>
                  <Text style={styles.planFeature}>• Best value option</Text>
                </BlurView>
              </TouchableOpacity>
            </View>

            {/* Payment Method Selection */}
            <View style={styles.paymentSection}>
              <Text style={styles.sectionTitle}>Payment Method</Text>

              {/* Google Pay Button */}
              <TouchableOpacity
                style={[
                  styles.paymentMethodCard,
                  selectedPaymentMethod === 'google_pay' &&
                    styles.paymentMethodSelected,
                ]}
                onPress={() => {
                  setSelectedPaymentMethod('google_pay');
                  hapticFeedback.light();
                }}
                activeOpacity={0.8}
              >
                <BlurView
                  intensity={selectedPaymentMethod === 'google_pay' ? 100 : 80}
                  tint="dark"
                  style={styles.paymentMethodContent}
                >
                  <Text style={styles.paymentMethodIcon}>🔐</Text>
                  <View style={styles.paymentMethodDetails}>
                    <Text style={styles.paymentMethodTitle}>
                      Google Play Billing
                    </Text>
                    <Text style={styles.paymentMethodDescription}>
                      Secure payment method
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colorPalette.primary.start} />
                </BlurView>
              </TouchableOpacity>

              {/* Card Payment Button */}
              <TouchableOpacity
                style={[
                  styles.paymentMethodCard,
                  selectedPaymentMethod === 'card' &&
                    styles.paymentMethodSelected,
                ]}
                onPress={() => {
                  setSelectedPaymentMethod('card');
                  hapticFeedback.light();
                }}
                activeOpacity={0.8}
              >
                <BlurView
                  intensity={selectedPaymentMethod === 'card' ? 100 : 80}
                  tint="dark"
                  style={styles.paymentMethodContent}
                >
                  <Text style={styles.paymentMethodIcon}>💳</Text>
                  <View style={styles.paymentMethodDetails}>
                    <Text style={styles.paymentMethodTitle}>
                      Credit/Debit Card
                    </Text>
                    <Text style={styles.paymentMethodDescription}>
                      Visa, Mastercard, etc.
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colorPalette.primary.start} />
                </BlurView>
              </TouchableOpacity>
            </View>

            {/* Trust & Transparency Section */}
            <BlurView intensity={80} tint="dark" style={styles.trustCard}>
              <View style={styles.trustCardContent}>
                <Lock size={20} color={colorPalette.success.start} />
                <Text style={styles.trustTitle}>100% Safe & Secure</Text>
                <Text style={styles.trustDescription}>
                  Your payment information is encrypted and secure. We use
                  industry-standard security protocols.
                </Text>
              </View>
            </BlurView>

            {/* Auto-Pay Disclosure */}
            <View style={styles.disclosureSection}>
              <View style={styles.disclosureHeader}>
                <AlertCircle size={16} color={colorPalette.warning.start} />
                <Text style={styles.disclosureTitle}>Auto-Pay Terms</Text>
              </View>
              <Text style={styles.disclosureText}>
                After your 14-day free trial ends, your payment method will be
                charged for the{' '}
                {selectedPlan === 'annual' ? 'annual' : 'monthly'} plan (₹
                {selectedPlan === 'annual'
                  ? SUBSCRIPTION_PLANS.YEARLY.priceValue
                  : SUBSCRIPTION_PLANS.MONTHLY.priceValue}
                ).
              </Text>
              <Text style={styles.disclosureText}>
                Your subscription will auto-renew unless you cancel before the
                trial ends. You can manage or cancel your subscription anytime
                in Google Play settings.
              </Text>
              <Text style={styles.disclosureText}>
                By tapping "Start My Free Trial", you agree to our Terms of
                Service and acknowledge the subscription terms above.
              </Text>
            </View>

            {/* CTA Button */}
            <GradientButton
              title={loading ? 'Processing...' : 'Start My Free Trial'}
              onPress={handleActivateTrial}
              variant="primary"
              size="large"
              fullWidth
              loading={loading}
              disabled={loading}
              style={styles.ctaButton}
            />

            {/* Skip Option */}
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>

        {/* Skip Confirmation Modal */}
        <Modal
          visible={showSkipModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowSkipModal(false)}
        >
          <View style={styles.modalOverlay}>
            <BlurView
              intensity={90}
              tint={isDark ? 'dark' : 'light'}
              style={styles.blurContainer}
            >
              <View style={styles.skipModalContent}>
                <AlertTriangle size={48} color={colorPalette.warning.start} />
                <Text style={styles.skipModalTitle}>Free Tier Limitations</Text>
                <Text style={styles.skipModalDescription}>
                  Without the free trial, you'll be limited to:
                </Text>

                <View style={styles.limitationsList}>
                  <View style={styles.limitationItem}>
                    <Text style={styles.limitationBullet}>•</Text>
                    <Text style={styles.limitationText}>
                      5 barcode scans per day
                    </Text>
                  </View>
                  <View style={styles.limitationItem}>
                    <Text style={styles.limitationBullet}>•</Text>
                    <Text style={styles.limitationText}>
                      3 photo scans per day
                    </Text>
                  </View>
                  <View style={styles.limitationItem}>
                    <Text style={styles.limitationBullet}>•</Text>
                    <Text style={styles.limitationText}>
                      3 AI messages per day
                    </Text>
                  </View>
                  <View style={styles.limitationItem}>
                    <Text style={styles.limitationBullet}>•</Text>
                    <Text style={styles.limitationText}>
                      No meal plan generation
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.skipConfirmButton}
                  onPress={confirmSkip}
                >
                  <Text style={styles.skipConfirmButtonText}>
                    Yes, continue to free tier
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skipCancelButton}
                  onPress={() => setShowSkipModal(false)}
                >
                  <Text style={styles.skipCancelButtonText}>Back to trial</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </Modal>
      </LinearGradient>
    </Modal>
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
  },
  heroTag: {
    fontSize: 12,
    fontWeight: '800',
    color: colorPalette.warning.start,
    letterSpacing: 2,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  checkmarkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    height: 60,
  },
  checkmarkWrapper: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colorPalette.success.start,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkLine: {
    width: 24,
    height: 2,
    backgroundColor: colorPalette.success.start,
    marginHorizontal: 8,
  },
  checkmarkText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  benefitsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  benefitIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  benefitContent: {
    flex: 1,
    justifyContent: 'center',
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  planSelectionSection: {
    marginBottom: 32,
  },
  planCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  planCardSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  planCardHighlighted: {
    marginTop: 4,
  },
  badgeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: 'center',
    marginBottom: -12,
    marginTop: 12,
    marginLeft: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  mostPopularBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  planCardContent: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  planDuration: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 8,
  },
  planFeature: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  paymentSection: {
    marginBottom: 32,
  },
  paymentMethodCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  paymentMethodSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  paymentMethodIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  paymentMethodDetails: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  paymentMethodDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  trustCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  trustCardContent: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  trustTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  trustDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  disclosureSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  disclosureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  disclosureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colorPalette.warning.start,
  },
  disclosureText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
    marginBottom: 8,
  },
  ctaButton: {
    marginBottom: 16,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipModalContent: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  skipModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  skipModalDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
    textAlign: 'center',
  },
  limitationsList: {
    width: '100%',
    marginBottom: 20,
  },
  limitationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  limitationBullet: {
    fontSize: 16,
    color: colorPalette.warning.start,
    marginRight: 12,
    fontWeight: '700',
  },
  limitationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  skipConfirmButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colorPalette.warning.start,
    alignItems: 'center',
    marginBottom: 12,
  },
  skipConfirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skipCancelButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
  },
  skipCancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
