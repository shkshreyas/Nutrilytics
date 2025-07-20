// Firebase Configuration
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD4peBdfBdffCQdd4Ng-4at95i9f8KV6FQ",
  authDomain: "nutrilytics-18a2b.firebaseapp.com",
  projectId: "nutrilytics-18a2b",
  storageBucket: "nutrilytics-18a2b.firebasestorage.app",
  messagingSenderId: "305030381271",
  appId: "1:305030381271:web:cafce146b4d6dabf0a3a92",
  measurementId: "G-D41SYR2W13"
};

// Google OAuth Configuration
export const GOOGLE_OAUTH_CONFIG = {
  clientId: "555921941405-amtqe1odfebf4ulp81dj0h5nb26r90m2.apps.googleusercontent.com",
  projectId: "nutrilytics-466404",
  authUri: "https://accounts.google.com/o/oauth2/auth",
  tokenUri: "https://oauth2.googleapis.com/token",
  authProviderX509CertUrl: "https://www.googleapis.com/oauth2/v1/certs"
};

// App Configuration
export const APP_CONFIG = {
  name: "Nutrilytics",
  version: "1.0.0",
  bundleId: "shk.health.nutrilytics",
  packageName: "shk.health.nutrilytics",
};

// API Endpoints
export const API_ENDPOINTS = {
  // Add any external API endpoints here
  foodDatabase: "https://api.example.com/foods",
  allergenDatabase: "https://api.example.com/allergens",
};

// App Settings
export const APP_SETTINGS = {
  maxImageSize: 10 * 1024 * 1024, // 10MB
  supportedImageFormats: ['jpg', 'jpeg', 'png'],
  maxAllergensPerUser: 50,
  scanHistoryLimit: 100,
};

// Development Settings
export const DEV_CONFIG = {
  enableLogging: __DEV__,
  enableDebugMode: __DEV__,
  mockDataEnabled: __DEV__,
};

// Security Settings
export const SECURITY_CONFIG = {
  passwordMinLength: 6,
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
}; 