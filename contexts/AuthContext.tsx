import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, firestore } from '../lib/firebase';
import { Platform } from 'react-native';
import * as Network from 'expo-network';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, fetchSignInMethodsForEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: any;
  userData: any | null;
  loading: boolean;
  userDataLoading: boolean;
  networkOffline: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  checkEmailExists: (email: string) => Promise<boolean>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [userDataLoading, setUserDataLoading] = useState(false);
  const [networkOffline, setNetworkOffline] = useState(false);

  useEffect(() => {
    const checkNetworkAndAuth = async () => {
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected || !networkState.isInternetReachable) {
        setNetworkOffline(true);
        setUserDataLoading(true);
        setLoading(false);
        return;
      } else {
        setNetworkOffline(false);
      }
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setUser(firebaseUser);
        if (firebaseUser) {
          await loadUserData(firebaseUser.uid);
        } else {
          setUserData(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    };
    checkNetworkAndAuth();
  }, []);

  const loadUserData = async (uid: string) => {
    try {
      setUserDataLoading(true);
      const userDoc = await getDoc(doc(firestore, 'users', uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setUserDataLoading(false);
    }
  };

  const refreshUserData = async () => {
    if (user?.uid) {
      await loadUserData(user.uid);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(firestore, 'users', userCredential.user.uid), {
        email: email,
        name: name,
        createdAt: new Date(),
        foodsScanned: 0,
        allergensFound: 0,
        safeFoods: 0,
        daysSafe: 0,
      });
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      return methods.length > 0;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  const value = {
    user,
    userData,
    loading,
    userDataLoading,
    networkOffline,
    signIn,
    signUp,
    signOutUser,
    checkEmailExists,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 