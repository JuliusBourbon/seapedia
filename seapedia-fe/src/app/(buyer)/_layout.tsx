import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';

export default function BuyerLayout() {
  const theme = useTheme();
  return (
    <Stack screenOptions={{
      headerStyle: {
        backgroundColor: theme.neutral[50],
      },
      headerTintColor: theme.neutral[800],
      headerTitleStyle: {
        fontWeight: '700',
      },
    }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="cart" options={{ headerShown: true, title: 'Keranjang Belanja' }} />
      <Stack.Screen name="checkout" options={{ headerShown: true, title: 'Checkout' }} />
      <Stack.Screen name="orders/[id]" options={{ headerShown: true, title: 'Rincian Pesanan' }} />
      <Stack.Screen name="wallet-history" options={{ headerShown: true, title: 'Dompet SEAPEDIA' }} />
    </Stack>
  );
}
