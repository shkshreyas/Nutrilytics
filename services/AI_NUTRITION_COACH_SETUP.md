# AI Nutrition Coach Service - Setup Guide

## Overview

The AI Nutrition Coach Service provides personalized nutrition guidance using Firebase Vertex AI (Gemini 1.5 Flash). This service includes:

- **Streaming responses** for real-time user feedback
- **Multi-language support** (English, Hindi, Tamil, Telugu, Bengali, Marathi)
- **User context awareness** (allergens, health goals, dietary preferences)
- **Conversation history** management
- **Automatic retry logic** with fallback responses
- **Error handling** with user-friendly messages

## Firebase Console Configuration

### Step 1: Enable Vertex AI in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `nutrilytics-18a2b`
3. Navigate to **Build** → **Vertex AI in Firebase**
4. Click **Get Started** or **Enable**
5. Accept the terms of service
6. Wait for the service to be enabled (may take a few minutes)

### Step 2: Enable Gemini API

1. In the Vertex AI section, click **Enable Gemini API**
2. This will redirect you to Google Cloud Console
3. Enable the **Generative Language API**
4. Return to Firebase Console

### Step 3: Configure Billing (Required for Production)

⚠️ **Important**: Vertex AI requires a billing account, but offers a generous free tier:

**Free Tier Limits (Gemini 1.5 Flash):**
- 1,500 requests per day
- 1 million tokens per month

**To set up billing:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **Billing** → **Link a billing account**
4. Create or link an existing billing account
5. Set up budget alerts to avoid unexpected charges

**Recommended Budget Alerts:**
- Alert at 50% of budget: $5
- Alert at 90% of budget: $9
- Alert at 100% of budget: $10

### Step 4: Set Up Firestore Security Rules

