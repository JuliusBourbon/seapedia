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
        backBehavior="none"
        tabBar={() => (
          <BuyerNavBar onProfilePress={() => setProfileVisible(true)} />
        )}
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.neutral[50],
            borderBottomWidth: 1,
            borderBottomColor: theme.neutral[50],
          },
          headerTintColor: theme.neutral[800],
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
