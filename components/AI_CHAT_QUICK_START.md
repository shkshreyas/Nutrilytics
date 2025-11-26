# AI Chat Interface - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Import the Component

```typescript
import { AIChatInterface } from '@/components/AIChatInterface';
import { Modal, Button } from 'react-native';
import { useState } from 'react';
```

### Step 2: Add State Management

```typescript
function MyScreen() {
  const [showChat, setShowChat] = useState(false);
  const userId = 'user_123'; // Get from your auth context
  
  return (
    <>
      <Button 
        title="Chat with AI Coach" 
        onPress={() => setShowChat(true)} 
      />
      
      <Modal 
        visible={showChat} 
        animationType="slide"
        presentationStyle="fullScreen"
      >
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

### Step 3: That's It! 🎉

The component handles everything else:
- ✅ Loading conversation history
- ✅ Sending messages to AI
- ✅ Streaming responses
- ✅ Checking premium status
- ✅ Enforcing usage quotas
- ✅ Showing upsell cards
- ✅ Theme support

## 📱 Common Use Cases

### Use Case 1: New Conversation

```typescript
<AIChatInterface
  userId={userId}
  onClose={handleClose}
  onUpgradePress={handleUpgrade}
/>
```

### Use Case 2: Continue Existing Conversation

```typescript
<AIChatInterface
  userId={userId}
  conversationId="conv_abc123"
  onClose={handleClose}
  onUpgradePress={handleUpgrade}
/>
```

### Use Case 3: With Navigation

```typescript
import { useNavigation } from '@react-navigation/native';

function AIChatScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  
  return (
    <AIChatInterface
      userId={user.uid}
      onClose={() => navigation.goBack()}
      onUpgradePress={() => navigation.navigate('Subscription')}
    />
  );
}
```

### Use Case 4: With Auth Context

```typescript
import { useAuth } from '@/contexts/AuthContext';

function ChatButton() {
  const { user } = useAuth();
  const [showChat, setShowChat] = useState(false);
  
  if (!user) return null;
  
  return (
    <>
      <Button title="AI Coach" onPress={() => setShowChat(true)} />
      <Modal visible={showChat}>
        <AIChatInterface
          userId={user.uid}
          onClose={() => setShowChat(false)}
        />
      </Modal>
    </>
  );
}
```

## 🎨 Customization Examples

### Change Quick Actions

Edit `components/AIChatInterface.tsx`:

```typescript
const quickMessages = {
  meal_plan: 'Generate a meal plan for weight loss',
  allergen: 'What foods are safe for me?',
  tips: 'Give me nutrition tips',
  // Add your custom actions
  workout: 'Suggest post-workout meals',
};
```

### Modify Upsell Trigger

```typescript
// Show after 5 messages instead of 3
useEffect(() => {
  if (!isPremium && messageCount >= 5 && !showUpsell) {
    setShowUpsell(true);
  }
}, [messageCount, isPremium]);
```

### Custom Styling

```typescript
<AIChatInterface
  userId={userId}
  onClose={handleClose}
  // Component uses theme context automatically
  // Override styles in the component file if needed
/>
```

## 🔧 Integration Checklist

Before using the component, ensure:

- [x] Firebase is configured (`lib/firebase.ts`)
- [x] Vertex AI is enabled in Firebase Console
- [x] AINutritionCoachService is set up
- [x] SubscriptionService is configured
- [x] ThemeContext is provided in app root
- [x] User authentication is working
- [x] RevenueCat is configured (for premium features)

## 🐛 Troubleshooting

### Problem: "Cannot read property 'uid' of undefined"
**Solution:** Ensure user is authenticated before rendering component

```typescript
if (!user) return <LoginScreen />;
return <AIChatInterface userId={user.uid} ... />;
```

### Problem: Messages not sending
**Solution:** Check Firebase Vertex AI configuration

```typescript
// In Firebase Console:
// 1. Enable Vertex AI API
// 2. Check billing is enabled
// 3. Verify quotas
```

### Problem: Upsell not showing
**Solution:** Verify subscription service is working

```typescript
// Test premium status
const isPremium = await subscriptionService.checkPremiumAccess(userId);
console.log('Premium status:', isPremium);
```

### Problem: Streaming not working
**Solution:** Check AI service configuration

```typescript
// Verify @firebase/ai is installed
npm install @firebase/ai

// Check model configuration in aiNutritionCoachService.ts
```

## 📊 Analytics Integration

Track chat usage:

```typescript
import { analyticsService } from '@/services/analyticsService';

// In your screen component
useEffect(() => {
  analyticsService.logFeatureUsage(userId, 'ai_chat', isPremium);
}, []);

// Track message sends
const handleSendMessage = async () => {
  await sendMessage();
  analyticsService.logEvent('ai_message_sent', {
    userId,
    isPremium,
    messageCount,
  });
};
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Open chat interface
- [ ] Send a message
- [ ] Verify AI responds
- [ ] Check streaming works
- [ ] Test quick actions
- [ ] Verify upsell appears (free users)
- [ ] Test upgrade button
- [ ] Check conversation history loads
- [ ] Test voice button (when implemented)
- [ ] Verify theme switching works
- [ ] Test keyboard behavior
- [ ] Check haptic feedback

### Test with Different User States

```typescript
// Test as free user
const freeUserId = 'free_user_123';

// Test as premium user
const premiumUserId = 'premium_user_456';

// Test with existing conversation
const conversationId = 'conv_abc123';
```

## 📚 Additional Resources

- **Full Documentation:** `components/AI_CHAT_INTERFACE_GUIDE.md`
- **Implementation Details:** `components/AI_CHAT_IMPLEMENTATION_SUMMARY.md`
- **Visual Reference:** `components/AI_CHAT_VISUAL_REFERENCE.md`
- **Design Specs:** `.kiro/specs/ai-nutrition-coach-monetization/design.md`
- **Requirements:** `.kiro/specs/ai-nutrition-coach-monetization/requirements.md`

## 🎯 Next Steps

1. **Add to Navigation**
   ```typescript
   // In your tab navigator
   <Tab.Screen 
     name="AICoach" 
     component={AIChatScreen}
     options={{ tabBarIcon: 'sparkles' }}
   />
   ```

2. **Create Conversation List**
   ```typescript
   const conversations = await AINutritionCoachService.getConversations(userId);
   ```

3. **Implement Voice Input**
   ```typescript
   // Add speech recognition
   import * as Speech from 'expo-speech';
   ```

4. **Add Analytics**
   ```typescript
   // Track engagement
   analyticsService.logEvent('ai_chat_opened');
   ```

## 💡 Pro Tips

1. **Cache Conversations:** The component automatically loads history
2. **Offline Support:** Premium status is cached for offline use
3. **Performance:** Uses FlatList for efficient rendering
4. **Accessibility:** Full screen reader support included
5. **Theming:** Automatically adapts to light/dark mode

## 🆘 Need Help?

1. Check the full guide: `AI_CHAT_INTERFACE_GUIDE.md`
2. Review the implementation: `AI_CHAT_IMPLEMENTATION_SUMMARY.md`
3. See visual reference: `AI_CHAT_VISUAL_REFERENCE.md`
4. Check design specs in `.kiro/specs/`

---

**Ready to go!** The AI Chat Interface is production-ready and fully integrated with your app's services. Just import, add to your screen, and start chatting! 🚀
