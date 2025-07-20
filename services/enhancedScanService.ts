import * as ImageManipulator from 'expo-image-manipulator';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

// Free API endpoints
const OPENFOODFACTS_API = 'https://world.openfoodfacts.org/api/v0/product';
const OCR_SPACE_API = 'https://api.ocr.space/parse/image';

// Multiple OCR Space API keys for handling large requests
const OCR_API_KEYS = [
  'K84993614188957', // Primary key
  'K81724188988957', // Backup key 1
  'K84993614188958', // Backup key 2 (if available)
];

// Common allergen keywords for text analysis
const ALLERGEN_KEYWORDS = {
  nuts: ['nuts', 'peanut', 'almond', 'walnut', 'cashew', 'pistachio', 'hazelnut', 'pecan', 'macadamia', 'brazil nut'],
  dairy: ['milk', 'cheese', 'yogurt', 'cream', 'butter', 'whey', 'casein', 'lactose'],
  gluten: ['wheat', 'gluten', 'barley', 'rye', 'oats', 'flour', 'bread', 'pasta'],
  eggs: ['egg', 'eggs', 'albumin', 'ovalbumin'],
  soy: ['soy', 'soya', 'soybean', 'tofu', 'miso'],
  shellfish: ['shrimp', 'crab', 'lobster', 'oyster', 'clam', 'mussel', 'scallop'],
  fish: ['fish', 'tuna', 'salmon', 'cod', 'mackerel', 'sardine'],
  sesame: ['sesame', 'tahini'],
  sulfites: ['sulfite', 'sulphite', 'sulfur dioxide'],
  mustard: ['mustard', 'mustard seed'],
  celery: ['celery', 'celery seed'],
  lupin: ['lupin', 'lupine'],
  molluscs: ['mollusc', 'mollusk', 'snail', 'abalone'],
};

export interface ScanResult {
  allergens: string[];
  confidence: number;
  method: 'barcode' | 'ocr' | 'combined' | 'ai';
  productName?: string;
  ingredients?: string;
  barcode?: string;
  warnings: string[];
}

export interface AllergenInfo {
  name: string;
  severity: 'high' | 'medium' | 'low';
  confidence: number;
}

class EnhancedScanService {
  // Layer 1: Barcode scanning with OpenFoodFacts
  async scanBarcode(imageUri: string): Promise<string | null> {
    try {
      // This method will be called from the BarcodeScanner component
      // For now, we'll return null as the barcode scanning is handled separately
      console.log('Barcode scanning handled by BarcodeScanner component');
      return null;
    } catch (error) {
      console.error('Barcode scanning error:', error);
      return null;
    }
  }

  // Direct barcode lookup without scanning
  async lookupBarcode(barcode: string): Promise<ScanResult | null> {
    return await this.getOpenFoodFactsData(barcode);
  }

  // Layer 2: Get product data from OpenFoodFacts API
  async getOpenFoodFactsData(barcode: string): Promise<ScanResult | null> {
    try {
      const response = await fetch(`${OPENFOODFACTS_API}/${barcode}.json`);
      const data = await response.json();

      if (data.status === 1 && data.product) {
        const product = data.product;
        const allergens = this.extractAllergensFromOpenFoodFacts(product);
        
        return {
          allergens,
          confidence: 0.95, // High confidence for barcode-based results
          method: 'barcode',
          productName: product.product_name || 'Unknown Product',
          ingredients: product.ingredients_text || 'Ingredients not available',
          barcode,
          warnings: []
        };
      }
      
      // Return a default result for unknown barcodes
      return {
        allergens: [],
        confidence: 0.1,
        method: 'barcode',
        productName: 'Product Not Found',
        ingredients: 'Product not found in database',
        barcode,
        warnings: ['Product not found. Try scanning ingredients list.']
      };
    } catch (error) {
      console.error('OpenFoodFacts API error:', error);
      return {
        allergens: [],
        confidence: 0.0,
        method: 'barcode',
        productName: 'Network Error',
        ingredients: 'Unable to connect to database',
        barcode,
        warnings: ['Network error. Please try again.']
      };
    }
  }

  // Layer 3: OCR text extraction using OCR.Space API with multiple keys
  async extractTextWithOCR(imageUri: string): Promise<string> {
    try {
      // Convert image to base64
      const base64Image = await this.imageToBase64(imageUri);
      
      // Try each API key until one works
      for (const apiKey of OCR_API_KEYS) {
        try {
          const formData = new FormData();
          formData.append('apikey', apiKey);
          formData.append('language', 'eng');
          formData.append('isOverlayRequired', 'false');
          formData.append('base64Image', `data:image/jpeg;base64,${base64Image}`);

          const response = await fetch(OCR_SPACE_API, {
            method: 'POST',
            body: formData
          });

          const data = await response.json();
          
          if (data.ParsedResults && data.ParsedResults.length > 0) {
            return data.ParsedResults.map((result: any) => result.ParsedText).join(' ');
          }
          
          // If no results but no error, continue to next key
          if (data.IsErroredOnProcessing === false) {
            continue;
          }
        } catch (keyError) {
          console.log(`OCR API key ${apiKey} failed, trying next...`);
          continue;
        }
      }
      
      return '';
    } catch (error) {
      console.error('All OCR Space API keys failed:', error);
      return '';
    }
  }

