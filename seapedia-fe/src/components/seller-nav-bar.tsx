import React from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Home, Compass, Star, User, Search } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SellerNavBarProps {
  onProfilePress: () => void;
}

export function SellerNavBar({ onProfilePress }: SellerNavBarProps) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const tabs = [
    {
      label: 'Belanja',
      Icon: Home,
      onPress: () => router.replace('/(public)/(tabs)' as any),
    },
    {
      label: 'Cari',
      Icon: Search,
      onPress: () => router.replace('/(public)/(tabs)/explore' as any),
    },
    {
      label: 'Review',
      Icon: Star,
      onPress: () => router.replace('/(public)/(tabs)/reviews' as any),
    },
    {
      label: 'Profil',
      Icon: User,
      onPress: onProfilePress,
      active: true,
    },
  ];

  return (
    <View
      className="flex-row border-t"
      style={{
        backgroundColor: theme.backgroundElement,
        borderTopColor: theme.border,
        height: 60 + insets.bottom,
        paddingBottom: insets.bottom,
        paddingTop: 8,
      }}
    >
      {tabs.map((tab, index) => {
        const color = tab.active ? theme.primary : theme.textSecondary;
        return (
          <Pressable
            key={index}
            onPress={tab.onPress}
            className="flex-1 items-center justify-center active:opacity-60"
          >
            <tab.Icon size={24} color={color} />
            <ThemedText
              className="text-[10px] mt-0.5 font-medium"
              style={{ color }}
            >
              {tab.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
