import { collection, addDoc, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { firestore } from '../lib/firebase';

export interface FoodItem {
  id?: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servingSize: number;
  servingUnit: string;
  allergens?: string[];
  ingredients?: string[];
  barcode?: string;
  dateAdded?: Date;
}

export interface NutritionHistory {
  id?: string;
  userId: string;
  foodId: string;
  foodName: string;
  servingSize: number;
  servingUnit: string;
  dateConsumed: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

class FoodDataService {
  private foodCollection = collection(firestore, 'foods');
  private historyCollection = collection(firestore, 'nutritionHistory');

  // Add a new food item to the database
  async addFood(food: FoodItem): Promise<string> {
    try {
      const docRef = await addDoc(this.foodCollection, {
        ...food,
        dateAdded: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding food:', error);
      throw error;
    }
  }

  // Search food by name
  async searchFoodByName(name: string): Promise<FoodItem[]> {
    try {
      const q = query(
        this.foodCollection,
        where('name', '>=', name),
        where('name', '<=', name + '\uf8ff')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FoodItem));
    } catch (error) {
      console.error('Error searching food:', error);
      throw error;
    }
  }

  // Get food by barcode
  async getFoodByBarcode(barcode: string): Promise<FoodItem | null> {
    try {
      const q = query(this.foodCollection, where('barcode', '==', barcode));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as FoodItem;
    } catch (error) {
      console.error('Error getting food by barcode:', error);
      throw error;
    }
  }

  // Add to user's nutrition history
  async addToHistory(historyEntry: NutritionHistory): Promise<string> {
    try {
      const docRef = await addDoc(this.historyCollection, {
        ...historyEntry,
        dateConsumed: new Date(historyEntry.dateConsumed)
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding to history:', error);
      throw error;
    }
  }

  // Get user's nutrition history
  async getUserHistory(userId: string, startDate?: Date, endDate?: Date): Promise<NutritionHistory[]> {
    try {
      let q = query(this.historyCollection, where('userId', '==', userId));
      
      if (startDate && endDate) {
        q = query(q, 
          where('dateConsumed', '>=', startDate),
          where('dateConsumed', '<=', endDate)
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as NutritionHistory));
    } catch (error) {
      console.error('Error getting user history:', error);
      throw error;
    }
  }

  // Get food details by ID
  async getFoodById(foodId: string): Promise<FoodItem | null> {
    try {
      const docRef = doc(this.foodCollection, foodId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      } as FoodItem;
    } catch (error) {
      console.error('Error getting food by ID:', error);
      throw error;
    }
  }

  // Get foods by allergen filter
  async getFoodsByAllergens(excludedAllergens: string[]): Promise<FoodItem[]> {
    try {
      const q = query(this.foodCollection);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as FoodItem))
        .filter(food => 
          !food.allergens?.some(allergen => 
            excludedAllergens.includes(allergen)
          )
        );
    } catch (error) {
      console.error('Error getting foods by allergens:', error);
      throw error;
    }
  }

  // Get nutrition summary for a date range
  async getNutritionSummary(userId: string, startDate: Date, endDate: Date) {
    try {
      const history = await this.getUserHistory(userId, startDate, endDate);
      
      const summary = {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
        mealCounts: {
          breakfast: 0,
          lunch: 0,
          dinner: 0,
          snack: 0
        }
      };

      for (const entry of history) {
        const food = await this.getFoodById(entry.foodId);
        if (food) {
          const multiplier = entry.servingSize / food.servingSize;
          summary.totalCalories += food.calories * multiplier;
          summary.totalProtein += food.protein * multiplier;
          summary.totalCarbs += food.carbs * multiplier;
          summary.totalFat += food.fat * multiplier;
          summary.totalFiber += food.fiber * multiplier;
          summary.mealCounts[entry.mealType]++;
        }
      }

      return summary;
    } catch (error) {
      console.error('Error getting nutrition summary:', error);
      throw error;
    }
  }
}

export const foodDataService = new FoodDataService();
