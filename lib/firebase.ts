import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAnalytics, type Analytics } from "firebase/analytics";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD4peBdfBdffCQdd4Ng-4at95i9f8KV6FQ",
  authDomain: "nutrilytics-18a2b.firebaseapp.com",
  projectId: "nutrilytics-18a2b",
  storageBucket: "nutrilytics-18a2b.firebaseapp.com",
  messagingSenderId: "305030381271",
  appId: "1:305030381271:web:cafce146b4d6dabf0a3a92",
  measurementId: "G-D41SYR2W13"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth: Auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db: Firestore = getFirestore(app);

// Initialize Analytics (only for web platforms)
let analytics: Analytics | null = null;
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.log('Analytics not supported in this environment');
  }
}

export { app, auth, db, analytics };
