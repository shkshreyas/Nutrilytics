import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  fetchSignInMethodsForEmail
} from '@firebase/auth';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import { doc, setDoc, getDoc } from '@firebase/firestore';
import { auth, db } from '../lib/firebase';
import { GOOGLE_OAUTH_CONFIG } from '../constants';
import { NotificationService } from '../services/notificationService';

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  userDataLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  checkEmailExists: (email: string) => Promise<boolean>;
  googleSignIn: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [userDataLoading, setUserDataLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Load user data when user is authenticated
        await loadUserData(user.uid);
      } else {
        // Clear user data when user is null
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loadUserData = async (uid: string) => {
    try {
      setUserDataLoading(true);
      const data = await getDoc(doc(db, 'users', uid));
      if (data.exists()) {
        const userData = data.data();
        setUserData(userData);
        
        // Initialize notifications if user has them enabled
        if (userData.notifications !== false) {
          await NotificationService.scheduleDailyNotifications();
        }
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User signed in:', userCredential.user.email);
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Save user data to Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email,
        name: name,
        createdAt: new Date(),
        foodsScanned: 0,
        allergensFound: 0,
        safeFoods: 0,
        daysSafe: 0,
      });

      console.log('User signed up:', userCredential.user.email);
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      // Cancel all notifications when user signs out
      await NotificationService.cancelAllNotifications();
      await signOut(auth);
      console.log('User signed out');
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

  const googleSignIn = async () => {
    try {
      // Configure Google OAuth
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'nutrilytics',
        path: 'auth'
      });

      // Get client ID from app config or environment or use constants
      const extra = Constants.expoConfig?.extra;
      const clientId = extra?.googleOAuthClientId || process.env.GOOGLE_OAUTH_CLIENT_ID || GOOGLE_OAUTH_CONFIG.clientId;
      
      console.log('Using Google OAuth Client ID:', clientId);
      
      // Generate a random code verifier
      const codeVerifier = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      const request = new AuthSession.AuthRequest({
        clientId: clientId,
        scopes: ['openid', 'profile', 'email'],
        redirectUri: redirectUri,
        responseType: AuthSession.ResponseType.Code,
        codeChallenge: codeVerifier,
        codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      });

      if (result.type === 'success' && result.params.code) {
        try {
          // Exchange code for tokens
          const tokenResponse = await AuthSession.exchangeCodeAsync(
            {
              clientId: clientId,
              code: result.params.code,
              redirectUri: redirectUri,
              extraParams: {
                code_verifier: codeVerifier,
              },
            },
            {
              tokenEndpoint: 'https://oauth2.googleapis.com/token',
            }
          );

          if (tokenResponse.accessToken) {
            // Create credential and sign in
            const credential = GoogleAuthProvider.credential(tokenResponse.accessToken);
            const userCredential = await signInWithCredential(auth, credential);

            // Check if user exists in Firestore, if not create profile
            const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
            if (!userDoc.exists()) {
              await setDoc(doc(db, 'users', userCredential.user.uid), {
                email: userCredential.user.email,
                name: userCredential.user.displayName || 'User',
                avatar: '😀', // Default avatar
                createdAt: new Date(),
                foodsScanned: 0,
                allergensFound: 0,
                safeFoods: 0,
                daysSafe: 0,
                allergens: [], // Initialize empty allergens array
              });
            }

            console.log('Google sign in successful:', userCredential.user.email);
          } else {
            throw new Error('Failed to get access token from Google');
          }
        } catch (tokenError: any) {
          console.error('Token exchange error:', tokenError);
          throw new Error('Failed to authenticate with Google. Please try again.');
        }
      } else if (result.type === 'cancel') {
        throw new Error('Google sign in was cancelled');
      } else {
        throw new Error('Google sign in failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      if (error.message.includes('cancelled')) {
        throw new Error('Sign in was cancelled');
      } else if (error.message.includes('network')) {
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        throw new Error('Google sign in failed. Please try again.');
      }
    }
  };

  const value = {
    user,
    userData,
    loading,
    userDataLoading,
    signIn,
    signUp,
    signOutUser,
    checkEmailExists,
    googleSignIn,
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