import { Tabs } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { useState } from 'react';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { SellerNavBar } from '@/components/seller-nav-bar';

export default function SellerTabsLayout() {
  const theme = useTheme();
  const [profileVisible, setProfileVisible] = useState(false);

  return (
    <>
      <ProfileDropdown
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
        role="SELLER"
      />
      <Tabs
        // "none": Tombol back hardware tidak ditangkap Tab navigator,
        // langsung diteruskan ke Stack (kembali ke halaman sebelumnya / public).
        backBehavior="none"
        tabBar={() => (
          <SellerNavBar onProfilePress={() => setProfileVisible(true)} />
        )}
        screenOptions={{
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
          name="dashboard"
          options={{ title: 'Dasbor Toko' }}
        />
        <Tabs.Screen
          name="products"
          options={{ title: 'Kelola Produk' }}
        />
        <Tabs.Screen
          name="orders"
          options={{ title: 'Pesanan Masuk' }}
        />
        <Tabs.Screen
          name="reports"
          options={{ title: 'Laporan Penjualan' }}
        />
      </Tabs>
    </>
  );
}
