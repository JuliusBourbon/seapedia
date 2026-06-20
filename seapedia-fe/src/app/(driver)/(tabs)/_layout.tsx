import { Tabs } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { useState } from 'react';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { DriverNavBar } from '@/components/driver-nav-bar';

export default function DriverTabsLayout() {
  const theme = useTheme();
  const [profileVisible, setProfileVisible] = useState(false);

  return (
    <>
      <ProfileDropdown
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
        role="DRIVER"
      />
      <Tabs
        backBehavior="none"
        tabBar={() => (
          <DriverNavBar onProfilePress={() => setProfileVisible(true)} />
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
          options={{ title: 'Dasbor Kurir' }}
        />
        <Tabs.Screen
          name="jobs"
          options={{ title: 'Pekerjaan Tersedia' }}
        />
        <Tabs.Screen
          name="earnings"
          options={{ title: 'Pendapatan Kurir' }}
        />
      </Tabs>
    </>
  );
}
