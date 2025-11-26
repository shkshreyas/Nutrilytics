# Design System Components

A comprehensive design system for Nutrilytics with futuristic, gradient-based UI components.

## Installation

Install the required dependency for GradientText:

```bash
npm install @react-native-masked-view/masked-view
```

## Components

### GradientButton

A button with gradient background and press animations.

```tsx
import { GradientButton } from '@/components/design-system';

<GradientButton
  title="Get Started"
  onPress={() => console.log('Pressed')}
  variant="primary"
  size="large"
  fullWidth
/>
```

**Props:**
- `title` (string): Button text
- `onPress` (function): Press handler
- `variant` ('primary' | 'secondary' | 'success' | 'warning' | 'danger'): Color scheme
- `size` ('small' | 'medium' | 'large'): Button size
- `disabled` (boolean): Disable button
- `loading` (boolean): Show loading spinner
- `fullWidth` (boolean): Expand to full width

### GradientCard

A card with gradient border or gradient background.

```tsx
import { GradientCard } from '@/components/design-system';

<GradientCard variant="primary" borderWidth={2}>
  <Text>Card content</Text>
</GradientCard>

// With gradient background
<GradientCard variant="secondary" gradientBackground>
  <Text style={{ color: 'white' }}>Card content</Text>
</GradientCard>
```

**Props:**
- `variant` ('primary' | 'secondary' | 'success' | 'warning' | 'danger'): Color scheme
- `borderWidth` (number): Width of gradient border
- `gradientBackground` (boolean): Use gradient as background instead of border
- `style` (ViewStyle): Additional container styles
- `contentStyle` (ViewStyle): Additional content styles

### GradientText

Text with gradient color effect.

```tsx
import { GradientText } from '@/components/design-system';

<GradientText variant="primary" style={{ fontSize: 32 }}>
  Welcome to Nutrilytics
</GradientText>
```

**Props:**
- `variant` ('primary' | 'secondary' | 'success' | 'warning' | 'danger'): Color scheme
- `style` (TextStyle): Text styles

**Note:** Requires `@react-native-masked-view/masked-view` package.

### GlassmorphismCard

A card with blur effect and semi-transparent background.

```tsx
import { GlassmorphismCard } from '@/components/design-system';

<GlassmorphismCard intensity={80}>
  <Text>Glassmorphism content</Text>
</GlassmorphismCard>
```

**Props:**
- `intensity` (number): Blur intensity (0-100)
- `style` (ViewStyle): Additional container styles
- `contentStyle` (ViewStyle): Additional content styles

### Loading Components

#### ShimmerLoader

Animated shimmer effect for skeleton screens.

```tsx
import { ShimmerLoader } from '@/components/design-system';

<ShimmerLoader width="100%" height={20} borderRadius={8} />
```

#### PulseLoader

Pulsing gradient circle loader.

```tsx
import { PulseLoader } from '@/components/design-system';

<PulseLoader size={60} variant="primary" />
```

#### SpinnerLoader

Spinning gradient loader.

```tsx
import { SpinnerLoader } from '@/components/design-system';

<SpinnerLoader size={40} variant="primary" />
```

## Theme Context

Manage light/dark mode across the app.

```tsx
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

// Wrap your app
<ThemeProvider>
  <App />
</ThemeProvider>

// Use in components
const { isDark, colors, toggleTheme, setMode } = useTheme();

<View style={{ backgroundColor: colors.background }}>
  <Text style={{ color: colors.textPrimary }}>Hello</Text>
</View>
```

## Haptic Feedback

Consistent haptic feedback utilities.

```tsx
import { hapticFeedback } from '@/utils/haptics';

// Light impact for button presses
hapticFeedback.light();

// Medium impact for confirmations
hapticFeedback.medium();

// Heavy impact for important actions
hapticFeedback.heavy();

// Success notification
hapticFeedback.success();

// Warning notification
hapticFeedback.warning();

// Error notification
hapticFeedback.error();

// Selection feedback
hapticFeedback.selection();
```

## Color Palette

Access gradient colors and theme colors.

```tsx
import { colorPalette, gradients } from '@/constants/colors';

// Use in styles
backgroundColor: colorPalette.primary.start

// Use with LinearGradient
<LinearGradient colors={gradients.primary}>
  ...
</LinearGradient>
```

## Animation Configuration

Consistent animation timings.

```tsx
import { animations, timingConfig, springConfig } from '@/constants/animations';

Animated.timing(value, {
  toValue: 1,
  duration: animations.fadeIn.duration,
  useNativeDriver: true,
}).start();

Animated.spring(value, {
  toValue: 1,
  ...springConfig.bouncy,
  useNativeDriver: true,
}).start();
```

## Best Practices

1. **Always use haptic feedback** for interactive elements
2. **Respect theme mode** by using `useTheme()` hook
3. **Use consistent animations** from the animation config
4. **Prefer gradient components** over plain colors for CTAs
5. **Use glassmorphism** for overlays and floating elements
6. **Use shimmer loaders** for skeleton screens
7. **Test in both light and dark modes**
