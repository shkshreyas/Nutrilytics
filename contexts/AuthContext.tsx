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
import { doc, setDoc, getDoc } from '@firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  checkEmailExists: (email: string) => Promise<boolean>;
  googleSignIn: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

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

      const clientId = '996694388834-4546c4e44cb60cb346213b.apps.googleusercontent.com'; // Replace with your Google OAuth client ID
      
      const request = new AuthSession.AuthRequest({
        clientId: clientId,
        scopes: ['openid', 'profile', 'email'],
        redirectUri: redirectUri,
        responseType: AuthSession.ResponseType.Code,
        codeChallenge: await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          'challenge',
          { encoding: Crypto.CryptoEncoding.HEX }
        ),
        codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      });

      if (result.type === 'success') {
        // Exchange code for tokens
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: clientId,
            code: result.params.code,
            redirectUri: redirectUri,
            extraParams: {
              code_verifier: 'challenge',
            },
          },
          {
            tokenEndpoint: 'https://oauth2.googleapis.com/token',
          }
        );

        // Create credential and sign in
        const credential = GoogleAuthProvider.credential(tokenResponse.accessToken);
        const userCredential = await signInWithCredential(auth, credential);

        // Check if user exists in Firestore, if not create profile
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            email: userCredential.user.email,
            name: userCredential.user.displayName || 'User',
            createdAt: new Date(),
            foodsScanned: 0,
            allergensFound: 0,
            safeFoods: 0,
            daysSafe: 0,
          });
        }

        console.log('Google sign in successful:', userCredential.user.email);
      } else {
        throw new Error('Google sign in was cancelled');
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOutUser,
    checkEmailExists,
    googleSignIn,
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