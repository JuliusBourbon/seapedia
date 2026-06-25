import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Alert,
  Animated,
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

  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

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

  const renderSkeleton = () => (
    <ThemedView className="flex-1">
      <Animated.View style={{ opacity: pulseAnim }} className="p-4">
        {/* Profile Card Skeleton */}
        <View className="mb-4 rounded-xl overflow-hidden" style={{ backgroundColor: theme.neutral[100], height: 200 }} />
        
        {/* Quick Stats Grid Skeleton */}
        <View className="flex-row gap-3 mb-5">
          <View className="flex-1 h-20 rounded-xl" style={{ backgroundColor: theme.neutral[100] }} />
          <View className="flex-1 h-20 rounded-xl" style={{ backgroundColor: theme.neutral[100] }} />
        </View>
        
        {/* Recent Transactions Skeleton */}
        <View className="mb-5">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.neutral[200] }} />
            <View className="w-40 h-5 rounded-md" style={{ backgroundColor: theme.neutral[200] }} />
          </View>
          <View className="rounded-xl p-4 gap-5" style={{ backgroundColor: theme.neutral[100] }}>
            {[1, 2, 3].map(i => (
              <View key={i} className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-14 h-6 rounded-md" style={{ backgroundColor: theme.neutral[200] }} />
                  <View className="ml-3 gap-2">
                    <View className="w-32 h-4 rounded-md" style={{ backgroundColor: theme.neutral[200] }} />
                    <View className="w-20 h-3 rounded-md" style={{ backgroundColor: theme.neutral[200] }} />
                  </View>
                </View>
                <View className="w-16 h-5 rounded-md" style={{ backgroundColor: theme.neutral[200] }} />
              </View>
            ))}
          </View>
        </View>
      </Animated.View>
    </ThemedView>
  );

  if (loading && !refreshing) {
    return renderSkeleton();
  }

  return (
    <ThemedView className="flex-1">
      <ScrollView
        contentContainerClassName="p-4 pb-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {/* Profile Section */}
        <Card className="mb-4 overflow-hidden border-0 elevation-sm" style={{ backgroundColor: theme.neutral[50] }}>
          <View className="p-4">
            <View className="flex-row items-center">
              <View className="w-14 h-14 rounded-full items-center justify-center border-2" style={{ borderColor: theme.primaryShades[200], backgroundColor: theme.primaryShades[100] }}>
                <User size={26} color={theme.primary} />
              </View>
              <View className="ml-4 flex-1">
                <ThemedText type="smallBold" className="text-xl font-extrabold" style={{ color: theme.neutral[900] }}>
                  {user?.name}
                </ThemedText>
                <ThemedText className="text-[13px] mt-0.5" style={{ color: theme.neutral[500] }}>
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
                className="mt-4"
              />
            )}
          </View>

          {/* Wallet Section (Attached to Profile Card) */}
          <View className="p-4 border-t" style={{ backgroundColor: '#ffffff', borderTopColor: theme.neutral[200] }}>
            <View className="flex-row justify-between items-center">
              <View>
                <View className="flex-row items-center mb-1">
                  <Wallet size={14} color={theme.neutral[500]} />
                  <ThemedText className="text-[12px] font-semibold tracking-wider ml-1.5" style={{ color: theme.neutral[500] }}>
                    SALDO DOMPET
                  </ThemedText>
                </View>
                <ThemedText className="text-3xl font-black" style={{ color: theme.primary }}>
                  {formattedBalance}
                </ThemedText>
              </View>
            </View>
            <Button
              label="Top-Up Wallet"
              onPress={() => router.push('/(buyer)/wallet-history')}
              className="mt-4 h-[44px]"
            />
          </View>
        </Card>

        {/* Quick Stats Grid */}
        <View className="grid grid-cols-2 gap-3 mb-5">
          <Pressable
            className="flex-1 active:opacity-70"
            onPress={() => router.push('/(buyer)/(tabs)/orders')}
          >
            <Card className="flex-row items-center p-4 border-0 elevation-sm" style={{ backgroundColor: '#ffffff' }}>
              <View className="w-12 h-12 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: theme.primaryShades[100] }}>
                <ShoppingBag size={24} color={theme.primary} />
              </View>
              <View className="flex-1">
                <ThemedText type="subtitle" className="text-xl font-bold" style={{ color: theme.neutral[900] }}>
                  {summary?.activeOrders ?? 0}
                </ThemedText>
                <ThemedText className="text-xs font-medium mt-0.5" style={{ color: theme.neutral[500] }}>
                  Pesanan Aktif
                </ThemedText>
              </View>
            </Card>
          </Pressable>

          {/* <Pressable
            className="flex-1 active:opacity-70"
            onPress={() => router.push('/(buyer)/(tabs)/addresses')}
          >
            <Card className="flex-row items-center p-4 border-0 elevation-sm" style={{ backgroundColor: '#ffffff' }}>
              <View className="w-12 h-12 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: theme.primaryShades[100] }}>
                <MapPin size={24} color={theme.secondary} />
              </View>
              <View className="flex-1">
                <ThemedText type="subtitle" className="text-xl font-bold" style={{ color: theme.neutral[900] }}>
                  Alamat
                </ThemedText>
                <ThemedText className="text-xs font-medium mt-0.5" style={{ color: theme.neutral[500] }}>
                  Buku Alamat
                </ThemedText>
              </View>
            </Card>
          </Pressable> */}
        </View>

        {/* Recent Transactions List */}
        <View className="mb-5">
          <View className="flex-row items-center gap-2">
            <View className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.primary }} />
            <ThemedText className="text-base font-bold">Transaksi Terakhir</ThemedText>
          </View>

          <Card className="overflow-hidden border-0 elevation-sm mt-5" style={{ backgroundColor: '#ffffff' }}>
            {summary && summary.recentTransactions.length > 0 ? (
              summary.recentTransactions.map((tx, index) => {
                const txFormatted = new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                }).format(tx.amount);

                const isPositive = tx.type === 'TOPUP' || tx.type === 'REFUND';

                return (
                  <View
                    key={tx.id}
                    className={`flex-row justify-between items-center p-4 ${index !== summary.recentTransactions.length - 1 ? 'border-b' : ''}`}
                    style={{ borderBottomColor: theme.neutral[100] }}
                  >
                    <View className="flex-row items-center flex-1">
                      {getTxTypeBadge(tx.type)}
                      <View className="ml-3 flex-1 pr-2">
                        <ThemedText type="smallBold" numberOfLines={1} style={{ color: theme.neutral[900] }}>
                          {tx.description || 'Transaksi Dompet'}
                        </ThemedText>
                        <ThemedText className="text-[12px] mt-1" style={{ color: theme.neutral[500] }}>
                          {new Date(tx.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText className={`text-[15px] font-black ${isPositive ? 'text-success' : 'text-danger'}`}>
                      {isPositive ? '+' : '-'} {txFormatted}
                    </ThemedText>
                  </View>
                );
              })
            ) : (
              <View className="items-center justify-center py-8">
                <ThemedText style={{ color: theme.neutral[500] }} className="font-medium">
                  Belum ada transaksi dompet.
                </ThemedText>
              </View>
            )}
          </Card>
        </View>

        {/* Logout Button */}
        <Button
          label="Keluar Dari Akun"
          variant="danger"
          leftIcon={<LogOut size={20} color="#FFFFFF" />}
          onPress={handleLogout}
          loading={loggingOut}
          className="h-[48px]"
        />
      </ScrollView>
    </ThemedView>
  );
}
