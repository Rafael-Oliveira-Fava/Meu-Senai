import { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, useFonts } from '@expo-google-fonts/roboto';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SnackbarProvider } from '../components/snackbar';
import { StoreProvider, useStore } from '../data/store';
import { color } from '../theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  // Browser surfaces carry the palette too: selection, focus ring, scrollbar.
  const style = document.createElement('style');
  style.textContent = `
    ::selection { background: ${color.primaryContainer}; color: ${color.onPrimaryContainer}; }
    :focus-visible { outline: 3px solid ${color.primary}; outline-offset: 2px; }
    * { scrollbar-width: thin; scrollbar-color: ${color.outlineStrong} transparent; }
    input, textarea { outline: none; caret-color: ${color.primary}; }
    body { background: ${color.bg}; }
  `;
  document.head.appendChild(style);
}

function Gate() {
  const { ready } = useStore();
  const [fontsLoaded] = useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold });
  const done = ready && fontsLoaded;

  useEffect(() => {
    if (done) SplashScreen.hideAsync().catch(() => {});
  }, [done]);

  if (!done) return null;
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg }, animation: 'fade_from_bottom' }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <SnackbarProvider>
          <Gate />
        </SnackbarProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
