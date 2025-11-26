import { getVertexAI, getGenerativeModel } from '@firebase/ai';
import { app, firestore } from '../lib/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    orderBy,
    limit,
    Timestamp,
    addDoc,
} from 'firebase/firestore';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface Conversation {
    id: string;
    userId: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
    title?: string;
}

export interface UserContext {
    allergens: string[];
    healthGoal: 'weight_loss' | 'muscle_gain' | 'maintenance' | null;
    dietaryPreferences: string[];
    recentFoods: string[];
    language: string;
    name?: string;
}

export interface StreamChunk {
    text: string;
    isComplete: boolean;
}

// ============================================================================
// Language Detection and Support
// ============================================================================

const SUPPORTED_LANGUAGES = {
    en: 'English',
    hi: 'Hindi',
    ta: 'Tamil',
    te: 'Telugu',
    bn: 'Bengali',
    mr: 'Marathi',
};

const LANGUAGE_PATTERNS = {
    hi: /[\u0900-\u097F]/,
    ta: /[\u0B80-\u0BFF]/,
    te: /[\u0C00-\u0C7F]/,
    bn: /[\u0980-\u09FF]/,
    mr: /[\u0900-\u097F]/,
};

function detectLanguage(text: string): string {
    for (const [code, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
        if (pattern.test(text)) {
            return code;
        }
    }
    return 'en';
}

// ============================================================================
// AI Nutrition Coach Service
// ============================================================================

export class AINutritionCoachService {
    private static vertexAI = getVertexAI(app);
    private static model = getGenerativeModel(AINutritionCoachService.vertexAI, {
        model: 'gemini-1.5-flash',
    });

    private static readonly MAX_RETRIES = 3;
    private static readonly RETRY_DELAY = 1000; // ms
    private static readonly TIMEOUT = 10000; // 10 seconds
    private static readonly MAX_CONTEXT_MESSAGES = 10;

    // ============================================================================
    // Public Methods
    // ============================================================================

    /**
     * Send a message to the AI Nutrition Coach with streaming response
     */
    static async sendMessage(
        userId: string,
        message: string,
        conversationId?: string
    ): Promise<AsyncIterableIterator<string>> {
        try {
            // Load user context for personalization
            const userContext = await this.loadUserContext(userId);

            // Detect language from user message
            const detectedLanguage = detectLanguage(message);
            const responseLanguage = userContext.language || detectedLanguage;

            // Load conversation history if conversationId provided
            let conversationHistory: Message[] = [];
            if (conversationId) {
                const conversation = await this.getConversation(userId, conversationId);
                if (conversation) {
                    conversationHistory = conversation.messages.slice(-this.MAX_CONTEXT_MESSAGES);
                }
            }

            // Build system prompt with user context
            const systemPrompt = this.buildSystemPrompt(userContext, responseLanguage);

            // Build conversation context
            const contextMessages = this.buildContextMessages(conversationHistory, systemPrompt);

            // Create user message
            const userMessage: Message = {
                id: this.generateMessageId(),
                role: 'user',
                content: message,
                timestamp: new Date(),
            };

            // Add user message to history
            conversationHistory.push(userMessage);

            // Generate streaming response with retry logic
            const streamIterator = await this.generateStreamingResponse(
                contextMessages,
                message,
                userContext
            );

            // Collect response for saving
            let fullResponse = '';
            const wrappedIterator = this.wrapStreamIterator(
                streamIterator,
                async (chunk: string) => {
                    fullResponse += chunk;
                }
            );

            // Save conversation after streaming completes
            this.saveConversationAfterStream(
                userId,
                conversationId,
                conversationHistory,
                fullResponse
            );

            return wrappedIterator;
        } catch (error) {
            console.error('Error sending message to AI coach:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Get all conversations for a user
     */
    static async getConversations(userId: string): Promise<Conversation[]> {
        try {
            const conversationsRef = collection(firestore, 'users', userId, 'conversations');
            const q = query(conversationsRef, orderBy('updatedAt', 'desc'), limit(20));
            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    userId,
                    messages: data.messages.map((msg: any) => ({
                        ...msg,
                        timestamp: msg.timestamp?.toDate() || new Date(),
                    })),
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                    title: data.title,
                };
            });
        } catch (error) {
            console.error('Error fetching conversations:', error);
            return [];
        }
    }

    /**
     * Get a specific conversation
     */
    static async getConversation(
        userId: string,
        conversationId: string
    ): Promise<Conversation | null> {
        try {
            const conversationRef = doc(firestore, 'users', userId, 'conversations', conversationId);
            const conversationDoc = await getDoc(conversationRef);

            if (!conversationDoc.exists()) {
                return null;
            }

            const data = conversationDoc.data();
            return {
                id: conversationDoc.id,
                userId,
                messages: data.messages.map((msg: any) => ({
                    ...msg,
                    timestamp: msg.timestamp?.toDate() || new Date(),
                })),
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
                title: data.title,
            };
        } catch (error) {
            console.error('Error fetching conversation:', error);
            return null;
        }
    }

    /**
     * Delete a conversation
     */
    static async deleteConversation(userId: string, conversationId: string): Promise<void> {
        try {
            const conversationRef = doc(firestore, 'users', userId, 'conversations', conversationId);
            await updateDoc(conversationRef, {
                deleted: true,
                deletedAt: Timestamp.now(),
            });
        } catch (error) {
            console.error('Error deleting conversation:', error);
            throw error;
        }
    }

    // ============================================================================
    // Private Methods - User Context
    // ============================================================================

    /**
     * Load user context for personalization
     */
    private static async loadUserContext(userId: string): Promise<UserContext> {
        try {
            const userDoc = await getDoc(doc(firestore, 'users', userId));

            if (!userDoc.exists()) {
                return this.getDefaultUserContext();
            }

            const userData = userDoc.data();

            // Load recent food history
            const recentFoods = await this.loadRecentFoods(userId);

            return {
                allergens: userData.allergens || [],
                healthGoal: userData.healthGoal || null,
                dietaryPreferences: userData.dietaryPreferences || [],
                recentFoods,
                language: userData.language || 'en',
                name: userData.name,
            };
        } catch (error) {
            console.error('Error loading user context:', error);
            return this.getDefaultUserContext();
        }
    }

    /**
     * Load recent food scans for context
     */
    private static async loadRecentFoods(userId: string): Promise<string[]> {
        try {
            const scansRef = collection(firestore, 'users', userId, 'scans');
            const q = query(scansRef, orderBy('scanDate', 'desc'), limit(10));
            const querySnapshot = await getDocs(q);

            return querySnapshot.docs
                .map((doc) => doc.data().foodName)
                .filter((name) => name && name !== 'Unknown Food Item');
        } catch (error) {
            console.error('Error loading recent foods:', error);
            return [];
        }
    }

    /**
     * Get default user context
     */
    private static getDefaultUserContext(): UserContext {
        return {
            allergens: [],
            healthGoal: null,
            dietaryPreferences: [],
            recentFoods: [],
            language: 'en',
        };
    }

    // ============================================================================
    // Private Methods - Prompt Building
    // ============================================================================

    /**
     * Build system prompt with user context
     */
    private static buildSystemPrompt(userContext: UserContext, language: string): string {
        const languageName = SUPPORTED_LANGUAGES[language as keyof typeof SUPPORTED_LANGUAGES] || 'English';

        let prompt = `You are an expert AI Nutrition Coach for Nutrilytics, a nutrition and allergen detection app. Your role is to provide personalized, accurate, and helpful nutrition guidance.

IMPORTANT INSTRUCTIONS:
- Respond in ${languageName} language
- Keep responses concise (under 500 words)
- Be friendly, supportive, and encouraging
- Provide actionable advice
- Always prioritize user safety regarding allergens
- If unsure, recommend consulting a healthcare professional
`;

        // Add user-specific context
        if (userContext.name) {
            prompt += `\nUser's name: ${userContext.name}`;
        }

        if (userContext.allergens.length > 0) {
            prompt += `\n\nUSER ALLERGENS (CRITICAL - NEVER RECOMMEND THESE):
${userContext.allergens.map((a) => `- ${a}`).join('\n')}

ALWAYS check that any food recommendations exclude these allergens. If a user asks about a food containing their allergens, warn them clearly.`;
        }

        if (userContext.healthGoal) {
            const goalDescriptions = {
                weight_loss: 'Weight Loss - Focus on calorie deficit, high protein, moderate carbs',
                muscle_gain: 'Muscle Gain - Focus on calorie surplus, high protein, adequate carbs',
                maintenance: 'Maintenance - Focus on balanced nutrition, maintaining current weight',
            };
            prompt += `\n\nUser's Health Goal: ${goalDescriptions[userContext.healthGoal]}`;
        }

        if (userContext.dietaryPreferences.length > 0) {
            prompt += `\n\nUser's Dietary Preferences: ${userContext.dietaryPreferences.join(', ')}`;
        }

        if (userContext.recentFoods.length > 0) {
            prompt += `\n\nUser's Recent Foods (for context): ${userContext.recentFoods.slice(0, 5).join(', ')}`;
        }

        return prompt;
    }

    /**
     * Build context messages for the AI model
     */
    private static buildContextMessages(
        conversationHistory: Message[],
        systemPrompt: string
    ): any[] {
        const messages = [
            {
                role: 'user',
                parts: [{ text: systemPrompt }],
            },
            {
                role: 'model',
                parts: [{ text: 'I understand. I will provide personalized nutrition guidance following all the instructions, especially regarding allergen safety and language preferences.' }],
            },
        ];

        // Add conversation history
        for (const msg of conversationHistory) {
            messages.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            });
        }

        return messages;
    }

    // ============================================================================
    // Private Methods - AI Generation
    // ============================================================================

    /**
     * Generate streaming response with retry logic
     */
    private static async generateStreamingResponse(
        contextMessages: any[],
        userMessage: string,
        userContext: UserContext,
        retryCount = 0
    ): Promise<AsyncIterableIterator<string>> {
        try {
            const chat = this.model.startChat({
                history: contextMessages.slice(0, -1), // Exclude the last user message
                generationConfig: {
                    maxOutputTokens: 1000,
                    temperature: 0.7,
                    topP: 0.8,
                    topK: 40,
                },
            });

            const result = await Promise.race([
                chat.sendMessageStream(userMessage),
                this.timeout(this.TIMEOUT),
            ]);

            return this.createStreamIterator(result);
        } catch (error) {
            if (retryCount < this.MAX_RETRIES) {
                console.log(`Retrying AI request (attempt ${retryCount + 1}/${this.MAX_RETRIES})...`);
                await this.delay(this.RETRY_DELAY * Math.pow(2, retryCount));
                return this.generateStreamingResponse(contextMessages, userMessage, userContext, retryCount + 1);
            }

            // Return fallback response
            return this.getFallbackResponse(userContext.language);
        }
    }

    /**
     * Create async iterator from stream result
     */
    private static async *createStreamIterator(result: any): AsyncIterableIterator<string> {
        try {
            for await (const chunk of result.stream) {
                const text = chunk.text();
                if (text) {
                    yield text;
                }
            }
        } catch (error) {
            console.error('Error in stream iterator:', error);
            throw error;
        }
    }

    /**
     * Wrap stream iterator to collect full response
     */
    private static async *wrapStreamIterator(
        iterator: AsyncIterableIterator<string>,
        onChunk: (chunk: string) => void
    ): AsyncIterableIterator<string> {
        try {
            for await (const chunk of iterator) {
                onChunk(chunk);
                yield chunk;
            }
        } catch (error) {
            console.error('Error in wrapped stream iterator:', error);
            throw error;
        }
    }

    /**
     * Get fallback response when AI fails
     */
    private static async *getFallbackResponse(language: string): AsyncIterableIterator<string> {
        const fallbackMessages: Record<string, string> = {
            en: "I'm having trouble connecting right now. Please try again in a moment. In the meantime, remember to always check food labels carefully for your allergens.",
            hi: "मुझे अभी कनेक्ट करने में परेशानी हो रही है। कृपया एक क्षण में पुनः प्रयास करें। इस बीच, अपने एलर्जी के लिए हमेशा खाद्य लेबल की सावधानीपूर्वक जांच करना याद रखें।",
            ta: "எனக்கு இப்போது இணைப்பதில் சிக்கல் உள்ளது. தயவுசெய்து சிறிது நேரத்தில் மீண்டும் முயற்சிக்கவும். இதற்கிடையில், உங்கள் ஒவ்வாமைகளுக்கு உணவு லேபிள்களை கவனமாக சரிபார்க்க நினைவில் கொள்ளுங்கள்.",
            te: "నాకు ఇప్పుడు కనెక్ట్ చేయడంలో సమస్య ఉంది. దయచేసి ఒక క్షణంలో మళ్లీ ప్రయత్నించండి. ఈ మధ్యలో, మీ అలెర్జీల కోసం ఆహార లేబుల్‌లను జాగ్రత్తగా తనిఖీ చేయడం గుర్తుంచుకోండి.",
            bn: "আমার এখন সংযোগ করতে সমস্যা হচ্ছে। অনুগ্রহ করে একটু পরে আবার চেষ্টা করুন। এই সময়ে, আপনার অ্যালার্জির জন্য সর্বদা খাদ্য লেবেল সাবধানে পরীক্ষা করতে ভুলবেন না।",
            mr: "मला आत्ता कनेक्ट करण्यात अडचण येत आहे. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा. दरम्यान, आपल्या ऍलर्जीसाठी नेहमी अन्न लेबले काळजीपूर्वक तपासणे लक्षात ठेवा।",
        };

        const message = fallbackMessages[language] || fallbackMessages.en;
        yield message;
    }

    // ============================================================================
    // Private Methods - Conversation Management
    // ============================================================================

    /**
     * Save conversation after streaming completes
     */
    private static async saveConversationAfterStream(
        userId: string,
        conversationId: string | undefined,
        conversationHistory: Message[],
        fullResponse: string
    ): Promise<void> {
        try {
            // Create assistant message
            const assistantMessage: Message = {
                id: this.generateMessageId(),
                role: 'assistant',
                content: fullResponse,
                timestamp: new Date(),
            };

            conversationHistory.push(assistantMessage);

            // Generate title from first message if new conversation
            const title = conversationId
                ? undefined
                : this.generateConversationTitle(conversationHistory[0].content);

            await this.saveConversation(userId, conversationId, conversationHistory, title);
        } catch (error) {
            console.error('Error saving conversation:', error);
        }
    }

    /**
     * Save conversation to Firestore
     */
    private static async saveConversation(
        userId: string,
        conversationId: string | undefined,
        messages: Message[],
        title?: string
    ): Promise<string> {
        try {
            const conversationData = {
                messages: messages.map((msg) => ({
                    id: msg.id,
                    role: msg.role,
                    content: msg.content,
                    timestamp: Timestamp.fromDate(msg.timestamp),
                })),
                updatedAt: Timestamp.now(),
            };

            if (conversationId) {
                // Update existing conversation
                const conversationRef = doc(firestore, 'users', userId, 'conversations', conversationId);
                await updateDoc(conversationRef, conversationData);
                return conversationId;
            } else {
                // Create new conversation
                const conversationsRef = collection(firestore, 'users', userId, 'conversations');
                const newConversation = await addDoc(conversationsRef, {
                    ...conversationData,
                    createdAt: Timestamp.now(),
                    title: title || 'New Conversation',
                });
                return newConversation.id;
            }
        } catch (error) {
            console.error('Error saving conversation:', error);
            throw error;
        }
    }

    /**
     * Generate conversation title from first message
     */
    private static generateConversationTitle(firstMessage: string): string {
        const maxLength = 50;
        if (firstMessage.length <= maxLength) {
            return firstMessage;
        }
        return firstMessage.substring(0, maxLength) + '...';
    }

    // ============================================================================
    // Private Methods - Utilities
    // ============================================================================

    /**
     * Generate unique message ID
     */
    private static generateMessageId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Create timeout promise
     */
    private static timeout(ms: number): Promise<never> {
        return new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), ms)
        );
    }

    /**
     * Delay helper for retry logic
     */
    private static delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Handle and format errors
     */
    private static handleError(error: any): Error {
        if (error.message === 'Request timeout') {
            return new Error('The AI is taking too long to respond. Please try again.');
        }

        if (error.code === 'resource-exhausted') {
            return new Error('AI service is temporarily unavailable. Please try again later.');
        }

        if (error.code === 'permission-denied') {
            return new Error('You do not have permission to use this feature.');
        }

        return new Error('An error occurred while processing your request. Please try again.');
    }
}
