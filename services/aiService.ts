import { initializeApp } from '@firebase/app';
import { firebaseConfig } from '@/lib/firebase';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// For now, we'll use a mock AI service until Firebase AI Logic is fully available
// This simulates the AI analysis functionality

export interface AllergenAnalysis {
  hasAllergens: boolean;
  detectedAllergens: string[];
  confidence: number;
  description: string;
  recommendations: string[];
}

export interface FoodAnalysis {
  foodName: string;
  ingredients: string[];
  allergens: AllergenAnalysis;
  nutritionInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  safetyScore: number; // 0-100
  userSpecificAnalysis?: {
    personalRisk: 'high' | 'medium' | 'low';
    personalRecommendations: string[];
    matchesUserAllergens: string[];
  };
}

export class AIService {
  /**
   * Analyze a food image for allergens and safety
   */
  static async analyzeFoodImage(imageUri: string, userAllergens?: string[]): Promise<FoodAnalysis> {
    try {
      // Simulate AI analysis with realistic image processing
      // In production, this would use the actual Firebase AI Logic API
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Generate realistic analysis based on image content simulation
      // This simulates what a real AI would detect
      const imageContent = await this.simulateImageAnalysis(imageUri);
      
      if (!imageContent.isFood) {
        throw new Error('No food detected in the image. Please scan a food item or product packaging.');
      }

      const analysis: FoodAnalysis = {
        foodName: imageContent.foodName,
        ingredients: imageContent.ingredients,
        allergens: {
          hasAllergens: imageContent.allergens.length > 0,
          detectedAllergens: imageContent.allergens,
          confidence: imageContent.confidence,
          description: imageContent.description,
          recommendations: imageContent.recommendations
        },
        nutritionInfo: imageContent.nutritionInfo,
        safetyScore: imageContent.safetyScore
      };

      // Add user-specific analysis if user allergens are provided
      if (userAllergens && userAllergens.length > 0) {
        const matchingAllergens = analysis.allergens.detectedAllergens.filter(allergen =>
          userAllergens.some(userAllergen => 
            userAllergen.toLowerCase().includes(allergen.toLowerCase()) ||
            allergen.toLowerCase().includes(userAllergen.toLowerCase())
          )
        );

        analysis.userSpecificAnalysis = {
          personalRisk: matchingAllergens.length > 0 ? 'high' : 'low',
          personalRecommendations: matchingAllergens.length > 0 ? [
            '⚠️ HIGH RISK: This product contains your allergens!',
            'Do not consume this product',
            'Consider safer alternatives'
          ] : [
            '✅ SAFE: No matching allergens found',
            'Still check ingredients carefully',
            'Monitor for any reactions'
          ],
          matchesUserAllergens: matchingAllergens
        };
      }
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing food image:', error);
      throw error;
    }
  }

