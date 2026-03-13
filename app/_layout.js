import React, { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { ServerProvider } from '../src/context/ServerContext';
import ErrorBoundary from '../src/components/ErrorBoundary';

// Prevent auto-hiding of splash screen
SplashScreen.preventAutoHideAsync();

/**
 * Root Layout for Beacon App (SDK 54 Expo Router)
 * White-light theme, custom headers on index screen.
 */
export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  // Prepare app before hiding splash
  useEffect(() => {
    async function prepare() {
      try {
        // Add any app initialization here
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppReady(true);
      }
    }
    prepare();
  }, []);

  // Hide splash when app is ready
  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  // Return null until app is ready
  if (!appReady) {
    return null;
  }

  return (
    <View onLayout={onLayoutRootView} style={{ flex: 1 }}>
      <ErrorBoundary>
        <ServerProvider>
          <StatusBar style="dark" backgroundColor="#FFFFFF" />
          <Stack
            initialRouteName="splash"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#FFFFFF',
              },
              headerTintColor: '#111111',
              headerTitleStyle: {
                fontWeight: '600',
                color: '#111111',
              },
              contentStyle: {
                backgroundColor: '#F7F8FA',
              },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen
              name="splash"
              options={{
                headerShown: false,
                animation: 'fade',
              }}
            />
            <Stack.Screen
              name="index"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="history"
              options={{
                title: 'Scan History',
                headerStyle: { backgroundColor: '#FFFFFF' },
                headerTintColor: '#111111',
              }}
            />
            <Stack.Screen
              name="about"
              options={{
                title: 'About',
                headerStyle: { backgroundColor: '#FFFFFF' },
                headerTintColor: '#111111',
              }}
            />
          </Stack>
        </ServerProvider>
      </ErrorBoundary>
    </View>
  );
}
