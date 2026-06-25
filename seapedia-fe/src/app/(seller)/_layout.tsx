import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
export default function SellerLayout() {
  const theme = useTheme();
  return (
    <Stack screenOptions={{
      headerShown: false,
      headerStyle: {
        backgroundColor: theme.neutral[50],
      },
      headerTintColor: theme.neutral[800],
      headerTitleStyle: {
        fontWeight: '700',
      },
    }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="store-setup" options={{ headerShown: true, title: 'Buka Toko Seapedia' }} />
      <Stack.Screen name="orders/[id]" options={{ headerShown: true, title: 'Rincian Pesanan Masuk' }} />
    </Stack>
  );
}
