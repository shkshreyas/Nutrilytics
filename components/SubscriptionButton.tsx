import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import { Crown } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors } from '../theme';

interface SubscriptionButtonProps {
  mode?: 'button' | 'overlay';
  message?: string;
}

export default function SubscriptionButton({
  mode = 'button',
  message,
}: SubscriptionButtonProps) {
  const handlePress = () => {
    router.push('/subscription');
  };

  if (mode === 'overlay') {
    return (
      <Pressable style={styles.overlay} onPress={handlePress}>
        <View style={styles.overlayContent}>
          <Crown size={24} color="#FFD700" />
          <Text style={styles.overlayText}>{message || 'Unlock Premium'}</Text>
          <TouchableOpacity style={styles.upgradeButton} onPress={handlePress}>
            <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    );
  }

  return (
    <TouchableOpacity
      style={styles.floatingButton}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.iconContainer}>
        <Crown size={20} color="#FFD700" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.buttonText}>Go Premium</Text>
        <Text style={styles.trialText}>7 Days Free Trial</Text>
      </View>
    </TouchableOpacity>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  trialText: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.9,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    width: width - 64,
    alignItems: 'center',
  },
  overlayText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
