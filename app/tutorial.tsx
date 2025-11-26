import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { UserService } from '../services/userService';

const { width, height } = Dimensions.get('window');

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  backgroundColor: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: 'Scan Food Items',
    description:
      "Point your camera at any food item's barcode or packaging to instantly get allergen and nutritional information.",
    icon: '📱',
    backgroundColor: '#4CAF50',
  },
  {
    id: 2,
    title: 'Check Allergens',
    description:
      'The app will highlight any allergens that match your profile and show you exactly what to avoid.',
    icon: '⚠️',
    backgroundColor: '#FF9800',
  },
  {
    id: 3,
    title: 'View Nutrition',
    description:
      'Get detailed nutritional breakdown including calories, protein, carbs, fats, and fiber content.',
    icon: '📊',
    backgroundColor: '#2196F3',
  },
  {
    id: 4,
    title: 'Track History',
    description:
      'Review your scan history and track your dietary patterns over time in the History tab.',
    icon: '📈',
    backgroundColor: '#9C27B0',
  },
  {
    id: 5,
    title: 'Manage Profile',
    description:
      'Update your allergens, view your stats, and customize your experience in the Profile tab.',
    icon: '👤',
    backgroundColor: '#607D8B',
  },
];

export default function TutorialScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const { user, refreshUserData } = useAuth();

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const handleSkip = () => {
    completeTutorial();
  };

  const completeTutorial = async () => {
    try {
      if (user?.uid) {
        await UserService.updateUserData(user.uid, {
          onboardingCompleted: true,
          tutorialCompleted: true,
          tutorialCompletedAt: new Date(),
        });
        await refreshUserData();
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error completing tutorial:', error);
      Alert.alert('Error', 'Failed to save your progress. Please try again.');
    }
  };

  const currentStepData = tutorialSteps[currentStep];

  return (
    <LinearGradient
      colors={[
        currentStepData.backgroundColor,
        currentStepData.backgroundColor + '80',
      ]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {tutorialSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentStep && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        {/* Skip Button */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip Tutorial</Text>
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.icon}>{currentStepData.icon}</Text>
          <Text style={styles.title}>{currentStepData.title}</Text>
          <Text style={styles.description}>{currentStepData.description}</Text>

          {/* Feature Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Pro Tips:</Text>
            {currentStep === 0 && (
              <View style={styles.tip}>
                <Text style={styles.tipText}>
                  • Hold your phone steady for better scanning
                </Text>
                <Text style={styles.tipText}>
                  • Works with most packaged foods
                </Text>
                <Text style={styles.tipText}>
                  • Try scanning from different angles if needed
                </Text>
              </View>
            )}
            {currentStep === 1 && (
              <View style={styles.tip}>
                <Text style={styles.tipText}>
                  • Red highlights indicate allergens
                </Text>
                <Text style={styles.tipText}>
                  • Green means safe to consume
                </Text>
                <Text style={styles.tipText}>
                  • Always double-check with ingredient lists
                </Text>
              </View>
            )}
            {currentStep === 2 && (
              <View style={styles.tip}>
                <Text style={styles.tipText}>
                  • Track your daily nutritional goals
                </Text>
                <Text style={styles.tipText}>
                  • Compare different food options
                </Text>
                <Text style={styles.tipText}>
                  • Use this data for meal planning
                </Text>
              </View>
            )}
            {currentStep === 3 && (
              <View style={styles.tip}>
                <Text style={styles.tipText}>
                  • Review your eating patterns
                </Text>
                <Text style={styles.tipText}>
                  • Track allergen exposure over time
                </Text>
                <Text style={styles.tipText}>
                  • Export data for healthcare providers
                </Text>
              </View>
            )}
            {currentStep === 4 && (
              <View style={styles.tip}>
                <Text style={styles.tipText}>• Update allergens as needed</Text>
                <Text style={styles.tipText}>
                  • View your safety statistics
                </Text>
                <Text style={styles.tipText}>
                  • Customize notification preferences
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentStep === tutorialSteps.length - 1
              ? 'Start Using App'
              : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: 'white',
    width: 24,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    padding: 10,
  },
  skipText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  icon: {
    fontSize: 80,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
    marginBottom: 40,
  },
  tipsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 12,
    width: '100%',
  },
  tipsTitle: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  tip: {
    gap: 8,
  },
  tipText: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
  },
  navigation: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  nextButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
