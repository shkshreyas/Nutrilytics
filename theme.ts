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
};

import { FlexAlignType, TextStyle, ViewStyle } from 'react-native';

export const GlobalStyles = {
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    padding: 16,
    marginBottom: 16,
  } as ViewStyle,
  roundedButton: {
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center' as FlexAlignType,
    justifyContent: 'center' as FlexAlignType,
  } as ViewStyle,
  sectionTitle: {
    fontSize: 20,
    fontWeight: 700 as TextStyle['fontWeight'],
    color: Colors.text,
    marginBottom: 12,
  } as TextStyle,
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center' as FlexAlignType,
    justifyContent: 'center' as FlexAlignType,
    backgroundColor: Colors.background,
    marginBottom: 8,
  } as ViewStyle,
}; 