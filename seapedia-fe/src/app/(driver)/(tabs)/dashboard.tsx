import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Truck, CheckCircle2, Wallet, RefreshCcw, LogOut, Info, MapPin, Phone, User, Package, Calendar } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { DELIVERY_METHODS, ORDER_STATUS_LABELS } from '@/constants/config';
import api from '@/services/api';

interface SummaryData {
  hasActiveJob: boolean;
  activeJobId: string | null;
  completedJobs: number;
  totalEarnings: number;
}

interface ActiveJob {
  id: string;
  orderId: string;
  status: string;
  earning: number;
  order: {
    id: string;
    deliveryMethod: 'INSTANT' | 'NEXT_DAY' | 'REGULAR';
    total: number;
    status: string;
    store: {
      id: string;
      name: string;
    };
    address: {
      label: string;
      recipientName: string;
      phoneNumber: string;
      fullAddress: string;
      city: string;
      postalCode: string;
    };
    items?: {
      id: string;
      productName: string;
      quantity: number;
      price: number;
      subtotal: number;
    }[];
  };
}

export default function DriverDashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, clearAuth, roles } = useAuthStore();

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [activeJob, setActiveJob] = useState<ActiveJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      // Fetch summary
      const summaryRes = await api.get('/dashboard/driver/summary');
      if (summaryRes.data?.success) {
        const sumData = summaryRes.data.data;
        setSummary(sumData);

        if (sumData.hasActiveJob) {
          // Fetch active job details
          const activeJobRes = await api.get('/driver/jobs/active');
          if (activeJobRes.data?.success) {
            setActiveJob(activeJobRes.data.data);
          }
        } else {
          setActiveJob(null);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data dasbor kurir.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCompleteJob = (jobId: string) => {
    Alert.alert(
      'Konfirmasi Selesai',
      'Apakah Anda yakin telah mengirimkan pesanan ke alamat pembeli dan ingin menyelesaikan pekerjaan ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Selesai',
          onPress: async () => {
            setCompleting(true);
            try {
              const res = await api.post(`/driver/jobs/${jobId}/complete`);
              if (res.data?.success) {
                Alert.alert('Sukses', 'Pekerjaan pengantaran berhasil diselesaikan! Pendapatan telah ditambahkan ke dompet Anda.');
                fetchData();
              }
            } catch (err: any) {
              Alert.alert('Gagal', err.response?.data?.message || 'Terjadi kesalahan saat menyelesaikan pekerjaan.');
            } finally {
              setCompleting(false);
            }
          },
        },
      ]
    );
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
            // Local clear
          } finally {
            clearAuth();
            setLoggingOut(false);
            router.replace('/(public)/(tabs)/login');
          }
        },
      },
    ]);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  if (loading && !refreshing) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText className="mt-3" themeColor="textSecondary">
          Memuat dasbor kurir Anda...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <ScrollView
        contentContainerClassName="p-4 pb-5 gap-3"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {/* Profile Info Banner */}
        <Card className="p-4 mb-2">
          <View className="flex-row items-center">
            <View className="w-[60px] h-[60px] rounded-[14px] items-center justify-center" style={{ backgroundColor: `${theme.primary}15` }}>
              <User size={36} color={theme.primary} />
            </View>
            <View className="ml-4 flex-1">
              <ThemedText type="large" className="font-semibold">
                {user?.name}
              </ThemedText>
              <ThemedText className="text-[13px]" themeColor="textSecondary">
                Kurir Mitra (@{user?.username})
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

        {/* Stats Grid */}
        <View className="flex-row gap-3 mb-2">
          <Card className="flex-1 p-4 items-start gap-1">
            <Wallet size={24} color={theme.primary} />
            <ThemedText className="mt-1" themeColor="textSecondary">
              Total Pendapatan
            </ThemedText>
            <ThemedText type="extraLarge" className="font-extrabold">
              {formatCurrency(summary?.totalEarnings ?? 0)}
            </ThemedText>
          </Card>

          <Card className="flex-1 p-4 items-start gap-1">
            <CheckCircle2 size={24} color={theme.success} />
            <ThemedText className=" mt-1" themeColor="textSecondary">
              Order Selesai
            </ThemedText>
            <ThemedText type="extraLarge" className="font-extrabold">
              {summary?.completedJobs ?? 0}
            </ThemedText>
          </Card>
        </View>

        {/* Active Job Section */}
        <ThemedText type="smallBold" className=" uppercase font-bold tracking-wider mb-1 mt-2">
          Tugas Pengantaran Aktif
        </ThemedText>

        {activeJob ? (
          <Card className="p-4">
            <View className="flex-row justify-between items-center">
              <Badge label="Pekerjaan Berlangsung" variant="primary" />
              <ThemedText className="font-extrabold text-[#0D9488]">
                Earning: {formatCurrency(activeJob.earning)}
              </ThemedText>
            </View>

            <View className="h-[1.5px] my-3" style={{ backgroundColor: theme.border }} />

            {/* Pickup Location */}
            <View className="flex-row items-start gap-3">
              <View className="w-3 h-3 rounded-full mt-1" style={{ backgroundColor: theme.primary }} />
              <View className="flex-1 gap-[2px]">
                <ThemedText className="uppercase font-semibold" themeColor="textSecondary">
                  Lokasi Penjemputan (Toko)
                </ThemedText>
                <ThemedText className='font-semibold'>
                  {activeJob.order.store.name}
                </ThemedText>
              </View>
            </View>

            {/* Connecting line */}
            <View className="w-[2px] h-[25px] ml-[5px] my-[2px]" style={{ backgroundColor: theme.border }} />

            {/* Destination Location */}
            <View className="flex-row items-start gap-3">
              <View className="w-3 h-3 rounded-full mt-1" style={{ backgroundColor: theme.warning }} />
              <View className="flex-1 gap-[2px]">
                <ThemedText className="uppercase font-semibold" themeColor="textSecondary">
                  Lokasi Pengantaran (Pembeli)
                </ThemedText>
                <Badge label={DELIVERY_METHODS[activeJob.order.deliveryMethod]?.label || activeJob.order.deliveryMethod} variant="neutral" />
                <ThemedText className="font-semibold">
                  {activeJob.order.address.recipientName}
                </ThemedText>
                <ThemedText className="">
                  {activeJob.order.address.phoneNumber}
                </ThemedText>
                <ThemedText className="mt-[2px]">
                  {activeJob.order.address.fullAddress}, {activeJob.order.address.city}, {activeJob.order.address.postalCode}
                </ThemedText>
              </View>
            </View>

            <View className="h-[1.5px] my-3" style={{ backgroundColor: theme.border }} />

            {/* Items Summary */}
            {activeJob.order.items && activeJob.order.items.length > 0 && (
              <View className="">
                <ThemedText className="font-semibold mb-1">
                  Daftar Barang:
                </ThemedText>
                {activeJob.order.items.map((item) => (
                  <View key={item.id} className="flex-row items-center gap-2 mt-1">
                    <Package size={14} color={theme.textSecondary} />
                    <ThemedText className="">
                      {item.productName} (x{item.quantity})
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}

            <View className="h-[1.5px] my-3" style={{ backgroundColor: theme.border }} />

            <Button
              label="Selesaikan Pengantaran"
              variant="primary"
              size="large"
              loading={completing}
              leftIcon={<CheckCircle2 size={20} color="#FFFFFF" />}
              onPress={() => handleCompleteJob(activeJob.id)}
              className="h-[50px]"
            />

            <Button
              label="Lihat Rincian Rute"
              variant="outline"
              size="small"
              onPress={() => router.push(`/(driver)/jobs/${activeJob.id}` as any)}
              className="mt-2"
            />
          </Card>
        ) : (
          <Card className="p-5 items-center justify-center gap-2">
            <Info size={36} color={theme.placeholder} />
            <ThemedText className="text-[14px] text-center mt-1 leading-[20px]" themeColor="textSecondary">
              Anda tidak memiliki pekerjaan pengantaran aktif saat ini.
            </ThemedText>
            <Button
              label="Cari Lowongan Pengiriman"
              variant="primary"
              size="medium"
              leftIcon={<Truck size={18} color="#FFFFFF" />}
              onPress={() => router.push('/(driver)/(tabs)/jobs')}
              className="mt-3 self-stretch"
            />
          </Card>
        )}

        {/* Logout Button */}
        <Button
          label="Keluar Dari Akun"
          variant="danger"
          leftIcon={<LogOut size={20} color="#FFFFFF" />}
          onPress={handleLogout}
          loading={loggingOut}
          className="mt-4 h-[50px]"
        />
      </ScrollView>
    </ThemedView>
  );
}
