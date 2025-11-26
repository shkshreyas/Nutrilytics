import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import SplashScreen from '../components/SplashScreen';
import { NotificationSetupService } from '../services/notificationSetupService';

function RootLayoutContent() {
  const { user, loading, userDataLoading, networkOffline, needsOnboarding } =
    useAuth();
  useFrameworkReady();

  useEffect(() => {
    if (user) {
      NotificationSetupService.requestNotificationPermission().then(() => {
        NotificationSetupService.setupNotifications();
      });
    }
  }, [user]);

  // Show splash screen while loading auth state or user data
  if (loading || (user && userDataLoading)) {
    const message = loading ? 'Initializing...' : 'Loading your data...';
    return <SplashScreen message={message} networkOffline={networkOffline} />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {user ? (
          needsOnboarding ? (
            <>
              <Stack.Screen name="welcome" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="tutorial" />
            </>
          ) : (
            <Stack.Screen name="(tabs)" />
          )
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
