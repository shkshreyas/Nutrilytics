# 🥗 Nutrilytics

A smart nutrition tracking app that helps you make informed food choices.

## ✨ Features

- 📸 **Food Scanning**: Instantly scan food items for nutritional info
- 📊 **Nutrition Tracking**: Track your daily nutritional intake
- 📱 **User-Friendly**: Clean, intuitive interface
- 🔄 **History**: View and analyze your nutrition history
- 🔒 **Secure**: Firebase-powered authentication and storage
- 📵 **Offline Support**: Works without internet connection

## 🚀 Tech Stack

- React Native + Expo
- Firebase Authentication & Cloud Firestore
- TypeScript
- Expo Router

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build Android app bundle
eas build --platform android --profile production

# Build iOS app
eas build --platform ios --profile production
```

## 📱 Environment Setup

1. Create `.env` file with Firebase config
2. Install Expo Go for development
3. Configure Firebase project
4. Set up EAS Build

## 📦 Production Build

Using EAS Build with auto-versioning:

- Android: Generates signed AAB
- iOS: Generates IPA
- Auto-increments version codes

## 🔑 Environment Variables

Required Firebase configuration:

```
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
FIREBASE_MEASUREMENT_ID=
```

## 📄 License

MIT License - Feel free to use and modify
