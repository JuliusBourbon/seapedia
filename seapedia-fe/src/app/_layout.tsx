import '@/global.css';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack, useRouter, useSegments } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import {
  useFonts,
  Commissioner_400Regular,
  Commissioner_500Medium,
  Commissioner_600SemiBold,
  Commissioner_700Bold,
  Commissioner_800ExtraBold
} from '@expo-google-fonts/commissioner';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, activeRole, requiresRoleSelection } = useAuthStore();
  const segments = useSegments() as any;
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  const [fontsLoaded] = useFonts({
    Commissioner_400Regular,
    Commissioner_500Medium,
    Commissioner_600SemiBold,
    Commissioner_700Bold,
    Commissioner_800ExtraBold,
  });

  useEffect(() => {
    const unsubFinish = useAuthStore.persist.onFinishHydration(() => setIsReady(true));
    if (useAuthStore.persist.hasHydrated()) {
      setIsReady(true);
    }
    return () => {
      unsubFinish();
    };
  }, []);

  useEffect(() => {
    if (!isReady || !fontsLoaded) return;

    const inAuthGroup =
      segments[0] === '(buyer)' ||
      segments[0] === '(seller)' ||
      segments[0] === '(driver)' ||
      segments[0] === '(admin)';

    const inSelectRole = segments[1] === 'select-role';

    if (!isAuthenticated) {
      if (inAuthGroup) {
        router.replace('/(public)/(tabs)');
      }
    } else {
      if (requiresRoleSelection) {
        if (!inSelectRole) {
          router.replace('/(public)/select-role');
        }
      } else if (activeRole) {
        const inLoginOrRegister =
          segments[1] === 'login' ||
          segments[1] === 'register' ||
          (segments[1] === '(tabs)' && segments[2] === 'login');

        if (inLoginOrRegister) {
          if (activeRole === 'BUYER') {
            router.replace('/(public)/(tabs)');
          } else if (activeRole === 'SELLER') {
            router.replace('/(seller)/(tabs)/dashboard');
          } else if (activeRole === 'DRIVER') {
            router.replace('/(driver)/(tabs)/dashboard');
          } else if (activeRole === 'ADMIN') {
            router.replace('/(admin)/(tabs)/dashboard');
          }
        }
      }
    }
  }, [isAuthenticated, activeRole, requiresRoleSelection, segments, isReady, fontsLoaded]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(public)" />
        <Stack.Screen name="(buyer)" />
        <Stack.Screen name="(seller)" />
        <Stack.Screen name="(driver)" />
        <Stack.Screen name="(admin)" />
      </Stack>
    </ThemeProvider>
  );
}
