import { Stack } from 'expo-router';

export default function SellerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="store-setup" options={{ headerShown: true, title: 'Buka Toko Seapedia' }} />
      <Stack.Screen name="orders/[id]" options={{ headerShown: true, title: 'Rincian Pesanan Masuk' }} />
    </Stack>
  );
}