  /**
   * Simulate realistic image analysis
   */
  private static async simulateImageAnalysis(imageUri: string): Promise<{
    isFood: boolean;
    foodName: string;
    ingredients: string[];
    allergens: string[];
    confidence: number;
    description: string;
    recommendations: string[];
    nutritionInfo?: any;
    safetyScore: number;
  }> {
    // Simulate different types of content that might be scanned
    const contentTypes = [
      {
        isFood: false,
        foodName: '',
        ingredients: [],
        allergens: [],
        confidence: 0,
        description: 'This appears to be a non-food item.',
        recommendations: ['Please scan a food item or product packaging.'],
        safetyScore: 0
      },
      {
        isFood: true,
        foodName: 'Chocolate Chip Cookies',
        ingredients: ['Wheat Flour', 'Sugar', 'Chocolate Chips', 'Butter', 'Eggs', 'Vanilla Extract'],
        allergens: ['Wheat', 'Milk', 'Eggs', 'May contain Nuts'],
        confidence: 0.89,
        description: 'This product contains wheat, milk, and eggs. May contain traces of nuts.',
        recommendations: [
          'Avoid if allergic to wheat, milk, or eggs',
          'Check for nut allergies',
          'Consider gluten-free alternatives'
        ],
        nutritionInfo: { calories: 120, protein: 2, carbs: 15, fat: 6 },
        safetyScore: 45
      },
      {
        isFood: true,
        foodName: 'Almond Milk',
        ingredients: ['Almonds', 'Water', 'Calcium Carbonate', 'Vitamin D', 'Vitamin E'],
        allergens: ['Tree Nuts'],
        confidence: 0.94,
        description: 'This is almond milk, which contains tree nuts.',
        recommendations: [
          'Avoid if allergic to tree nuts',
          'Safe for dairy allergies',
          'Good alternative to cow milk'
        ],
        nutritionInfo: { calories: 30, protein: 1, carbs: 1, fat: 2.5 },
        safetyScore: 85
      },
      {
        isFood: true,
        foodName: 'Peanut Butter',
        ingredients: ['Peanuts', 'Salt', 'Sugar', 'Palm Oil'],
        allergens: ['Peanuts'],
        confidence: 0.97,
        description: 'This product contains peanuts and may contain other nuts.',
        recommendations: [
          'Avoid if allergic to peanuts',
          'Check for other nut allergies',
          'Consider sunflower seed butter as alternative'
        ],
        nutritionInfo: { calories: 190, protein: 7, carbs: 6, fat: 16 },
        safetyScore: 30
      },
      {
        isFood: true,
        foodName: 'Greek Yogurt',
        ingredients: ['Milk', 'Live Cultures', 'Vitamin D'],
        allergens: ['Milk'],
        confidence: 0.91,
        description: 'This is dairy yogurt containing milk proteins.',
        recommendations: [
          'Avoid if allergic to milk',
          'Safe for those with lactose intolerance (contains live cultures)',
          'Good source of protein and probiotics'
        ],
        nutritionInfo: { calories: 100, protein: 15, carbs: 8, fat: 0 },
        safetyScore: 75
      },
      {
        isFood: true,
        foodName: 'Rice Cakes',
        ingredients: ['Brown Rice', 'Salt'],
        allergens: [],
        confidence: 0.96,
        description: 'This product contains only rice and salt, no common allergens.',
        recommendations: [
          'Generally safe for most allergies',
          'Check for rice allergies (rare)',
          'Good gluten-free snack option'
        ],
        nutritionInfo: { calories: 35, protein: 1, carbs: 7, fat: 0 },
        safetyScore: 95
      }
    ];

    // Simulate random selection based on image characteristics
    // In reality, this would be based on actual image analysis
    const randomIndex = Math.floor(Math.random() * contentTypes.length);
    const selectedContent = contentTypes[randomIndex];

    // Simulate some non-food detection (20% chance)
    if (Math.random() < 0.2) {
      return contentTypes[0]; // Return non-food result
    }

    return selectedContent;
  }

  /**
   * Get a quick allergen check for an image
   */
  static async quickAllergenCheck(imageUri: string): Promise<AllergenAnalysis> {
    try {
      // Simulate quick allergen check
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate realistic quick analysis
      const imageContent = await this.simulateImageAnalysis(imageUri);
      
      if (!imageContent.isFood) {
        return {
          hasAllergens: false,
          detectedAllergens: [],
          confidence: 0,
          description: 'No food detected in the image.',
          recommendations: ['Please scan a food item or product packaging.']
        };
      }
      
      return {
        hasAllergens: imageContent.allergens.length > 0,
        detectedAllergens: imageContent.allergens,
        confidence: imageContent.confidence,
        description: imageContent.description,
        recommendations: imageContent.recommendations
      };
    } catch (error) {
      console.error('Error in quick allergen check:', error);
      throw error;
    }
  }



  /**
   * Stream analysis results for real-time feedback
   */
  static async streamAnalysis(imageUri: string, onChunk: (chunk: string) => void) {
    try {
      // Simulate streaming analysis
      const messages = [
        'Analyzing image...',
        'Detecting food items...',
        'Checking for common allergens...',
        'Identifying ingredients...',
        'Calculating safety score...',
        'Analysis complete!'
      ];
      
      for (const message of messages) {
        await new Promise(resolve => setTimeout(resolve, 500));
        onChunk(message + ' ');
      }
    } catch (error) {
      console.error('Error in streaming analysis:', error);
      throw error;
    }
  }
} 