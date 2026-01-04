import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
// Fonts - Noto Sans loaded first as it appears on splash screen
import { useFonts, NotoSans_700Bold } from '@expo-google-fonts/noto-sans';
import { EBGaramond_400Regular, EBGaramond_700Bold } from '@expo-google-fonts/eb-garamond';
import { Cardo_400Regular, Cardo_700Bold } from '@expo-google-fonts/cardo';
import { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { theme } from '@/constants/theme';
import { colors } from '@/constants/colors';
import { SefariaProvider } from '@/contexts/SefariaContext';
import { AuthProvider } from '@/contexts/AuthContext';

// Early debug logging for mobile Safari issues
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const ua = navigator.userAgent;
  const isMobileSafari = /iPhone.*Safari/.test(ua) && !/CriOS|FxiOS/.test(ua);
  console.log('[TikTorah] App initializing', {
    userAgent: ua,
    isMobileSafari,
    platform: Platform.OS,
    url: window.location.href,
  });

  // Catch any global errors
  window.onerror = (message, source, lineno, colno, error) => {
    console.error('[TikTorah] Global error:', {
      message,
      source,
      lineno,
      colno,
      errorName: error?.name,
      errorMessage: error?.message,
    });
    return false;
  };

  // Catch unhandled promise rejections
  window.onunhandledrejection = (event) => {
    console.error('[TikTorah] Unhandled promise rejection:', {
      reason: event.reason,
      message: event.reason?.message,
    });
  };
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Logotype - loaded first (appears on splash screen)
    NotoSans_700Bold,
    // English serif (text blocks)
    EBGaramond_400Regular,
    EBGaramond_700Bold,
    // Hebrew serif (text blocks)
    Cardo_400Regular,
    Cardo_700Bold,
    // English sans (default app font)
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--sefaria-blue', colors['sefaria-blue']);
      document.title = 'TikTorah | Endless bites of learning';
    }
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <SefariaProvider>
          <AuthProvider>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            />
            <StatusBar style="auto" />
          </AuthProvider>
        </SefariaProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
