import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Store, ShoppingBag, ClipboardList, RefreshCcw, LogOut, Info } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';

interface SummaryData {
  hasStore: boolean;
  storeId: string | null;
  storeName: string | null;
  totalProducts: number;
  pendingOrders: number;
  totalIncome: number;
  note: string;
}

export default function SellerDashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, clearAuth, roles } = useAuthStore();

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchSummary = async () => {
    try {
      setError(null);
      const response = await api.get('/dashboard/seller/summary');
      if (response.data?.success) {
        const data = response.data.data;
        if (!data.hasStore) {
          router.replace('/(seller)/store-setup' as any);
          return;
        }
        setSummary(data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat ringkasan toko.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSummary();
  };

  const handleLogout = async () => {
    Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar dari akun?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await api.post('/auth/logout');
          } catch (err) {
            // Clear auth locally anyway
          } finally {
            clearAuth();
            setLoggingOut(false);
            router.replace('/(public)/(tabs)/login');
          }
        },
      },
    ]);
  };

  if (loading && !refreshing) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText className="mt-3" themeColor="textSecondary">
          Memuat dasbor toko Anda...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <ScrollView
        contentContainerClassName="p-4 pb-5"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {/* Welcome Shop Banner */}
        <Card className="mb-3 p-4">
          <View className="flex-row items-center">
            <View className="w-[60px] h-[60px] rounded-[14px] items-center justify-center" style={{ backgroundColor: `${theme.primary}15` }}>
              <Store size={36} color={theme.primary} />
            </View>
            <View className="ml-4 flex-1">
              <ThemedText type="large" className="text-[18px]">
                Toko: {summary?.storeName}
              </ThemedText>
              <ThemedText type='smallBold' themeColor="textSecondary">
                Pemilik: {user?.name} (@{user?.username})
              </ThemedText>
            </View>
          </View>

          {roles.length > 1 && (
            <Button
              label="Pindah Peran Akun"
              variant="outline"
              size="small"
              leftIcon={<RefreshCcw size={16} color={theme.primary} />}
              onPress={() => router.push('/(public)/select-role')}
              className="mt-3"
            />
          )}
        </Card>

        {/* Dashboard Metrics Grid */}
        <View className="flex-row gap-3 mb-4">
          <Pressable
            className="flex-1"
            onPress={() => router.push('/(seller)/(tabs)/products')}
          >
            <Card className="flex-row items-center p-3">
              <ShoppingBag size={24} color={theme.primary} />
              <View className="ml-3 flex-1">
                <ThemedText type="subtitle" className="text-[20px] font-extrabold leading-6">
                  {summary?.totalProducts ?? 0}
                </ThemedText>
                <ThemedText type='small' className="mt-[2px]" themeColor="textSecondary">
                  Total Produk
                </ThemedText>
              </View>
            </Card>
          </Pressable>

          <Pressable
            className="flex-1"
            onPress={() => router.push('/(seller)/(tabs)/orders')}
          >
            <Card className="flex-row items-center p-3">
              <ClipboardList size={24} color={theme.warning} />
              <View className="ml-3 flex-1">
                <ThemedText type="subtitle" className="text-[20px] font-extrabold leading-6">
                  {summary?.pendingOrders ?? 0}
                </ThemedText>
                <ThemedText type='small' className="mt-[2px]" themeColor="textSecondary">
                  Order Baru
                </ThemedText>
              </View>
            </Card>
          </Pressable>
        </View>

        {/* Sales Revenue */}
        <Card className="flex-row items-center p-3 mb-4">
          <View className="w-12 h-12 rounded-full items-center justify-center">
            <ShoppingBag size={24} color={theme.success} />
          </View>
          <View className="ml-3 flex-1">
            <ThemedText className="font-semibold" >
              Pendapatan Penjualan
            </ThemedText>
            <ThemedText type="subtitle" className="text-[20px] font-extrabold leading-6 mt-1" style={{ color: theme.success }}>
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(summary?.totalIncome ?? 0)}
            </ThemedText>
          </View>
        </Card>

        {/* Store settings quick links */}
        <ThemedText type="smallBold" className="text-[14px] uppercase font-bold tracking-wider mb-2 mt-2">
          Navigasi Toko
        </ThemedText>

        <Button
          label="Kelola Daftar Produk"
          leftIcon={<ShoppingBag size={20} color="#FFFFFF" />}
          onPress={() => router.push('/(seller)/(tabs)/products')}
          className="mb-3 h-[50px]"
        />

        <Button
          label="Lihat Pesanan Masuk"
          leftIcon={<ClipboardList size={20} color="#FFFFFF" />}
          onPress={() => router.push('/(seller)/(tabs)/orders')}
          className="mb-3 h-[50px]"
        />

        {/* Logout */}
        <Button
          label="Keluar Dari Akun"
          variant="danger"
          leftIcon={<LogOut size={20} color="#FFFFFF" />}
          onPress={handleLogout}
          loading={loggingOut}
          className="mt-2 h-[50px]"
        />
      </ScrollView>
    </ThemedView >
  );
}
