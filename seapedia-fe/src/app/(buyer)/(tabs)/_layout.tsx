import { Tabs, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { Home, ShoppingBag, MapPin, BarChart3, ShoppingCart } from 'lucide-react-native';
import { Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BuyerTabsLayout() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.backgroundElement,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          height: Platform.OS === 'android' ? 65 : 60 + insets.bottom,
          paddingBottom: Platform.OS === 'android' ? 10 : Math.max(insets.bottom, 8),
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
        headerRight: () => (
          <Pressable
            onPress={() => router.push('/(buyer)/cart' as any)}
            className="mr-4 active:opacity-70"
          >
            <ShoppingCart size={24} color={theme.primary} />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dasbor Pembeli',
          tabBarLabel: 'Beranda',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pesanan Saya',
          tabBarLabel: 'Pesanan',
          tabBarIcon: ({ color, size }) => <ShoppingBag size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="addresses"
        options={{
          title: 'Alamat Pengiriman',
          tabBarLabel: 'Alamat',
          tabBarIcon: ({ color, size }) => <MapPin size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Laporan Pembelian',
          tabBarLabel: 'Laporan',
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
