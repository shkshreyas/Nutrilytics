/**
 * AI Chat Interface Component
 * Full-featured chat interface for AI Nutrition Coach
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Animated,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { gradients, colorPalette } from '@/constants/colors';
import { animations } from '@/constants/animations';
import { GlassmorphismCard } from './design-system/GlassmorphismCard';
import { GradientButton } from './design-system/GradientButton';
import { hapticFeedback } from '@/utils/haptics';
import { AINutritionCoachService, Message } from '@/services/aiNutritionCoachService';
import { SubscriptionService } from '@/services/subscriptionService';

interface AIChatInterfaceProps {
    userId: string;
    conversationId?: string;
    onClose: () => void;
    onUpgradePress?: () => void;
}

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({
    userId,
    conversationId,
    onClose,
    onUpgradePress,
}) => {
    const { isDark, colors } = useTheme();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [showUpsell, setShowUpsell] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const [messageCount, setMessageCount] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const subscriptionService = SubscriptionService.getInstance();

    // Load conversation history on mount
    useEffect(() => {
        loadConversation();
        checkPremiumStatus();
    }, [conversationId]);

    // Show upsell after 3 messages for free users
    useEffect(() => {
        if (!isPremium && messageCount >= 3 && !showUpsell) {
            setShowUpsell(true);
        }
    }, [messageCount, isPremium]);

    const loadConversation = async () => {
        if (conversationId) {
            try {
                const conversation = await AINutritionCoachService.getConversation(
                    userId,
                    conversationId
                );
                if (conversation) {
                    setMessages(conversation.messages);
                    setMessageCount(conversation.messages.filter(m => m.role === 'user').length);
                }
            } catch (error) {
                console.error('Error loading conversation:', error);
            }
        }
    };

    const checkPremiumStatus = async () => {
        try {
            const hasPremium = await subscriptionService.checkPremiumAccess(userId);
            setIsPremium(hasPremium);
        } catch (error) {
            console.error('Error checking premium status:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || isLoading) return;

        // Check if user can send message
        if (!isPremium) {
            const canUse = await subscriptionService.canUseFeature(userId, 'ai_coach');
            if (!canUse.allowed) {
                setShowUpsell(true);
                return;
            }
            // Increment usage
            await subscriptionService.incrementUsage(userId, 'ai');
        }

        const userMessage = inputText.trim();
        setInputText('');
        setIsLoading(true);
        setIsTyping(true);
        hapticFeedback.light();

        // Add user message to UI
        const newUserMessage: Message = {
            id: `temp_${Date.now()}`,
            role: 'user',
            content: userMessage,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, newUserMessage]);
        setMessageCount(prev => prev + 1);

        // Scroll to bottom
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);

        try {
            // Send message and get streaming response
            const streamIterator = await AINutritionCoachService.sendMessage(
                userId,
                userMessage,
                conversationId
            );

            // Create AI message placeholder
            const aiMessageId = `ai_${Date.now()}`;
            const aiMessage: Message = {
                id: aiMessageId,
                role: 'assistant',
                content: '',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, aiMessage]);
            setIsTyping(false);

            // Stream response character by character
            let fullResponse = '';
            for await (const chunk of streamIterator) {
                fullResponse += chunk;
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === aiMessageId
                            ? { ...msg, content: fullResponse }
                            : msg
                    )
                );
                // Scroll to bottom during streaming
                flatListRef.current?.scrollToEnd({ animated: true });
            }

            hapticFeedback.success();
        } catch (error) {
            console.error('Error sending message:', error);
            hapticFeedback.error();
            // Show error message
            const errorMessage: Message = {
                id: `error_${Date.now()}`,
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setIsTyping(false);
        }
    };

    const handleQuickAction = async (action: 'meal_plan' | 'allergen' | 'tips') => {
        const quickMessages = {
            meal_plan: 'Can you generate a personalized meal plan for me?',
            allergen: 'What foods should I avoid based on my allergens?',
            tips: 'Give me some nutrition tips for my health goal',
        };

        setInputText(quickMessages[action]);
        hapticFeedback.light();
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.role === 'user';

        return (
            <View style={[styles.messageContainer, isUser && styles.userMessageContainer]}>
                {!isUser && (
                    <View style={styles.aiAvatar}>
                        <LinearGradient
                            colors={gradients.secondary}
                            style={styles.avatarGradient}
                        >
                            <Ionicons name="sparkles" size={16} color="#FFF" />
                        </LinearGradient>
                    </View>
                )}

                {isUser ? (
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.userBubble}
                    >
                        <Text style={styles.userMessageText}>{item.content}</Text>
                    </LinearGradient>
                ) : (
                    <GlassmorphismCard
                        style={styles.aiBubble}
                        contentStyle={styles.aiBubbleContent}
                    >
                        <Text style={[styles.aiMessageText, { color: colors.textPrimary }]}>
                            {item.content}
                        </Text>
                    </GlassmorphismCard>
                )}

                {isUser && (
                    <View style={styles.userAvatar}>
                        <Ionicons name="person" size={16} color={colors.textPrimary} />
                    </View>
                )}
            </View>
        );
    };

    const renderTypingIndicator = () => {
        if (!isTyping) return null;

        return (
            <View style={styles.messageContainer}>
                <View style={styles.aiAvatar}>
                    <LinearGradient
                        colors={gradients.secondary}
                        style={styles.avatarGradient}
                    >
                        <Ionicons name="sparkles" size={16} color="#FFF" />
                    </LinearGradient>
                </View>
                <GlassmorphismCard
                    style={styles.aiBubble}
                    contentStyle={styles.typingIndicatorContent}
                >
                    <TypingIndicator />
                </GlassmorphismCard>
            </View>
        );
    };

    const renderUpsellCard = () => {
        if (!showUpsell || isPremium) return null;

        return (
            <View style={styles.upsellContainer}>
                <GlassmorphismCard style={styles.upsellCard}>
                    <LinearGradient
                        colors={gradients.primary}
                        style={styles.upsellBorder}
                    />
                    <View style={styles.upsellContent}>
                        <Ionicons name="lock-closed" size={32} color={gradients.primary[0]} />
                        <Text style={[styles.upsellTitle, { color: colors.textPrimary }]}>
                            Unlock Unlimited AI Chat
                        </Text>
                        <Text style={[styles.upsellDescription, { color: colors.textSecondary }]}>
                            Get unlimited access to your AI Nutrition Coach with premium
                        </Text>
                        <GradientButton
                            title="Upgrade to Premium"
                            onPress={() => {
                                hapticFeedback.medium();
                                onUpgradePress?.();
                            }}
                            variant="primary"
                            size="medium"
                            style={styles.upsellButton}
                        />
                        <TouchableOpacity
                            onPress={() => {
                                setShowUpsell(false);
                                hapticFeedback.light();
                            }}
                            style={styles.dismissButton}
                        >
                            <Text style={[styles.dismissText, { color: colors.textSecondary }]}>
                                Maybe later
                            </Text>
                        </TouchableOpacity>
                    </View>
                </GlassmorphismCard>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            {/* Header */}
            <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerLeft}>
                        <View style={styles.aiAvatarLarge}>
                            <Ionicons name="sparkles" size={24} color="#FFF" />
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>AI Nutrition Coach</Text>
                            <Text style={styles.headerSubtitle}>
                                {isPremium ? 'Premium' : `${3 - messageCount} messages left today`}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            hapticFeedback.light();
                            onClose();
                        }}
                        style={styles.closeButton}
                    >
                        <Ionicons name="close" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Messages List */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                ListFooterComponent={renderTypingIndicator}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {/* Upsell Card */}
            {renderUpsellCard()}

            {/* Quick Actions */}
            {!showUpsell && (
                <View style={styles.quickActionsContainer}>
                    <TouchableOpacity
                        onPress={() => handleQuickAction('meal_plan')}
                        style={styles.quickActionButton}
                    >
                        <LinearGradient
                            colors={gradients.secondary}
                            style={styles.quickActionGradient}
                        >
                            <Ionicons name="restaurant" size={16} color="#FFF" />
                            <Text style={styles.quickActionText}>Meal Plan</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => handleQuickAction('allergen')}
                        style={styles.quickActionButton}
                    >
                        <LinearGradient
                            colors={gradients.warning}
                            style={styles.quickActionGradient}
                        >
                            <Ionicons name="alert-circle" size={16} color="#FFF" />
                            <Text style={styles.quickActionText}>Allergens</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => handleQuickAction('tips')}
                        style={styles.quickActionButton}
                    >
                        <LinearGradient
                            colors={gradients.success}
                            style={styles.quickActionGradient}
                        >
                            <Ionicons name="bulb" size={16} color="#FFF" />
                            <Text style={styles.quickActionText}>Tips</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

            {/* Input Area */}
            <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
                <GlassmorphismCard style={styles.inputCard} contentStyle={styles.inputCardContent}>
                    <TextInput
                        style={[styles.input, { color: colors.textPrimary }]}
                        placeholder="Ask me anything about nutrition..."
                        placeholderTextColor={colors.textSecondary}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={500}
                        editable={!isLoading}
                    />

                    <View style={styles.inputActions}>
                        <TouchableOpacity
                            style={styles.voiceButton}
                            onPress={() => {
                                hapticFeedback.light();
                                // Voice input functionality to be implemented
                            }}
                        >
                            <Ionicons
                                name="mic"
                                size={24}
                                color={colors.textSecondary}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleSendMessage}
                            disabled={!inputText.trim() || isLoading}
                            style={styles.sendButtonContainer}
                        >
                            <LinearGradient
                                colors={inputText.trim() && !isLoading ? gradients.primary : ['#CCC', '#999']}
                                style={styles.sendButton}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Ionicons name="send" size={20} color="#FFF" />
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </GlassmorphismCard>
            </View>
        </KeyboardAvoidingView>
    );
};

