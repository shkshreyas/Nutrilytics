# Firebase Console Setup Checklist

## 🔥 Firebase Console Configuration for AI Nutrition Coach

Complete these steps in order to enable the AI Nutrition Coach Service.

---

## Step 1: Enable Vertex AI ⚡

**Time Required:** 2-3 minutes

- [ ] Go to [Firebase Console](https://console.firebase.google.com/)
- [ ] Select project: **nutrilytics-18a2b**
- [ ] Click **Build** in left sidebar
- [ ] Click **Vertex AI in Firebase**
- [ ] Click **Get Started** button
- [ ] Accept the terms of service
- [ ] Wait for "Vertex AI enabled" confirmation
- [ ] Verify you see "Gemini 1.5 Flash" in available models

**Troubleshooting:**
- If you don't see Vertex AI option, ensure you're using a Firebase project (not just Google Cloud)
- If "Get Started" is disabled, check that you're the project owner

---

## Step 2: Link Billing Account 💳

**Time Required:** 3-5 minutes

⚠️ **Required even for free tier usage**

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Select project: **nutrilytics-18a2b**
- [ ] Click **Billing** in left sidebar
- [ ] Click **Link a billing account**
- [ ] Choose existing billing account OR create new one
- [ ] Confirm billing account is linked
- [ ] Set up budget alerts:
  - [ ] Alert at 50% of $10 budget
  - [ ] Alert at 90% of $10 budget
  - [ ] Alert at 100% of $10 budget

**Free Tier Limits:**
- ✅ 1,500 requests per day
- ✅ 1 million tokens per month
- ✅ Perfect for development and small production

**Note:** You won't be charged unless you exceed free tier limits.

---

## Step 3: Update Firestore Security Rules 🔒

**Time Required:** 2 minutes

- [ ] Go to [Firebase Console](https://console.firebase.google.com/)
- [ ] Select project: **nutrilytics-18a2b**
- [ ] Click **Firestore Database** in left sidebar
- [ ] Click **Rules** tab
- [ ] Add the following rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // User conversations (AI Chat)
      match /conversations/{conversationId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // User scans
      match /scans/{scanId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // User subscription data
      match /subscription/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // User usage data
      match /usage/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // User meal plans
      match /mealPlans/{planId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

- [ ] Click **Publish** button
- [ ] Confirm rules are published successfully

---

## Step 4: Test the Configuration ✅

**Time Required:** 5 minutes

### Option A: Quick Test (Recommended)

Run this in your app:

```typescript
import { AINutritionCoachService } from './services/aiNutritionCoachService';

async function testAIService() {
  const userId = 'YOUR_TEST_USER_ID'; // Replace with actual user ID
  
  try {
    console.log('Testing AI Nutrition Coach...');
    
    const stream = await AINutritionCoachService.sendMessage(
      userId,
      'What should I eat for breakfast?'
    );
    
    console.log('AI Response:');
    for await (const chunk of stream) {
      process.stdout.write(chunk);
    }
    
    console.log('\n✅ AI Service is working!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAIService();
```

### Option B: Manual Test in Firebase Console

- [ ] Go to Firebase Console → Vertex AI
- [ ] Click **Try it out** or **Playground**
- [ ] Enter test prompt: "What are healthy breakfast options?"
- [ ] Verify you get a response
- [ ] Check that response is relevant and coherent

### Verify Test Results

- [ ] AI responds within 5 seconds
- [ ] Response is relevant to the question
- [ ] No error messages appear
- [ ] Conversation is saved to Firestore (check Firestore Database)

---

## Step 5: Set Up Monitoring 📊

**Time Required:** 3 minutes

- [ ] Go to Firebase Console → Vertex AI → **Usage**
- [ ] Note current usage: _____ requests today
- [ ] Set up email alerts:
  - [ ] Alert when 75% of daily quota used (1,125 requests)
  - [ ] Alert when 90% of daily quota used (1,350 requests)
  - [ ] Alert when 100% of daily quota used (1,500 requests)
- [ ] Bookmark the Usage page for regular monitoring

**Recommended Monitoring Schedule:**
- Daily: Check usage during development
- Weekly: Review usage patterns in production
- Monthly: Analyze costs and optimize if needed

---

## Step 6: Configure Analytics (Optional) 📈

**Time Required:** 2 minutes

- [ ] Go to Firebase Console → Analytics
- [ ] Verify Analytics is enabled
- [ ] Note your Measurement ID: `G-D41SYR2W13`
- [ ] Custom events will be tracked automatically

**Events to Monitor:**
- `ai_message_sent` - User sends message to AI
- `ai_response_received` - AI responds successfully
- `ai_error` - AI encounters an error
- `conversation_created` - New conversation started
- `conversation_deleted` - Conversation deleted

---

## Verification Checklist ✓

Before proceeding, verify all of the following:

- [ ] ✅ Vertex AI is enabled in Firebase Console
- [ ] ✅ Billing account is linked (even for free tier)
- [ ] ✅ Budget alerts are configured
- [ ] ✅ Firestore security rules are updated
- [ ] ✅ Test message sent successfully
- [ ] ✅ AI response received within 5 seconds
- [ ] ✅ Conversation saved to Firestore
- [ ] ✅ Usage monitoring is set up
- [ ] ✅ No error messages in console

---

## Common Issues & Solutions 🔧

### Issue: "Vertex AI not enabled"
**Solution:** Complete Step 1 above

### Issue: "Billing account required"
**Solution:** Complete Step 2 above

### Issue: "Permission denied" when saving conversation
**Solution:** Complete Step 3 above (Firestore rules)

### Issue: "Request timeout"
**Possible Causes:**
- Poor network connection
- Firebase service issues
- Request too complex

**Solution:** The service automatically retries. If persistent, check Firebase status page.

### Issue: "Resource exhausted"
**Cause:** Exceeded free tier quota (1,500 requests/day)

**Solutions:**
- Wait until quota resets (midnight UTC)
- Upgrade to paid tier
- Implement stricter rate limiting

### Issue: Response is in wrong language
**Solution:** 
- Check user's language setting in Firestore
- Verify language detection is working
- User can set preferred language in app settings

---

## Next Steps 🚀

After completing this checklist:

1. ✅ Test the AI service with multiple users
2. ✅ Verify multi-language support (Hindi, Tamil, etc.)
3. ✅ Monitor usage for first week
4. ✅ Implement rate limiting for free users (Task 3)
5. ✅ Build chat UI components (Task 7)
6. ✅ Add analytics tracking (Task 5)

---

## Support & Resources 📚

**Documentation:**
- Setup Guide: `services/AI_NUTRITION_COACH_SETUP.md`
- Quick Start: `services/AI_COACH_QUICK_START.md`
- Implementation Summary: `services/TASK_1_IMPLEMENTATION_SUMMARY.md`

**Firebase Resources:**
- [Vertex AI Documentation](https://firebase.google.com/docs/vertex-ai)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

**Need Help?**
- Check Firebase Console logs
- Review Firestore security rules
- Verify billing account is active
- Check API quotas and limits

---

## Completion Sign-Off ✍️

- [ ] All steps completed
- [ ] All verifications passed
- [ ] Test successful
- [ ] Ready to proceed to Task 2

**Completed by:** ___________________  
**Date:** ___________________  
**Notes:** ___________________

---

**🎉 Congratulations!** Your AI Nutrition Coach Service is now fully configured and ready to use!
