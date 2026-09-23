import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { ApiConfigProvider } from '@/lib/apiConfig';

import { ScrollView, Text as RNText } from 'react-native';
import type { ErrorBoundaryProps } from 'expo-router';

// Shows the actual error on screen instead of a silent blank page, so a
// crash can be diagnosed from a screenshot without adb/logcat.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 24, paddingTop: 64 }}>
      <RNText style={{ color: '#dc2626', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>App error</RNText>
      <RNText selectable style={{ color: '#111', marginBottom: 12 }}>{error.message}</RNText>
      <RNText selectable style={{ color: '#555', fontSize: 11 }}>{error.stack}</RNText>
      <RNText onPress={retry} style={{ color: '#2563eb', marginTop: 20, fontWeight: '700' }}>Retry</RNText>
    </ScrollView>
  );
}

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ApiConfigProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </ApiConfigProvider>
  );
}
