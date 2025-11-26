/**
 * TrialProgressBanner Component
 * Animated banner showing trial countdown timer, usage stats with progress bars,
 * dismissible with swipe down gesture, with Day 7 and Day 12 variants
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ChevronDown, AlertTriangle, Zap } from 'lucide-react-native';
import { gradients, colorPalette } from '@/constants/colors';
import { hapticFeedback } from '@/utils/haptics';

const { width } = Dimensions.get('window');

interface TrialProgressBannerProps {
  visible: boolean;
  daysRemaining: number;
  usageStats: {
    barcodeScans: { used: number; limit: number };
    photoScans: { used: number; limit: number };
    aiMessages: { used: number; limit: number };
  };
  onUpgradePress: () => void;
  onDismiss: () => void;
}

export const TrialProgressBanner: React.FC<TrialProgressBannerProps> = ({
  visible,
  daysRemaining,
  usageStats,
  onUpgradePress,
  onDismiss,
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, { dy }) => Math.abs(dy) > 10,
      onPanResponderMove: (evt, { dy }) => {
        if (dy < 0) {
          translateY.setValue(dy);
        }
      },
      onPanResponderRelease: (evt, { dy, vy }) => {
        if (dy < -50 || vy < -0.5) {
          // Swipe up to dismiss
          Animated.timing(translateY, {
            toValue: -200,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            onDismiss();
          });
        } else {
          // Snap back
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 10,
          }).start();
        }
      },
    })
  );

  const isDay12OrMore = daysRemaining <= 2;
  const isDay7OrLess = daysRemaining <= 7;

  // Calculate total usage percentage
  const totalUsagePercent = Math.round(
    ((usageStats.barcodeScans.used +
      usageStats.photoScans.used +
      usageStats.aiMessages.used) /
      (usageStats.barcodeScans.limit +
        usageStats.photoScans.limit +
        usageStats.aiMessages.limit)) *
      100
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          display: visible ? 'flex' : 'none',
        },
      ]}
      {...panResponder.current.panHandlers}
    >
      <LinearGradient
        colors={
          isDay12OrMore
            ? gradients.danger
            : isDay7OrLess
            ? gradients.warning
            : gradients.primary
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <BlurView intensity={85} tint="dark" style={styles.content}>
          {/* Header with Dismiss Indicator */}
          <View style={styles.header}>
            <View style={styles.dragIndicator}>
              <ChevronDown size={20} color="rgba(255, 255, 255, 0.5)" />
            </View>

            {/* Title and Days Info */}
            <View style={styles.titleSection}>
              {isDay12OrMore && (
                <View style={styles.urgentTag}>
                  <AlertTriangle size={14} color="#FFFFFF" />
                  <Text style={styles.urgentTagText}>Final Days!</Text>
                </View>
              )}

              <Text style={styles.bannerTitle}>
                {isDay12OrMore
                  ? 'Your Trial Ends Soon'
                  : 'Enjoy Your Free Trial'}
              </Text>
            </View>
          </View>

          {/* Countdown Timer Section */}
          <View style={styles.countdownSection}>
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownNumber}>{daysRemaining}</Text>
              <Text style={styles.countdownLabel}>
                {daysRemaining === 1 ? 'Day Left' : 'Days Left'}
              </Text>
            </View>

            {isDay12OrMore && (
              <View style={styles.warningIcon}>
                <Zap size={28} color={colorPalette.danger.start} />
              </View>
            )}

            <View style={styles.messageContainer}>
              <Text style={styles.message}>
                {isDay12OrMore
                  ? 'Premium access will end. Subscribe to continue enjoying unlimited features.'
                  : 'Continue exploring unlimited features. Subscribe to keep your access after trial ends.'}
              </Text>
            </View>
          </View>

          {/* Usage Stats Section */}
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <View style={styles.statLabel}>
                <Text style={styles.statName}>Barcode Scans</Text>
                <Text style={styles.statValue}>
                  {usageStats.barcodeScans.used}/{usageStats.barcodeScans.limit}
                </Text>
              </View>
              <ProgressBar
                used={usageStats.barcodeScans.used}
                limit={usageStats.barcodeScans.limit}
              />
            </View>

            <View style={styles.statItem}>
              <View style={styles.statLabel}>
                <Text style={styles.statName}>Photo Scans</Text>
                <Text style={styles.statValue}>
                  {usageStats.photoScans.used}/{usageStats.photoScans.limit}
                </Text>
              </View>
              <ProgressBar
                used={usageStats.photoScans.used}
                limit={usageStats.photoScans.limit}
              />
            </View>

            <View style={styles.statItem}>
              <View style={styles.statLabel}>
                <Text style={styles.statName}>AI Messages</Text>
                <Text style={styles.statValue}>
                  {usageStats.aiMessages.used}/{usageStats.aiMessages.limit}
                </Text>
              </View>
              <ProgressBar
                used={usageStats.aiMessages.used}
                limit={usageStats.aiMessages.limit}
              />
            </View>

            {/* Overall Usage Bar */}
            <View style={styles.overallStatItem}>
              <View style={styles.statLabel}>
                <Text style={styles.statName}>Overall Usage</Text>
                <Text style={styles.statValue}>{totalUsagePercent}%</Text>
              </View>
              <View style={styles.overallProgressBar}>
                <View
                  style={[
                    styles.overallProgressFill,
                    { width: `${totalUsagePercent}%` },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={[
              styles.upgradeButton,
              isDay12OrMore && styles.upgradeButtonUrgent,
            ]}
            onPress={() => {
              hapticFeedback.medium();
              onUpgradePress();
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                isDay12OrMore
                  ? gradients.danger
                  : isDay7OrLess
                  ? gradients.warning
                  : gradients.success
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.upgradeButtonGradient}
            >
              <Text style={styles.upgradeButtonText}>
                {isDay12OrMore ? 'Upgrade Now' : 'Upgrade to Premium'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Day-specific messaging */}
          {isDay7OrLess && !isDay12OrMore && (
            <View style={styles.valueHighlight}>
              <LinearGradient
                colors={gradients.success}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.valueHighlightGradient}
              >
                <Text style={styles.valueHighlightText}>
                  💡 Day 7: Bonus week offer - Save 50% on annual plan!
                </Text>
              </LinearGradient>
            </View>
          )}
        </BlurView>
      </LinearGradient>
    </Animated.View>
  );
};

