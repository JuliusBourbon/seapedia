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
import { Wallet, ShoppingBag, MapPin, BarChart3, LogOut, RefreshCcw, User } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';

interface Transaction {
  id: string;
  type: 'TOPUP' | 'PAYMENT' | 'REFUND';
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
}

interface SummaryData {
  walletBalance: number;
  activeOrders: number;
  recentTransactions: Transaction[];
}

export default function BuyerDashboardScreen() {
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
      const response = await api.get('/dashboard/buyer/summary');
      if (response.data?.success) {
        setSummary(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat ringkasan dasbor.');
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
            // Silently ignore logout API errors and clear auth locally anyway
          } finally {
            clearAuth();
            setLoggingOut(false);
            router.replace('/(public)/(tabs)/login');
          }
        },
      },
    ]);
  };

  const formattedBalance = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(summary?.walletBalance ?? 0);

  const getTxTypeBadge = (type: string) => {
    switch (type) {
      case 'TOPUP':
        return <Badge label="Top Up" variant="success" />;
      case 'PAYMENT':
        return <Badge label="Bayar" variant="danger" />;
      case 'REFUND':
        return <Badge label="Refund" variant="primary" />;
      default:
        return <Badge label={type} variant="neutral" />;
    }
  };

  if (loading && !refreshing) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText className="mt-3" themeColor="textSecondary">
          Mempersiapkan dasbor Anda...
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
        {/* Profile Card & Welcoming */}
        <Card className="mb-3 p-4">
          <View className="flex-row items-center">
            <View className="w-[60px] h-[60px] rounded-full items-center justify-center" style={{ backgroundColor: `${theme.primary}15` }}>
              <User size={32} color={theme.primary} />
            </View>
            <View className="ml-4 flex-1">
              <ThemedText type="smallBold" className="text-lg font-extrabold">
                {user?.name}
              </ThemedText>
              <ThemedText className="text-[13px] mt-[2px]" themeColor="textSecondary">
                @{user?.username} • Pembeli
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
              className="mt-2"
            />
          )}
        </Card>

        {/* Wallet balance display */}
        <Card className="mb-3 p-4">
          <View className="flex-row justify-between items-center">
            <View>
              <ThemedText className="text-[12px] font-semibold uppercase tracking-wider" themeColor="textSecondary">
                Saldo Dompet SEAPEDIA
              </ThemedText>
              <ThemedText className="text-2xl font-black text-[#0D9488] mt-1">
                {formattedBalance}
              </ThemedText>
            </View>
            <View className="w-[52px] h-[52px] rounded-xl items-center justify-center" style={{ backgroundColor: `${theme.primary}20` }}>
              <Wallet size={28} color={theme.primary} />
            </View>
          </View>
          <Button
            label="Kelola Dompet & Top-Up"
            onPress={() => router.push('/(buyer)/wallet-history')}
            className="mt-3 h-11"
          />
        </Card>

        {/* Quick Stats Grid */}
        <View className="flex-row gap-3 mb-4">
          <Pressable
            className="flex-1"
            onPress={() => router.push('/(buyer)/(tabs)/orders')}
          >
            <Card className="flex-row items-center p-3">
              <ShoppingBag size={24} color={theme.primary} />
              <View className="ml-3 flex-1">
                <ThemedText type="subtitle" className="text-xl font-extrabold leading-6">
                  {summary?.activeOrders ?? 0}
                </ThemedText>
                <ThemedText className="text-xs mt-[2px]" themeColor="textSecondary">
                  Pesanan Aktif
                </ThemedText>
              </View>
            </Card>
          </Pressable>

          <Pressable
            className="flex-1"
            onPress={() => router.push('/(buyer)/(tabs)/addresses')}
          >
            <Card className="flex-row items-center p-3">
              <MapPin size={24} color={theme.secondary} />
              <View className="ml-3 flex-1">
                <ThemedText type="smallBold" className="text-[18px]">
                  Kelola
                </ThemedText>
                <ThemedText className="text-xs mt-[2px]" themeColor="textSecondary">
                  Buku Alamat
                </ThemedText>
              </View>
            </Card>
          </Pressable>
        </View>

        {/* Recent Transactions List */}
        <View className="mb-4">
          <ThemedText type="smallBold" className="text-base font-bold mb-3">
            Transaksi Terakhir
          </ThemedText>
          {summary && summary.recentTransactions.length > 0 ? (
            summary.recentTransactions.map((tx) => {
              const txFormatted = new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
              }).format(tx.amount);
              
              const isPositive = tx.type === 'TOPUP' || tx.type === 'REFUND';

              return (
                <Card key={tx.id} className="flex-row justify-between items-center mb-2 p-3">
                  <View className="flex-row items-center flex-1">
                    {getTxTypeBadge(tx.type)}
                    <View className="ml-3 flex-1 pr-2">
                      <ThemedText type="smallBold" numberOfLines={1}>
                        {tx.description || 'Transaksi Dompet'}
                      </ThemedText>
                      <ThemedText className="text-[11px] mt-[2px]" themeColor="textSecondary">
                        {new Date(tx.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText className={`text-[14px] font-extrabold ${isPositive ? 'text-success' : 'text-danger'}`}>
                    {isPositive ? '+' : '-'} {txFormatted}
                  </ThemedText>
                </Card>
              );
            })
          ) : (
            <Card className="items-center justify-center py-4">
              <ThemedText themeColor="textSecondary">
                Belum ada transaksi dompet.
              </ThemedText>
            </Card>
          )}
        </View>

        {/* Quick Action Marketplace Catalog Link */}
        <Button
          label="Mulai Belanja di Pasar Laut"
          leftIcon={<ShoppingBag size={20} color="#FFFFFF" />}
          onPress={() => router.push('/(public)/(tabs)')}
          className="mb-3 h-[50px]"
        />

        {/* Logout Button */}
        <Button
          label="Keluar Dari Akun"
          variant="danger"
          leftIcon={<LogOut size={20} color="#FFFFFF" />}
          onPress={handleLogout}
          loading={loggingOut}
          className="h-[50px]"
        />
      </ScrollView>
    </ThemedView>
  );
}
