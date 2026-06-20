import { Stack } from 'expo-router';

export default function PublicLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="register" options={{ headerShown: true, title: 'Daftar Akun Baru' }} />
      <Stack.Screen name="select-role" options={{ headerShown: false }} />
      <Stack.Screen name="product/[id]" options={{ headerShown: true, title: 'Detail Produk' }} />
      <Stack.Screen name="store/[id]" options={{ headerShown: true, title: 'Detail Toko' }} />
    </Stack>
  );
}
