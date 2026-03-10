import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ServerProvider } from '../src/context/ServerContext';
import ErrorBoundary from '../src/components/ErrorBoundary';

/**
 * Root Layout for Beacon App (SDK 54 Expo Router)
 * White-light theme, custom headers on index screen.
 */
export default function RootLayout() {
  return (
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
  );
}
