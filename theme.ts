// Vibrant, playful color palette and global style constants
export const Colors = {
  primary: '#10B981', // Green
  primaryDark: '#059669',
  accent: '#FBBF24', // Yellow
  warning: '#F97316', // Orange
  danger: '#DC2626', // Red
  safe: '#059669',
  info: '#3B82F6', // Blue
  background: '#F9FAFB',
  card: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  shadow: 'rgba(0,0,0,0.05)',
  gradient: ['#10B981', '#059669'] as const,
  gradientBlue: ['#3B82F6', '#1D4ED8'] as const,
  gold: '#FFD700',
  // New Premium Colors
  primaryNeon: '#00FF94',
  secondaryNeon: '#00E0FF',
  surfaceGlass: 'rgba(255, 255, 255, 0.7)',
  surfaceGlassDark: 'rgba(31, 41, 55, 0.7)',
  backgroundGradient: ['#F0FDF4', '#E0F2FE'] as const,
  premiumGradient: ['#FFD700', '#FFA500'] as const,
};

import { FlexAlignType, TextStyle, ViewStyle } from 'react-native';

export const GlobalStyles = {
  card: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    padding: 20,
    marginBottom: 16,
  } as ViewStyle,
  glassCard: {
    backgroundColor: Colors.surfaceGlass,
    borderRadius: 24,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    overflow: 'hidden',
  } as ViewStyle,
  roundedButton: {
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center' as FlexAlignType,
    justifyContent: 'center' as FlexAlignType,
  } as ViewStyle,
  sectionTitle: {
    fontSize: 22,
    fontWeight: 700 as TextStyle['fontWeight'],
    color: Colors.text,
    marginBottom: 16,
    letterSpacing: -0.5,
  } as TextStyle,
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center' as FlexAlignType,
    justifyContent: 'center' as FlexAlignType,
    backgroundColor: Colors.background,
    marginBottom: 12,
  } as ViewStyle,
};