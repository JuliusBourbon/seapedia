import { Tabs } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { Home, Compass, Star, LogIn } from 'lucide-react-native';

export default function PublicTabsLayout() {
  const theme = useTheme();

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
          title: 'Masuk Ke Akun',
          tabBarLabel: 'Masuk',
          tabBarIcon: ({ color, size }) => <LogIn size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
