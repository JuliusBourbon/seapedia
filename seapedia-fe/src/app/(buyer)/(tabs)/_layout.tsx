import { Tabs } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { useState } from 'react';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { BuyerNavBar } from '@/components/buyer-nav-bar';

export default function BuyerTabsLayout() {
  const theme = useTheme();
  const [profileVisible, setProfileVisible] = useState(false);

  return (
    <>
      <ProfileDropdown
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
      />
      <Tabs
        // "none": Tombol back hardware tidak akan ditangkap oleh Tab navigator,
        // sehingga langsung diteruskan ke Stack navigator (kembali ke halaman sebelumnya / public).
        backBehavior="none"
        tabBar={() => (
          <BuyerNavBar onProfilePress={() => setProfileVisible(true)} />
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
          options={{ title: 'Dasbor Pembeli' }}
        />
        <Tabs.Screen
          name="orders"
          options={{ title: 'Pesanan Saya' }}
        />
        <Tabs.Screen
          name="addresses"
          options={{ title: 'Alamat Pengiriman' }}
        />
        <Tabs.Screen
          name="reports"
          options={{ title: 'Laporan Pembelian' }}
        />
      </Tabs>
    </>
  );
}