// Typing Indicator Component
const TypingIndicator: React.FC = () => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animate = (dot: Animated.Value, delay: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        animate(dot1, 0);
        animate(dot2, 200);
        animate(dot3, 400);
    }, []);

    const animatedStyle = (dot: Animated.Value) => ({
        opacity: dot.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
        }),
        transform: [
            {
                translateY: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -8],
                }),
            },
        ],
    });

    return (
        <View style={styles.typingIndicator}>
            <Animated.View style={[styles.typingDot, animatedStyle(dot1)]}>
                <LinearGradient colors={gradients.secondary} style={styles.dotGradient} />
            </Animated.View>
            <Animated.View style={[styles.typingDot, animatedStyle(dot2)]}>
                <LinearGradient colors={gradients.secondary} style={styles.dotGradient} />
            </Animated.View>
            <Animated.View style={[styles.typingDot, animatedStyle(dot3)]}>
                <LinearGradient colors={gradients.secondary} style={styles.dotGradient} />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 16,
        paddingHorizontal: 16,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    aiAvatarLarge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    messagesList: {
        padding: 16,
        paddingBottom: 8,
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-end',
        gap: 8,
    },
    userMessageContainer: {
        justifyContent: 'flex-end',
    },
    aiAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        overflow: 'hidden',
    },
    avatarGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colorPalette.surface.light,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userBubble: {
        maxWidth: '70%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        borderBottomRightRadius: 4,
    },
    userMessageText: {
        fontSize: 16,
        color: '#FFF',
        lineHeight: 22,
    },
    aiBubble: {
        maxWidth: '70%',
    },
    aiBubbleContent: {
        padding: 12,
    },
    aiMessageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    typingIndicatorContent: {
        padding: 12,
    },
    typingIndicator: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    dotGradient: {
        flex: 1,
    },
    quickActionsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
    },
    quickActionButton: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
    },
    quickActionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        gap: 6,
    },
    quickActionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFF',
    },
    inputContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.1)',
    },
    inputCard: {
        marginBottom: 0,
    },
    inputCardContent: {
        padding: 8,
    },
    input: {
        fontSize: 16,
        maxHeight: 100,
        paddingHorizontal: 8,
        paddingVertical: 8,
    },
    inputActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    voiceButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonContainer: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    sendButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    upsellContainer: {
        position: 'absolute',
        bottom: 80,
        left: 16,
        right: 16,
        zIndex: 1000,
    },
    upsellCard: {
        position: 'relative',
    },
    upsellBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    upsellContent: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 20,
    },
    upsellTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 12,
        textAlign: 'center',
    },
    upsellDescription: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },
    upsellButton: {
        marginTop: 16,
        width: '100%',
    },
    dismissButton: {
        marginTop: 12,
        paddingVertical: 8,
    },
    dismissText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
