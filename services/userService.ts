import { doc, getDoc, setDoc, updateDoc, increment, collection, getDocs, query, orderBy, limit, addDoc, deleteDoc } from '@firebase/firestore';
import { db } from '@/lib/firebase';

export interface UserData {
  email: string;
  name: string;
  createdAt: Date;
  foodsScanned: number;
  allergensFound: number;
  safeFoods: number;
  daysSafe: number;
  allergens?: string[];
}

export class UserService {
  static async getUserData(userId: string): Promise<UserData | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data() as UserData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  }

  static async createUserData(userId: string, userData: Partial<UserData>): Promise<void> {
    try {
      await setDoc(doc(db, 'users', userId), {
        ...userData,
        createdAt: new Date(),
        foodsScanned: 0,
        allergensFound: 0,
        safeFoods: 0,
        daysSafe: 0,
      });
    } catch (error) {
      console.error('Error creating user data:', error);
      throw error;
    }
  }

  static async updateUserStats(userId: string, stats: {
    foodsScanned?: number;
    allergensFound?: number;
    safeFoods?: number;
    daysSafe?: number;
  }): Promise<void> {
    try {
      const updates: any = {};
      if (stats.foodsScanned !== undefined) updates.foodsScanned = increment(stats.foodsScanned);
      if (stats.allergensFound !== undefined) updates.allergensFound = increment(stats.allergensFound);
      if (stats.safeFoods !== undefined) updates.safeFoods = increment(stats.safeFoods);
      if (stats.daysSafe !== undefined) updates.daysSafe = increment(stats.daysSafe);

      await updateDoc(doc(db, 'users', userId), updates);
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }

  static async updateUserAllergens(userId: string, allergens: string[]): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        allergens: allergens
      });
    } catch (error) {
      console.error('Error updating user allergens:', error);
      throw error;
    }
  }

  static async updateUserSettings(userId: string, settings: {
    notifications?: boolean;
    autoScan?: boolean;
    hapticFeedback?: boolean;
  }): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        settings: settings
      });
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  static async updateUserData(userId: string, data: Partial<UserData> & { [key: string]: any }): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), data);
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }

  static async getRecentScans(userId: string): Promise<any[]> {
    try {
      const scansRef = collection(db, 'users', userId, 'scans');
      const q = query(scansRef, orderBy('scanDate', 'desc'), limit(5));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching recent scans:', error);
      return [];
    }
  }

  static async getScanHistory(userId: string): Promise<any[]> {
    try {
      const scansRef = collection(db, 'users', userId, 'scans');
      const q = query(scansRef, orderBy('scanDate', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching scan history:', error);
      return [];
    }
  }

  static async addScanResult(userId: string, hasAllergens: boolean): Promise<void> {
    try {
      const updates: any = {
        foodsScanned: increment(1)
      };

      if (hasAllergens) {
        updates.allergensFound = increment(1);
      } else {
        updates.safeFoods = increment(1);
      }

      await updateDoc(doc(db, 'users', userId), updates);
    } catch (error) {
      console.error('Error adding scan result:', error);
      throw error;
    }
  }

  static async saveScanToHistory(userId: string, scanData: any): Promise<void> {
    try {
      const scansRef = collection(db, 'users', userId, 'scans');
      await addDoc(scansRef, {
        ...scanData,
        createdAt: new Date().toISOString(),
      });
      // After adding, check if there are more than 5 scans and delete the oldest
      const q = query(scansRef, orderBy('scanDate', 'desc'));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.size > 5) {
        // Delete all but the 5 most recent
        const docsToDelete = querySnapshot.docs.slice(5);
        for (const docSnap of docsToDelete) {
          await deleteDoc(docSnap.ref);
        }
      }
    } catch (error) {
      console.error('Error saving scan to history:', error);
      throw error;
    }
  }
} 