/**
 * ProgressBar Component
 * Animated progress bar with gradient fill
 */
interface ProgressBarProps {
  used: number;
  limit: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ used, limit }) => {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const percent = Math.round((used / limit) * 100);

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: percent,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [used, limit]);

  const widthInterpolate = fillAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const colorInterpolate = fillAnim.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [
      colorPalette.success.start,
      colorPalette.warning.start,
      colorPalette.danger.start,
    ],
  });

  return (
    <View style={styles.progressBarContainer}>
      <Animated.View
        style={[
          styles.progressBarFill,
          {
            width: widthInterpolate,
            backgroundColor: colorInterpolate,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 8,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  content: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    marginBottom: 16,
  },
  dragIndicator: {
    alignItems: 'center',
    marginBottom: 8,
  },
  titleSection: {
    gap: 8,
  },
  urgentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  urgentTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  countdownSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  countdownContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 40,
  },
  countdownLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  warningIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContainer: {
    flex: 1,
  },
  message: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  statsSection: {
    gap: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    gap: 6,
  },
  overallStatItem: {
    gap: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
  },
  statLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statName: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  overallProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colorPalette.primary.start,
  },
  upgradeButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  upgradeButtonUrgent: {
    borderWidth: 2,
    borderColor: colorPalette.danger.start,
  },
  upgradeButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  valueHighlight: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  valueHighlightGradient: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  valueHighlightText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
