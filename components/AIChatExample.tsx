/**
 * AI Chat Example Component
 * Demonstrates how to use the AIChatInterface component
 */

import React, { useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { AIChatInterface } from './AIChatInterface';
import { GradientButton } from './design-system/GradientButton';
import { useTheme } from '@/contexts/ThemeContext';

interface AIChatExampleProps {
    userId: string;
    onUpgradePress?: () => void;
}

export const AIChatExample: React.FC<AIChatExampleProps> = ({
    userId,
    onUpgradePress,
}) => {
    const [showChat, setShowChat] = useState(false);
    const [conversationId, setConversationId] = useState<string | undefined>(undefined);
    const { colors } = useTheme();

    const handleOpenChat = () => {
        setShowChat(true);
    };

    const handleCloseChat = () => {
        setShowChat(false);
    };

    const handleUpgrade = () => {
        setShowChat(false);
        onUpgradePress?.();
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <GradientButton
                title="Open AI Nutrition Coach"
                onPress={handleOpenChat}
                variant="primary"
                size="large"
                fullWidth
            />

            <Modal
                visible={showChat}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={handleCloseChat}
            >
                <AIChatInterface
                    userId={userId}
                    conversationId={conversationId}
                    onClose={handleCloseChat}
                    onUpgradePress={handleUpgrade}
                />
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
});
