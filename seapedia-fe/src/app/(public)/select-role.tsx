import React, { useState } from 'react';
import { View, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ShoppingCart, Store, Truck, ArrowRight, UserCheck } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore, UserRole } from '@/store/useAuthStore';
import api from '@/services/api';

export default function SelectRoleScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { roles, setAuth, setUser, clearAuth } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = async () => {
    if (!selectedRole) {
      Alert.alert('Perhatian', 'Silakan pilih peran terlebih dahulu.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/select-role', { role: selectedRole });

      if (response.data?.success) {
        const { token, activeRole, roles: updatedRoles } = response.data.data;

        // Save final credentials
        setAuth(token, activeRole, updatedRoles);

        // Fetch user profile
        try {
          const profileResponse = await api.get('/auth/me');
          if (profileResponse.data?.success) {
            setUser(profileResponse.data.data);
          }
        } catch (profileErr) {
          // Profile fetch failed but auth succeeded
        }

        // Navigate based on selected role
        if (activeRole === 'BUYER') {
          router.replace('/(public)/(tabs)');
        } else if (activeRole === 'SELLER') {
          router.replace('/(seller)/(tabs)/dashboard');
        } else if (activeRole === 'DRIVER') {
          router.replace('/(driver)/(tabs)/dashboard');
        } else if (activeRole === 'ADMIN') {
          router.replace('/(admin)/(tabs)/dashboard');
        }
      }
    } catch (err: any) {
      Alert.alert(
        'Gagal Memilih Peran',
        err.response?.data?.message || 'Terjadi kesalahan sistem. Silakan coba lagi.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getRoleDetails = (role: UserRole) => {
    switch (role) {
      case 'BUYER':
        return {
          title: 'Pembeli (Buyer)',
          description: 'Belanja hasil laut segar dan kelola pesanan Anda.',
          icon: <ShoppingCart size={28} color={selectedRole === 'BUYER' ? '#FFFFFF' : theme.primary} />,
        };
      case 'SELLER':
        return {
          title: 'Penjual (Seller)',
          description: 'Kelola toko Anda, jual produk maritim, dan pantau penghasilan.',
          icon: <Store size={28} color={selectedRole === 'SELLER' ? '#FFFFFF' : theme.primary} />,
        };
      case 'DRIVER':
        return {
          title: 'Pengirim (Driver)',
          description: 'Ambil pekerjaan pengiriman laut & raih penghasilan tambahan.',
          icon: <Truck size={28} color={selectedRole === 'DRIVER' ? '#FFFFFF' : theme.primary} />,
        };
      case 'ADMIN':
        return {
          title: 'Administrator',
          description: 'Pantau sistem, kelola voucher diskon, dan overdue simulation.',
          icon: <UserCheck size={28} color={selectedRole === 'ADMIN' ? '#FFFFFF' : theme.primary} />,
        };
    }
  };

  const renderRoleCard = (role: UserRole) => {
    const details = getRoleDetails(role);
    const isSelected = selectedRole === role;

    return (
      <Pressable key={role} onPress={() => setSelectedRole(role)}>
        <Card
          className={`flex-row items-center p-4 border-[1.5px] rounded-2xl ${isSelected ? 'border-primary bg-primary' : 'border-border'}`}
        >
          <View
            className="w-[52px] h-[52px] rounded-xl items-center justify-center"
            style={{ backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : `${theme.primary}15` }}
          >
            {details.icon}
          </View>
          <View className="flex-1 ml-4 pr-1">
            <ThemedText
              type="smallBold"
              className={`text-base font-bold ${isSelected ? 'text-white' : 'text-text'}`}
            >
              {details.title}
            </ThemedText>
            <ThemedText
              className={`text-xs mt-[2px] ${isSelected ? 'text-white/80' : 'text-textSecondary'}`}
            >
              {details.description}
            </ThemedText>
          </View>
          {isSelected && <ArrowRight size={20} color="#FFFFFF" />}
        </Card>
      </Pressable>
    );
  };

  return (
    <ThemedView className="flex-1 justify-center">
      <View className="px-8">
        <View className="items-center mb-8">
          <ThemedText type="subtitle" className="text-[26px] font-extrabold text-center">
            Pilih Peran Aktif
          </ThemedText>
          <ThemedText className="text-sm text-center mt-1" themeColor="textSecondary">
            Akun Anda terdaftar dengan beberapa peran. Silakan pilih satu untuk masuk ke panel kerja Anda.
          </ThemedText>
        </View>

        <View className="gap-4 mb-8">
          {roles.map((role) => renderRoleCard(role))}
        </View>

        <View className="w-full items-center">
          <Button
            label="Masuk Ke Panel Kerja"
            onPress={handleRoleSelect}
            loading={loading}
            disabled={!selectedRole}
            className="w-full h-[52px]"
          />

          <Pressable
            onPress={() => {
              clearAuth();
              router.replace('/(public)/(tabs)/login');
            }}
            className="p-4 mt-2"
          >
            <ThemedText className="text-textSecondary font-semibold">
              Batalkan & Keluar
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}
