import { Stack } from 'expo-router';

export default function BuyerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="cart" options={{ headerShown: true, title: 'Keranjang Belanja' }} />
      <Stack.Screen name="checkout" options={{ headerShown: true, title: 'Pemeriksaan (Checkout)' }} />
      <Stack.Screen name="orders/[id]" options={{ headerShown: true, title: 'Rincian Pesanan' }} />
      <Stack.Screen name="wallet-history" options={{ headerShown: true, title: 'Dompet SEAPEDIA' }} />
    </Stack>
  );
}