Add these rules to allow AI conversation storage:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User conversations
    match /users/{userId}/conversations/{conversationId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // User data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // User scans subcollection
      match /scans/{scanId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### Step 5: Test the Configuration

Run this test in your app to verify the setup:

```typescript
import { AINutritionCoachService } from './services/aiNutritionCoachService';

async function testAIService() {
  try {
    const userId = 'test-user-id'; // Replace with actual user ID
    const message = 'What are some healthy breakfast options?';
    
    const streamIterator = await AINutritionCoachService.sendMessage(
      userId,
      message
    );
    
    console.log('AI Response:');
    for await (const chunk of streamIterator) {
      process.stdout.write(chunk);
    }
    console.log('\n✅ AI Service is working correctly!');
  } catch (error) {
    console.error('❌ AI Service test failed:', error);
  }
}
```

## Usage Examples

### Basic Chat Message

```typescript
import { AINutritionCoachService } from './services/aiNutritionCoachService';

// Send a message and stream the response
const streamIterator = await AINutritionCoachService.sendMessage(
  userId,
  'What foods should I avoid with a peanut allergy?'
);

// Display streaming response
for await (const chunk of streamIterator) {
  console.log(chunk); // Display each chunk as it arrives
}
```

### Continue Existing Conversation

```typescript
// Continue a conversation by providing conversationId
const streamIterator = await AINutritionCoachService.sendMessage(
  userId,
  'Can you suggest some alternatives?',
  conversationId // Pass existing conversation ID
);
```

### Get Conversation History

```typescript
// Get all conversations for a user
const conversations = await AINutritionCoachService.getConversations(userId);

conversations.forEach(conv => {
  console.log(`Conversation: ${conv.title}`);
  console.log(`Messages: ${conv.messages.length}`);
  console.log(`Last updated: ${conv.updatedAt}`);
});
```

### Get Specific Conversation

```typescript
// Get a specific conversation
const conversation = await AINutritionCoachService.getConversation(
  userId,
  conversationId
);

if (conversation) {
  conversation.messages.forEach(msg => {
    console.log(`${msg.role}: ${msg.content}`);
  });
}
```

### Delete Conversation

```typescript
// Delete a conversation (soft delete)
await AINutritionCoachService.deleteConversation(userId, conversationId);
```

## Features

### 1. User Context Awareness

The service automatically loads and uses:
- **Allergens**: Warns users about foods containing their allergens
- **Health Goals**: Tailors advice for weight loss, muscle gain, or maintenance
- **Dietary Preferences**: Respects vegetarian, vegan, etc.
- **Recent Foods**: Provides context-aware recommendations
- **Language**: Responds in user's preferred language

### 2. Multi-Language Support

Automatically detects and responds in:
- English (en)
- Hindi (hi) - हिंदी
- Tamil (ta) - தமிழ்
- Telugu (te) - తెలుగు
- Bengali (bn) - বাংলা
- Marathi (mr) - मराठी

### 3. Streaming Responses

Provides real-time feedback as the AI generates responses:
- Better user experience
- Perceived faster response time
- Can display typing indicators

### 4. Error Handling

Robust error handling with:
- **Automatic retries**: Up to 3 attempts with exponential backoff
- **Timeout protection**: 10-second timeout per request
- **Fallback responses**: User-friendly messages in their language
- **Graceful degradation**: Service continues even if AI fails

### 5. Conversation Management

- **Automatic saving**: Conversations saved to Firestore
- **History limit**: Last 10 messages used for context
- **Title generation**: Automatic titles from first message
- **Soft delete**: Conversations marked as deleted, not removed

## Data Structure

### Firestore Schema

```
/users/{userId}
  - allergens: string[]
  - healthGoal: 'weight_loss' | 'muscle_gain' | 'maintenance'
  - dietaryPreferences: string[]
  - language: string
  - name: string
  
  /conversations/{conversationId}
    - messages: array<{
        id: string,
        role: 'user' | 'assistant',
        content: string,
        timestamp: timestamp
      }>
    - createdAt: timestamp
    - updatedAt: timestamp
    - title: string
    - deleted: boolean (optional)
    - deletedAt: timestamp (optional)
  
  /scans/{scanId}
    - foodName: string
    - scanDate: timestamp
    - ... (other scan data)
```

## Cost Management

### Free Tier Strategy

To stay within the free tier (1,500 requests/day):

1. **Limit free users**: 3 AI messages per day
2. **Limit premium users**: 50 AI messages per day
3. **Cache common responses**: Store frequently asked questions
4. **Optimize context**: Use only last 10 messages for context
5. **Monitor usage**: Set up Firebase Analytics to track requests

### Monitoring Usage

Add this to your Firebase Console:

1. Go to **Vertex AI** → **Usage**
2. Set up alerts for:
   - Daily request count approaching 1,500
   - Monthly token count approaching 1M
3. Review usage weekly

### Cost Optimization Tips

1. **Use Gemini 1.5 Flash** (not Pro) - it's faster and cheaper
2. **Limit response length** - max 1,000 tokens (500 words)
3. **Reduce context window** - only last 10 messages
4. **Implement caching** - cache common nutrition questions
5. **Rate limiting** - prevent abuse with daily limits

## Troubleshooting

### Error: "Vertex AI not enabled"

**Solution**: Enable Vertex AI in Firebase Console (see Step 1 above)

### Error: "Billing account required"

**Solution**: Link a billing account in Google Cloud Console (see Step 3 above)

### Error: "Permission denied"

**Solution**: Check Firestore security rules (see Step 4 above)

### Error: "Request timeout"

**Possible causes**:
- Poor network connection
- Firebase service issues
- Request too complex

**Solution**: The service automatically retries and provides fallback response

### Error: "Resource exhausted"

**Cause**: Exceeded free tier quota (1,500 requests/day)

**Solution**:
- Wait until quota resets (midnight UTC)
- Upgrade to paid tier
- Implement stricter rate limiting

## Security Considerations

### API Key Protection

✅ **Good**: API keys in environment variables
❌ **Bad**: API keys in source code

The current setup uses environment variables (`.env` file), which is correct.

### User Data Privacy

- All conversations are stored per-user
- Firestore rules ensure users can only access their own data
- Allergen information is never shared between users
- Consider implementing data retention policies (e.g., delete conversations after 90 days)

### Content Filtering

The AI is instructed to:
- Provide safe, accurate nutrition advice
- Never recommend foods containing user allergens
- Suggest consulting healthcare professionals when appropriate
- Avoid medical diagnoses or treatment recommendations

## Next Steps

After completing this setup:

1. ✅ Test the AI service with a sample user
2. ✅ Verify conversations are saved to Firestore
3. ✅ Test multi-language support
4. ✅ Set up usage monitoring and alerts
5. ✅ Implement rate limiting for free users
6. ✅ Create UI components for chat interface (Task 7)
7. ✅ Integrate with subscription service (Task 3)

## Support

For issues or questions:
- Check Firebase Console logs
- Review Firestore security rules
- Verify billing account is active
- Check API quotas and limits

## References

- [Firebase Vertex AI Documentation](https://firebase.google.com/docs/vertex-ai)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Google Cloud Billing](https://cloud.google.com/billing/docs)
