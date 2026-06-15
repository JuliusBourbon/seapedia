import React, { useState } from 'react';
import { StyleSheet, View, Alert, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ShoppingCart, Store, Truck, ArrowRight, UserCheck } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
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
          variant={isSelected ? 'glass' : 'default'}
          style={[
            styles.roleCard,
            {
              borderColor: isSelected ? theme.primary : theme.border,
              backgroundColor: isSelected ? theme.primary : theme.backgroundElement,
            },
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : `${theme.primary}15` }]}>
            {details.icon}
          </View>
          <View style={styles.cardContent}>
            <ThemedText
              type="smallBold"
              style={[styles.cardTitle, { color: isSelected ? '#FFFFFF' : theme.text }]}
            >
              {details.title}
            </ThemedText>
            <ThemedText
              style={[styles.cardDescription, { color: isSelected ? 'rgba(255, 255, 255, 0.8)' : theme.textSecondary }]}
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
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            Pilih Peran Aktif
          </ThemedText>
          <ThemedText style={styles.subtitle} themeColor="textSecondary">
            Akun Anda terdaftar dengan beberapa peran. Silakan pilih satu untuk masuk ke panel kerja Anda.
          </ThemedText>
        </View>

        <View style={styles.listContainer}>
          {roles.map((role) => renderRoleCard(role))}
        </View>

        <View style={styles.actions}>
          <Button
            label="Masuk Ke Panel Kerja"
            onPress={handleRoleSelect}
            loading={loading}
            disabled={!selectedRole}
            style={styles.submitButton}
          />
          
          <Pressable
            onPress={() => {
              clearAuth();
              router.replace('/(public)/(tabs)/login');
            }}
            style={styles.cancelButton}
          >
            <ThemedText style={{ color: theme.textSecondary, fontWeight: '600' }}>
              Batalkan & Keluar
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.five,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.five,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: Spacing.one,
  },
  listContainer: {
    gap: Spacing.three,
    marginBottom: Spacing.five,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderWidth: 1.5,
    borderRadius: 16,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: Spacing.three,
    paddingRight: Spacing.one,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
  },
  submitButton: {
    width: '100%',
    height: 52,
  },
  cancelButton: {
    padding: Spacing.three,
    marginTop: Spacing.two,
  },
});
