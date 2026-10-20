import { IBMPlexSans_400Regular } from '@expo-google-fonts/ibm-plex-sans/400Regular';
import { IBMPlexSans_500Medium } from '@expo-google-fonts/ibm-plex-sans/500Medium';
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans/600SemiBold';
import { IBMPlexSans_700Bold } from '@expo-google-fonts/ibm-plex-sans/700Bold';
import { Sora_600SemiBold } from '@expo-google-fonts/sora/600SemiBold';
import { Sora_700Bold } from '@expo-google-fonts/sora/700Bold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { api } from '@/api';
import { AppProviders } from '@/state/api-context';
import { fonts } from '@/theme/tokens';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    [fonts.regular]: IBMPlexSans_400Regular,
    [fonts.medium]: IBMPlexSans_500Medium,
    [fonts.semibold]: IBMPlexSans_600SemiBold,
    [fonts.bold]: IBMPlexSans_700Bold,
    [fonts.displaySemibold]: Sora_600SemiBold,
    [fonts.displayBold]: Sora_700Bold,
  });

  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync();
  }, [loaded, error]);

  // Without fonts the app still works with the system font.
  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <AppProviders api={api}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}
        />
      </AppProviders>
    </SafeAreaProvider>
  );
}
