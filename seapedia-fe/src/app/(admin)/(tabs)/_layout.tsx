import { Tabs } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { useState } from 'react';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { AdminNavBar } from '@/components/admin-nav-bar';

export default function AdminTabsLayout() {
  const theme = useTheme();
  const [profileVisible, setProfileVisible] = useState(false);

  return (
    <>
      <ProfileDropdown
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
        role="ADMIN"
      />
      <Tabs
        backBehavior="none"
        tabBar={() => (
          <AdminNavBar onProfilePress={() => setProfileVisible(true)} />
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
          options={{ title: 'Dasbor Admin' }}
        />
        <Tabs.Screen
          name="discount"
          options={{ title: 'Voucher' }}
        />
        <Tabs.Screen
          name="system"
          options={{ title: 'Sistem & Simulasi' }}
        />
      </Tabs>
    </>
  );
}
