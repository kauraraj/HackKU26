import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { LoadingState } from '@/components/LoadingState';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

function StatusBarController() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

function AuthGate() {
  const { session, loading } = useAuth();
  const { colors } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) router.replace('/(auth)/login');
    if (session && inAuthGroup) router.replace('/(tabs)/feed');
  }, [session, loading, segments, router]);

  if (loading) return <LoadingState label="Waking up…" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="ingestion/new" options={{ title: 'Turn a TikTok into a trip' }} />
      <Stack.Screen name="ingestion/[id]" options={{ title: 'Review places' }} />
      <Stack.Screen name="trips/new" options={{ title: 'New trip' }} />
      <Stack.Screen name="trips/[id]" options={{ title: 'Trip' }} />
      <Stack.Screen name="shared-trip/[id]" options={{ title: 'Trip' }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBarController />
          <AuthGate />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
