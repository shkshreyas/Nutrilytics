import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import SplashScreen from '../components/SplashScreen';

function RootLayoutContent() {
  const { user, loading, userDataLoading, networkOffline } = useAuth();
  useFrameworkReady();

  // Show splash screen while loading auth state or user data
  if (loading || (user && userDataLoading)) {
    const message = loading ? "Initializing..." : "Loading your data...";
    return <SplashScreen message={message} networkOffline={networkOffline} />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="(tabs)" />
        ) : (
          <Stack.Screen name="auth" />
        )}
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}
