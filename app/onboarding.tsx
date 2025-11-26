import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { UserService } from '../services/userService';


const { width, height } = Dimensions.get('window');

interface OnboardingStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  backgroundColor: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to NutriLytics',
    subtitle: 'Your Food Safety Companion',
    description:
      'Scan food items to instantly check for allergens and get detailed nutritional information to make informed dietary choices.',
    image: '🔍',
    backgroundColor: '#4CAF50',
  },
  {
    id: 2,
    title: 'Allergen Detection',
    subtitle: 'Stay Safe, Stay Informed',
    description:
      'Our AI-powered scanner identifies common allergens like nuts, dairy, gluten, and more to help you avoid allergic reactions.',
    image: '🛡️',
    backgroundColor: '#FF9800',
  },
  {
    id: 3,
    title: 'Nutritional Insights',
    subtitle: 'Track Your Health',
    description:
      'Get detailed nutritional breakdown including calories, protein, carbs, fats, and fiber to maintain a balanced diet.',
    image: '📊',
    backgroundColor: '#2196F3',
  },
  {
    id: 4,
    title: 'Personalized Experience',
    subtitle: 'Your Health, Your Way',
    description:
      'Set your allergens, track your scan history, and get personalized recommendations based on your dietary preferences.',
    image: '👤',
    backgroundColor: '#9C27B0',
  },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [allergens, setAllergens] = useState<string[]>([]);
  const { user, userData, refreshUserData } = useAuth();

  const commonAllergens = [
    'Peanuts',
    'Tree Nuts',
    'Milk',
    'Eggs',
    'Soy',
    'Wheat',
    'Fish',
    'Shellfish',
    'Gluten',
    'Lactose',
  ];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const toggleAllergen = (allergen: string) => {
    setAllergens((prev) =>
      prev.includes(allergen)
        ? prev.filter((a) => a !== allergen)
        : [...prev, allergen]
    );
  };

  const completeOnboarding = async () => {
    try {
      if (user?.uid) {
        // Update user data with allergens and mark onboarding as complete
        await UserService.updateUserAllergens(user.uid, allergens);
        await UserService.updateUserData(user.uid, {
          onboardingCompleted: false, // Keep it false until tutorial is completed
          onboardingStartedAt: new Date(),
        });
        await refreshUserData();
        router.replace('/tutorial'); // Always go to tutorial after onboarding
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert(
        'Error',
        'Failed to save your preferences. Please try again.'
      );
    }
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: currentStepData.backgroundColor },
      ]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {onboardingSteps.map((_, index) => (
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
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.image}>{currentStepData.image}</Text>
          <Text style={styles.title}>{currentStepData.title}</Text>
          <Text style={styles.subtitle}>{currentStepData.subtitle}</Text>
          <Text style={styles.description}>{currentStepData.description}</Text>

          {/* Allergen Selection (Step 4) */}
          {currentStep === 3 && (
            <View style={styles.allergenSection}>
              <Text style={styles.allergenTitle}>Select your allergens:</Text>
              <View style={styles.allergenGrid}>
                {commonAllergens.map((allergen) => (
                  <TouchableOpacity
                    key={allergen}
                    style={[
                      styles.allergenChip,
                      allergens.includes(allergen) &&
                        styles.allergenChipSelected,
                    ]}
                    onPress={() => toggleAllergen(allergen)}
                  >
                    <Text
                      style={[
                        styles.allergenChipText,
                        allergens.includes(allergen) &&
                          styles.allergenChipTextSelected,
                      ]}
                    >
                      {allergen}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentStep === onboardingSteps.length - 1
              ? 'Get Started'
              : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
  image: {
    fontSize: 80,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
  },
  description: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  allergenSection: {
    marginTop: 40,
    width: '100%',
  },
  allergenTitle: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  allergenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  allergenChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  allergenChipSelected: {
    backgroundColor: 'white',
  },
  allergenChipText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  allergenChipTextSelected: {
    color: '#9C27B0',
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
    color: '#9C27B0',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