  // Layer 4: Allergen detection from text
  detectAllergensInText(text: string): AllergenInfo[] {
    const detectedAllergens: AllergenInfo[] = [];
    const lowerText = text.toLowerCase();

    Object.entries(ALLERGEN_KEYWORDS).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (lowerText.includes(keyword.toLowerCase())) {
          // Calculate confidence based on keyword specificity
          const confidence = this.calculateConfidence(keyword, lowerText);
          
          detectedAllergens.push({
            name: category,
            severity: confidence > 0.8 ? 'high' : confidence > 0.6 ? 'medium' : 'low',
            confidence
          });
        }
      });
    });

    // Remove duplicates and sort by confidence
    return this.removeDuplicateAllergens(detectedAllergens);
  }

  // Layer 5: Image preprocessing for better OCR
  async preprocessImage(imageUri: string): Promise<string> {
    try {
      const processedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: 1200 } }, // Resize for better OCR
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return processedImage.uri;
    } catch (error) {
      console.error('Image preprocessing error:', error);
      return imageUri; // Return original if preprocessing fails
    }
  }

  // Main scanning function that combines all layers
  async scanFood(imageUri: string): Promise<ScanResult> {
    try {
      // Preprocess image for better results
      const processedImageUri = await this.preprocessImage(imageUri);
      
      // Layer 1: Try barcode first (highest accuracy)
      const barcode = await this.scanBarcode(processedImageUri);
      if (barcode) {
        const barcodeResult = await this.getOpenFoodFactsData(barcode);
        if (barcodeResult) {
          return barcodeResult;
        }
      }

      // Layer 2: OCR text extraction
      const ocrText = await this.extractTextWithOCR(processedImageUri);
      
      if (ocrText.trim()) {
        // Layer 3: Allergen detection from OCR text
        const allergens = this.detectAllergensInText(ocrText);
        
        return {
          allergens: allergens.map(a => a.name),
          confidence: this.calculateOverallConfidence(allergens),
          method: 'ocr',
          ingredients: ocrText,
          warnings: this.generateWarnings(allergens, ocrText)
        };
      }

      // Fallback: Use AI analysis when no text is extracted
      try {
        // Import AI service dynamically to avoid circular dependencies
        const { AIService } = await import('./aiService');
        const aiResult = await AIService.analyzeFoodImage(imageUri);
        
        return {
          allergens: aiResult.allergens.detectedAllergens,
          confidence: aiResult.allergens.confidence,
          method: 'ai',
          productName: aiResult.foodName,
          ingredients: aiResult.ingredients.join(', '),
          warnings: aiResult.allergens.recommendations
        };
      } catch (aiError) {
        console.log('AI analysis failed, returning empty result');
        return {
          allergens: [],
          confidence: 0,
          method: 'combined',
          warnings: ['Unable to analyze image. Please try with a clearer image or different angle.']
        };
      }

    } catch (error) {
      console.error('Enhanced scan error:', error);
      return {
        allergens: [],
        confidence: 0,
        method: 'combined',
        warnings: ['An error occurred during scanning. Please try again.']
      };
    }
  }

  // Helper methods
  private extractAllergensFromOpenFoodFacts(product: any): string[] {
    const allergens: string[] = [];
    
    // Check allergens_tags
    if (product.allergens_tags) {
      product.allergens_tags.forEach((tag: string) => {
        const allergen = tag.replace('en:', '').replace(/-/g, ' ');
        allergens.push(allergen);
      });
    }

    // Check allergens_hierarchy
    if (product.allergens_hierarchy) {
      product.allergens_hierarchy.forEach((allergen: string) => {
        const cleanAllergen = allergen.replace('en:', '').replace(/-/g, ' ');
        if (!allergens.includes(cleanAllergen)) {
          allergens.push(cleanAllergen);
        }
      });
    }

    return allergens;
  }

  private async imageToBase64(imageUri: string): Promise<string> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Image to base64 conversion error:', error);
      throw error;
    }
  }

  private calculateConfidence(keyword: string, text: string): number {
    const keywordLower = keyword.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Exact match gets higher confidence
    if (textLower.includes(keywordLower)) {
      // Check if it's in a context that suggests it's an ingredient
      const context = this.getContextAroundKeyword(textLower, keywordLower);
      if (context.includes('ingredient') || context.includes('contains') || context.includes('allergen')) {
        return 0.9;
      }
      return 0.7;
    }
    
    return 0.5;
  }

  private getContextAroundKeyword(text: string, keyword: string): string {
    const index = text.indexOf(keyword);
    if (index === -1) return '';
    
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + keyword.length + 50);
    return text.substring(start, end);
  }

  private removeDuplicateAllergens(allergens: AllergenInfo[]): AllergenInfo[] {
    const seen = new Set<string>();
    return allergens.filter(allergen => {
      if (seen.has(allergen.name)) {
        return false;
      }
      seen.add(allergen.name);
      return true;
    }).sort((a, b) => b.confidence - a.confidence);
  }

  private calculateOverallConfidence(allergens: AllergenInfo[]): number {
    if (allergens.length === 0) return 0;
    
    const totalConfidence = allergens.reduce((sum, allergen) => sum + allergen.confidence, 0);
    return totalConfidence / allergens.length;
  }

  private generateWarnings(allergens: AllergenInfo[], text: string): string[] {
    const warnings: string[] = [];
    
    if (allergens.length === 0) {
      warnings.push('No allergens detected, but please verify ingredients manually.');
    } else {
      const highRiskAllergens = allergens.filter(a => a.severity === 'high');
      if (highRiskAllergens.length > 0) {
        warnings.push(`High-risk allergens detected: ${highRiskAllergens.map(a => a.name).join(', ')}`);
      }
    }

    if (text.length < 50) {
      warnings.push('Limited text extracted. Consider taking a clearer photo of the ingredients list.');
    }

    return warnings;
  }
}

export const enhancedScanService = new EnhancedScanService(); 