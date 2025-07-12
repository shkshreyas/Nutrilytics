import { initializeApp } from "@firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "@firebase/auth";
import { getFirestore } from "@firebase/firestore";
import { getAnalytics } from "@firebase/analytics";
import AsyncStorage from "@react-native-async-storage/async-storage";

// IMPORTANT: Do not hardcode secrets in this file.
// Use .env for local development and EAS secrets for production builds.
// See README for details.

export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

// Initialize Analytics (only for web and when supported)
let analytics = null;
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.log('Analytics not supported in this environment');
  }
}

export { auth, db, analytics };
export default app; 