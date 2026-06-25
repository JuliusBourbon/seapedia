import { Color, Tabs, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { Home, Compass, Star, LogIn, User, ShoppingCart, Search } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { ProfileDropdown } from '@/components/profile-dropdown';

export default function PublicTabsLayout() {
  const theme = useTheme();
  const router = useRouter();
  const { isAuthenticated, activeRole } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [profileDropdownVisible, setProfileDropdownVisible] = useState(false);

  return (
    <>
      <ProfileDropdown
        visible={profileDropdownVisible}
        onClose={() => setProfileDropdownVisible(false)}
        role={activeRole ?? undefined}
      />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.neutral[500],
          tabBarStyle: {
            backgroundColor: theme.neutral[50],
            borderTopWidth: 1,
            borderTopColor: theme.neutral[50],
            height: 60 + insets.bottom,
            paddingBottom: 8 + insets.bottom,
            paddingTop: 8,
          },
          headerStyle: {
            backgroundColor: theme.neutral[50],
            borderBottomWidth: 1,
            borderBottomColor: theme.neutral[50],
          },
          headerTintColor: theme.neutral[900],
          headerTitleStyle: {
            fontWeight: '700',
          },
          headerRight: () =>
            isAuthenticated && activeRole === 'BUYER' ? (
              <Pressable
                onPress={() => router.push('/(buyer)/cart' as any)}
                className="mr-4 active:opacity-70"
              >
                <ShoppingCart size={24} color={theme.primary} />
              </Pressable>
            ) : null,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarLabel: 'Belanja',
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Cari Produk',
            tabBarLabel: 'Cari',
            tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
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
            title: isAuthenticated ? 'Profil Saya' : 'Masuk Ke Akun',
            tabBarLabel: isAuthenticated ? 'Profil' : 'Masuk',
            tabBarIcon: ({ color, size }) =>
              isAuthenticated ? (
                <User size={size} color={color} />
              ) : (
                <LogIn size={size} color={color} />
              ),
            tabBarButton: isAuthenticated
              ? (props) => (
                <Pressable
                  {...(props as any)}
                  onPress={() => setProfileDropdownVisible(true)}
                />
              )
              : undefined,
          }}
        />
      </Tabs>
    </>
  );
}
