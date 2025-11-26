import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getVertexAI } from "@firebase/ai";
import { getAnalytics, isSupported } from "firebase/analytics";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your web app's Firebase configuration
const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(config);

// Initialize Firebase Authentication with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Cloud Firestore and get a reference to the service
const firestore = getFirestore(app);

// Initialize Vertex AI for Gemini
const vertexAI = getVertexAI(app);

// Initialize Firebase Analytics (conditionally for web)
let analytics: any = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
    console.log('Firebase Analytics initialized successfully');
  } else {
    console.log('Firebase Analytics not supported on this platform');
  }
}).catch((error) => {
  console.error('Error checking Analytics support:', error);
});

// Add error handling for Firestore initialization
if (!firestore) {
  console.error('Firestore failed to initialize');
} else {
  console.log('Firestore initialized successfully');
}

// Log Vertex AI initialization
if (vertexAI) {
  console.log('Vertex AI initialized successfully');
} else {
  console.error('Vertex AI failed to initialize');
}

export { auth, firestore, app, vertexAI, analytics };
