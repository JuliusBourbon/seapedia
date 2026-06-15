import { Tabs, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { Home, Compass, Star, LogIn, User, ShoppingCart } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { Pressable } from 'react-native';

export default function PublicTabsLayout() {
  const theme = useTheme();
  const router = useRouter();
  const { isAuthenticated, activeRole } = useAuthStore();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.backgroundElement,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: theme.backgroundElement,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerRight: () =>
          isAuthenticated && activeRole === 'BUYER' ? (
            <Pressable
              onPress={() => router.push('/(buyer)/cart' as any)}
              style={({ pressed }) => ({
                marginRight: 16,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <ShoppingCart size={24} color={theme.primary} />
            </Pressable>
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pasar Laut',
          tabBarLabel: 'Belanja',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Cari Produk',
          tabBarLabel: 'Cari',
          tabBarIcon: ({ color, size }) => <Compass size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reviews"
        options={{
          title: 'Review Aplikasi',
          tabBarLabel: 'Review',
          tabBarIcon: ({ color, size }) => <Star size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="login"
        options={{
          title: isAuthenticated ? 'Dasbor Saya' : 'Masuk Ke Akun',
          tabBarLabel: isAuthenticated ? 'Dasbor' : 'Masuk',
          tabBarIcon: ({ color, size }) => isAuthenticated ? <User size={size} color={color} /> : <LogIn size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
