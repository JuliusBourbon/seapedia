import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';

export default function PublicLayout() {
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
      <Stack.Screen name="register" options={{ headerShown: true, title: 'Daftar Akun Baru' }} />
      <Stack.Screen name="select-role" options={{ headerShown: false }} />
      <Stack.Screen name="product/[id]" options={{ headerShown: true, title: 'Detail Produk' }} />
      <Stack.Screen name="store/[id]" options={{ headerShown: true, title: 'Detail Toko' }} />
    </Stack>
  );
}
