import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../lib/firebase';

// Complete the auth session
WebBrowser.maybeCompleteAuthSession();

// Google OAuth configuration
const GOOGLE_CLIENT_ID = '555921941405-amtqe1odfebf4ulp81dj0h5nb26r90m2.apps.googleusercontent.com';

// Create auth request
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export class GoogleAuthService {
  static async signInWithGoogle() {
    try {
      // Create auth request
      const request = new AuthSession.AuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        scopes: ['openid', 'profile', 'email'],
        redirectUri: AuthSession.makeRedirectUri({
          scheme: 'nutrilytics',
          path: 'auth',
        }),
        responseType: AuthSession.ResponseType.Code,
        extraParams: {
          access_type: 'offline',
        },
      });

      // Get auth URL
      const authUrl = await request.makeAuthUrlAsync(discovery);

      // Start auth session
      const result = await request.promptAsync(discovery, {
        showInRecents: true,
      });

      if (result.type === 'success' && result.params.code) {
        // Exchange code for tokens
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId: GOOGLE_CLIENT_ID,
            code: result.params.code,
            redirectUri: AuthSession.makeRedirectUri({
              scheme: 'nutrilytics',
              path: 'auth',
            }),
            extraParams: {
              code_verifier: request.codeVerifier || '',
            },
          },
          discovery
        );

        if (tokenResult.accessToken) {
          // Create Firebase credential
          const credential = GoogleAuthProvider.credential(
            tokenResult.idToken,
            tokenResult.accessToken
          );

          // Sign in to Firebase
          const userCredential = await signInWithCredential(auth, credential);
          return userCredential.user;
        }
      }

      throw new Error('Google sign-in failed');
    } catch (error) {
      console.error('Google Auth Error:', error);
      throw error;
    }
  }

  static async signOut() {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Google Sign-out Error:', error);
      throw error;
    }
  }
} 