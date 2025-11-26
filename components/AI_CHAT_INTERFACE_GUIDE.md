# AI Chat Interface Component Guide

## Overview

The `AIChatInterface` component provides a full-featured chat interface for the AI Nutrition Coach. It includes message bubbles with gradient styling, typing indicators, quick action buttons, premium upsell cards, and streaming response display.

## Features

✅ **Message List with Conversation History**
- Loads and displays previous conversations
- Auto-scrolls to latest messages
- Supports both user and AI messages

✅ **Gradient-Styled User Messages**
- Beautiful gradient backgrounds using primary color palette
- Rounded bubble design with proper alignment
- User avatar display

✅ **Glassmorphism AI Messages**
- Blur effect with semi-transparent background
- AI avatar with gradient icon
- Adapts to light/dark theme

✅ **Animated Typing Indicator**
- Three animated dots with gradient colors
- Smooth bounce animation
- Shows when AI is generating response

✅ **Voice Input Button**
- Microphone icon for voice input
- Ready for voice recognition integration
- Haptic feedback on press

✅ **Quick Action Buttons**
- Generate Meal Plan
- Check Allergen
- Nutrition Tips
- Each with unique gradient colors and icons

✅ **Premium Upsell Card**
- Appears after 3 messages for free users
- Glassmorphism design with gradient border
- Dismissible with "Maybe later" option
- Calls upgrade callback

✅ **Streaming Response Display**
- Character-by-character animation
- Real-time message updates
- Smooth scrolling during streaming

✅ **Usage Quota Tracking**
- Shows remaining messages for free users
- Integrates with SubscriptionService
- Blocks messages when quota exceeded

## Installation

The component is already created at `components/AIChatInterface.tsx` and ready to use.

### Dependencies

All required dependencies are already installed:
- `expo-linear-gradient` - For gradient effects
- `@expo/vector-icons` - For icons
- `expo-blur` - For glassmorphism effect
- `@react-native-async-storage/async-storage` - For caching

## Usage

### Basic Usage

```typescript
import { AIChatInterface } from '@/components/AIChatInterface';
import { Modal } from 'react-native';

function MyScreen() {
  const [showChat, setShowChat] = useState(false);
  const userId = 'user123'; // Get from auth context

  return (
    <>
      <Button title="Open Chat" onPress={() => setShowChat(true)} />
      
      <Modal visible={showChat} animationType="slide" presentationStyle="fullScreen">
        <AIChatInterface
          userId={userId}
          onClose={() => setShowChat(false)}
          onUpgradePress={() => {
            setShowChat(false);
            // Navigate to subscription screen
          }}
        />
      </Modal>
    </>
  );
}
```

### With Existing Conversation

```typescript
<AIChatInterface
  userId={userId}
  conversationId="conv_123" // Load existing conversation
  onClose={() => setShowChat(false)}
  onUpgradePress={handleUpgrade}
/>
```

### Full Example

See `components/AIChatExample.tsx` for a complete working example.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `userId` | `string` | Yes | The user's ID for loading context and saving conversations |
| `conversationId` | `string` | No | Optional conversation ID to load existing chat |
| `onClose` | `() => void` | Yes | Callback when user closes the chat |
| `onUpgradePress` | `() => void` | No | Callback when user taps upgrade button in upsell card |

## Component Structure

```
AIChatInterface
├── Header (Gradient)
│   ├── AI Avatar
│   ├── Title & Subtitle
│   └── Close Button
├── Messages List (FlatList)
│   ├── User Messages (Gradient Bubbles)
│   ├── AI Messages (Glassmorphism)
│   └── Typing Indicator
├── Upsell Card (Conditional)
│   ├── Lock Icon
│   ├── Title & Description
│   ├── Upgrade Button
│   └── Dismiss Button
├── Quick Actions
│   ├── Meal Plan Button
│   ├── Allergen Button
│   └── Tips Button
└── Input Area (Glassmorphism)
    ├── Text Input
    ├── Voice Button
    └── Send Button (Gradient)
```

## Styling

The component uses the design system colors and animations:

