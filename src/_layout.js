import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ServerProvider } from './context/ServerContext';
import ErrorBoundary from './components/ErrorBoundary';

/**
 * Root Layout for Beacon App
 * Light theme, white headers, dark statusbar.
 */
export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ServerProvider>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />
        <Stack
          initialRouteName="splash"
          screenOptions={{
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerTintColor: '#111111',
            headerTitleStyle: { fontWeight: '600' },
            contentStyle: { backgroundColor: '#F7F8FA' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="splash" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen
            name="history"
            options={{ title: 'Scan History', headerStyle: { backgroundColor: '#FFFFFF' }, headerTintColor: '#111111' }}
          />
        </Stack>
      </ServerProvider>
    </ErrorBoundary>
  );
}
