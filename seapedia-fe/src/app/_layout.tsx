import { DarkTheme, DefaultTheme, ThemeProvider, Stack, useRouter, useSegments } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { AnimatedSplashOverlay } from '@/components/animated-icon';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, activeRole, requiresRoleSelection } = useAuthStore();
  const segments = useSegments() as any;
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  // Monitor Zustand hydration from secure storage
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
    if (!isReady) return;

    const inAuthGroup =
      segments[0] === '(buyer)' ||
      segments[0] === '(seller)' ||
      segments[0] === '(driver)' ||
      segments[0] === '(admin)';

    const inSelectRole = segments[1] === 'select-role';

    if (!isAuthenticated) {
      // If user is guest, and tries to visit auth folders, redirect them to home
      if (inAuthGroup) {
        router.replace('/(public)/(tabs)');
      }
    } else {
      // User is authenticated
      if (requiresRoleSelection) {
        // Multi-role selection required, send them to select-role page
        if (!inSelectRole) {
          router.replace('/(public)/select-role');
        }
      } else if (activeRole) {
        // activeRole is selected. Redirect to dashboard if trying to access public main tab screens or select-role
        const inGuestTabs = segments[0] === '(public)' && segments[1] === '(tabs)';
        const inLoginOrRegister = segments[1] === 'login' || segments[1] === 'register';

        if (inGuestTabs || inLoginOrRegister || inSelectRole) {
          if (activeRole === 'BUYER') {
            router.replace('/(buyer)/(tabs)/dashboard' as any);
          } else if (activeRole === 'SELLER') {
            router.replace('/(seller)/dashboard' as any);
          } else if (activeRole === 'DRIVER') {
            router.replace('/(driver)/dashboard' as any);
          } else if (activeRole === 'ADMIN') {
            router.replace('/(admin)/dashboard' as any);
          }
        }
      }
    }
  }, [isAuthenticated, activeRole, requiresRoleSelection, segments, isReady]);

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