### Colors
- Primary gradient for user messages and send button
- Secondary gradient for AI avatar and typing indicator
- Warning gradient for allergen quick action
- Success gradient for tips quick action
- Adapts to light/dark theme automatically

### Animations
- Button press scale animation (0.95)
- Typing indicator bounce animation
- Smooth scroll animations
- Gradient shimmer effects

## Integration with Services

### AI Nutrition Coach Service

The component integrates with `AINutritionCoachService`:

```typescript
// Send message with streaming
const streamIterator = await AINutritionCoachService.sendMessage(
  userId,
  message,
  conversationId
);

// Stream response character by character
for await (const chunk of streamIterator) {
  // Update message content in real-time
}

// Load conversation history
const conversation = await AINutritionCoachService.getConversation(
  userId,
  conversationId
);
```

### Subscription Service

The component checks premium status and enforces quotas:

```typescript
// Check if user has premium access
const hasPremium = await subscriptionService.checkPremiumAccess(userId);

// Check if user can send message
const canUse = await subscriptionService.canUseFeature(userId, 'ai_coach');

// Increment usage for free users
await subscriptionService.incrementUsage(userId, 'ai');
```

## Customization

### Changing Quick Actions

Edit the `handleQuickAction` function to add or modify quick actions:

```typescript
const quickMessages = {
  meal_plan: 'Can you generate a personalized meal plan for me?',
  allergen: 'What foods should I avoid based on my allergens?',
  tips: 'Give me some nutrition tips for my health goal',
  // Add more actions here
};
```

### Modifying Upsell Behavior

Change when the upsell appears by modifying the effect:

```typescript
useEffect(() => {
  // Show after 3 messages (default)
  if (!isPremium && messageCount >= 3 && !showUpsell) {
    setShowUpsell(true);
  }
}, [messageCount, isPremium]);
```

### Styling Customization

Override styles by passing custom style props or modifying the StyleSheet:

```typescript
const styles = StyleSheet.create({
  // Modify any style here
  userBubble: {
    maxWidth: '70%', // Change bubble width
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20, // Change border radius
  },
});
```

## Accessibility

The component includes:
- Proper keyboard handling with `KeyboardAvoidingView`
- Haptic feedback for all interactions
- Theme-aware colors for readability
- Scrollable message list
- Clear visual hierarchy

## Performance Considerations

- Messages are rendered using `FlatList` for efficient scrolling
- Streaming responses update in real-time without re-rendering entire list
- Premium status is cached locally for offline support
- Conversation history is loaded once on mount

## Troubleshooting

### Messages not loading
- Ensure `userId` is valid
- Check Firebase Firestore permissions
- Verify conversation exists if `conversationId` is provided

### Streaming not working
- Check Firebase Vertex AI configuration
- Ensure `@firebase/ai` package is installed
- Verify API quotas in Firebase Console

### Upsell not appearing
- Check `isPremium` state
- Verify `messageCount` is incrementing
- Ensure `onUpgradePress` callback is provided

### Voice button not working
- Voice input functionality needs to be implemented
- Integrate with `expo-speech` or similar library
- Add speech-to-text service

## Next Steps

1. **Integrate into App Navigation**
   - Add AI Coach tab to bottom navigation
   - Create AI Coach screen with conversation list
   - Implement deep linking to specific conversations

2. **Add Voice Input**
   - Integrate speech recognition
   - Add waveform animation during recording
   - Support multiple languages

3. **Enhance Upsell**
   - Add more compelling copy
   - Show feature previews
   - A/B test different messaging

4. **Add Analytics**
   - Track message send events
   - Monitor upsell conversion rate
   - Measure engagement metrics

## Related Components

- `GradientButton` - Used for action buttons
- `GlassmorphismCard` - Used for message bubbles and input
- `AINutritionCoachService` - Backend service for AI
- `SubscriptionService` - Handles premium access and quotas

## Support

For issues or questions:
1. Check the design document at `.kiro/specs/ai-nutrition-coach-monetization/design.md`
2. Review the requirements at `.kiro/specs/ai-nutrition-coach-monetization/requirements.md`
3. See the implementation tasks at `.kiro/specs/ai-nutrition-coach-monetization/tasks.md`
