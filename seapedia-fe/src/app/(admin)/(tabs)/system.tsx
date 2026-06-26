import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  RefreshControl,
  Alert,
  ScrollView,
  Animated,
} from 'react-native';
import { Clock, CheckCircle2, Play, Calendar, AlertTriangle, User, Store, RefreshCcw } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/services/api';

interface OverdueCandidate {
  id: string;
  status: string;
  deliveryMethod: string;
  total: number;
  createdAt: string;
  slaDeadline: string;
  buyer: {
    id: string;
    username: string;
  };
  store: {
    id: string;
    name: string;
  };
}

interface ReturnedOrder {
  id: string;
  total: number;
  buyer: {
    id: string;
    username: string;
  };
  store: {
    id: string;
    name: string;
  };
  returnedAt: string;
}

interface OverdueData {
  currentSimulatedTime: string;
  slaRules: Record<string, number>;
  overdueCandidates: OverdueCandidate[];
  returnedOrders: ReturnedOrder[];
}

export default function AdminSystemScreen() {
  const theme = useTheme();

  const [data, setData] = useState<OverdueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [runningCheck, setRunningCheck] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [resetting, setResetting] = useState(false);

  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const fetchOverdueData = async () => {
    try {
      const res = await api.get('/admin/overdue');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Gagal memuat data sistem.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverdueData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOverdueData();
  };

  const handleRunOverdueCheck = async () => {
    setRunningCheck(true);
    try {
      const res = await api.post('/admin/overdue/run');
      if (res.data?.success) {
        const count = res.data.data?.totalProcessed ?? 0;
        Alert.alert(
          'Checker Berhasil',
          `Pengecekan selesai. Sebanyak ${count} pesanan telah diidentifikasi melewati SLA dan otomatis statusnya diubah menjadi DIKEMBALIKAN (dana direfund ke wallet pembeli).`
        );
        fetchOverdueData();
      }
    } catch (err: any) {
      Alert.alert('Gagal', err.response?.data?.message || 'Gagal menjalankan overdue checker.');
    } finally {
      setRunningCheck(false);
    }
  };

  const handleSimulateNextDay = async () => {
    Alert.alert(
      'Simulasi Waktu',
      'Apakah Anda yakin ingin memajukan waktu simulasi server sejauh +24 Jam? Tindakan ini akan secara otomatis memicu pengecekan SLA overdue.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Simulasikan',
          onPress: async () => {
            setSimulating(true);
            try {
              const res = await api.post('/admin/simulate-next-day');
              if (res.data?.success) {
                const checkResult = res.data.data?.overdueCheck || {};
                const returnedCount = checkResult.totalProcessed ?? 0;

                Alert.alert(
                  'Simulasi Sukses',
                  `Waktu dimajukan +24 Jam.\n\nHasil Pengecekan SLA:\n- ${returnedCount} order diproses kedaluwarsa (dana dikembalikan ke buyer, stok produk dipulihkan).`
                );
                fetchOverdueData();
              }
            } catch (err: any) {
              Alert.alert('Gagal', err.response?.data?.message || 'Gagal memajukan waktu simulasi.');
            } finally {
              setSimulating(false);
            }
          },
        },
      ]
    );
  };

  const handleSimulateReset = async () => {
    Alert.alert(
      'Reset Simulasi Waktu',
      'Apakah Anda yakin ingin mengembalikan waktu simulasi ke waktu nyata? Ini tidak akan membatalkan order yang sudah terlanjur dioverdue.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Reset',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            try {
              const res = await api.post('/admin/simulate-reset');
              if (res.data?.success) {
                Alert.alert('Sukses', 'Waktu simulasi berhasil di-reset ke waktu nyata.');
                fetchOverdueData();
              }
            } catch (err: any) {
              Alert.alert('Gagal', err.response?.data?.message || 'Gagal mereset waktu simulasi.');
            } finally {
              setResetting(false);
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const renderSkeleton = () => (
    <ThemedView className="flex-1">
      <Animated.View style={{ opacity: pulseAnim }} className="p-4">
        <View className="h-44 rounded-xl mb-4" style={{ backgroundColor: theme.neutral[200] }} />
        <View className="h-5 w-52 rounded mb-3" style={{ backgroundColor: theme.neutral[200] }} />
        <View className="h-28 rounded-xl mb-4" style={{ backgroundColor: theme.neutral[200] }} />
        <View className="h-5 w-56 rounded mb-3" style={{ backgroundColor: theme.neutral[200] }} />
        <View className="h-32 rounded-xl mb-3" style={{ backgroundColor: theme.neutral[200] }} />
        <View className="h-32 rounded-xl" style={{ backgroundColor: theme.neutral[200] }} />
      </Animated.View>
    </ThemedView>
  );

  if (loading && !refreshing) {
    return renderSkeleton();
  }

  const simulatedTimeFormatted = data?.currentSimulatedTime
    ? new Date(data.currentSimulatedTime).toLocaleString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    : 'Tidak diketahui';

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
        <Card className="p-5 border bg-neutral-100 border-primary">
          <View className="flex-row items-center gap-2 mb-3">
            <Clock size={20} color={theme.primary} />
            <ThemedText className="font-semibold text-primary">
              Simulasi Jam Server
            </ThemedText>
          </View>
          <ThemedText type="extraLarge" className="text-neutral[700] py-1">
            {simulatedTimeFormatted}
          </ThemedText>

          <View className="flex-row gap-2 mt-4">
            <Button
              label="Simulasikan +24 Jam"
              variant="outline"
              size="small"
              loading={simulating}
              leftIcon={<Play size={16} color={theme.primary} />}
              onPress={handleSimulateNextDay}
              className="flex-1 border-primary"
            />
            <Button
              label="Cek Overdue"
              variant="outline"
              size="small"
              loading={runningCheck}
              onPress={handleRunOverdueCheck}
              className="border-neutral-700"
            />
          </View>
          <Button
            label="Reset Ke Waktu Nyata"
            variant="danger"
            size="small"
            loading={resetting}
            leftIcon={<RefreshCcw size={16} color="#FFFFFF" />}
            onPress={handleSimulateReset}
            className="mt-2"
          />
        </Card>

        <View className="flex-row items-center gap-2">
          <View className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.primary }} />
          <ThemedText className="font-bold">Ketentuan Batas SLA</ThemedText>
        </View>
        <Card className="p-4 border border-primary rounded-md">
          <View className="flex-row justify-between items-center">
            <ThemedText className="font-semibold">INSTANT</ThemedText>
            <ThemedText className="font-bold text-primary">3 Jam</ThemedText>
          </View>
          <View className="h-[1.5px] my-2" style={{ backgroundColor: theme.neutral[200] }} />
          <View className="flex-row justify-between items-center">
            <ThemedText className="font-semibold">NEXT DAY</ThemedText>
            <ThemedText className="font-bold text-primary">24 Jam</ThemedText>
          </View>
          <View className="h-[1.5px] my-2" style={{ backgroundColor: theme.neutral[200] }} />
          <View className="flex-row justify-between items-center">
            <ThemedText className="font-semibold">REGULAR</ThemedText>
            <ThemedText className="font-bold text-primary">72 Jam</ThemedText>
          </View>
        </Card>

        <View className="flex-row items-center gap-2">
          <View className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.danger }} />
          <ThemedText className="font-bold">Pesanan Overdue ({data?.overdueCandidates.length ?? 0})</ThemedText>
        </View>
        {data?.overdueCandidates.length === 0 ? (
          <Card className="p-5 items-center justify-center gap-2 border border-primary rounded-md">
            <CheckCircle2 size={32} color={theme.primary} />
            <ThemedText className="text-center">
              Tidak ada pesanan aktif yang melewati batas SLA saat ini.
            </ThemedText>
          </Card>
        ) : (
          data?.overdueCandidates.map((item) => (
            <Card key={item.id} className="mb-2 p-4 border border-danger rounded-md">
              <View className="flex-row justify-between items-start pb-3 mb-3" style={{ borderBottomWidth: 1.5, borderBottomColor: theme.neutral[200] }}>
                <View className="flex-1">
                  <ThemedText className="font-mono" style={{ color: theme.neutral[500] }}>
                    {item.id}
                  </ThemedText>
                </View>
                <View className="flex-shrink">
                  <Badge label="Overdue" variant="danger" />
                </View>
              </View>

              <View className="gap-2">
                <View className="flex-row items-center gap-2">
                  <Store size={14} color={theme.neutral[500]} />
                  <ThemedText>
                    {item.store.name}
                  </ThemedText>
                </View>
                <View className="flex-row items-center gap-2">
                  <User size={14} color={theme.neutral[500]} />
                  <ThemedText>
                    @{item.buyer.username}
                  </ThemedText>
                </View>
                <View className="flex-row items-center gap-2">
                  <AlertTriangle size={14} color={theme.danger} />
                  <ThemedText style={{ color: theme.danger }}>
                    SLA: {new Date(item.slaDeadline).toLocaleString('id-ID')}
                  </ThemedText>
                </View>
                <View className="h-[1.5px] my-1" style={{ backgroundColor: theme.neutral[200] }} />
                <View className="flex-row justify-between items-center">
                  <ThemedText>Total Transaksi</ThemedText>
                  <ThemedText className="font-bold" style={{ color: theme.danger }}>{formatCurrency(item.total)}</ThemedText>
                </View>
              </View>
            </Card>
          ))
        )}

        <View className="flex-row items-center gap-2">
          <View className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.primary }} />
          <ThemedText className="font-bold">Riwayat Dikembalikan ({data?.returnedOrders.length ?? 0})</ThemedText>
        </View>
        {data?.returnedOrders.length === 0 ? (
          <Card className="p-5 items-center justify-center gap-2 border border-primary rounded-md">
            <ThemedText className="text-center">
              Belum ada riwayat pesanan yang dikembalikan.
            </ThemedText>
          </Card>
        ) : (
          data?.returnedOrders.map((item) => (
            <Card key={item.id} className="mb-2 p-4 border border-neutral-300 rounded-md">
              <View className="flex-row gap-2 justify-between items-start pb-3 mb-3" style={{ borderBottomWidth: 1.5, borderBottomColor: theme.neutral[200] }}>
                <View className="flex-1">
                  <ThemedText className="font-mono" style={{ color: theme.neutral[500] }}>
                    {item.id}
                  </ThemedText>
                </View>
                <View className="flex-shrink">
                  <Badge label="Dikembalikan" variant="neutral" />
                </View>
              </View>

              <View className="gap-2">
                <View className="flex-row items-center gap-2">
                  <Store size={14} color={theme.neutral[500]} />
                  <ThemedText>
                    {item.store.name}
                  </ThemedText>
                </View>
                <View className="flex-row items-center gap-2">
                  <User size={14} color={theme.neutral[500]} />
                  <ThemedText>
                    @{item.buyer.username}
                  </ThemedText>
                </View>
                <View className="flex-row items-center gap-2">
                  <Calendar size={14} color={theme.neutral[500]} />
                  <ThemedText>
                    {new Date(item.returnedAt).toLocaleString('id-ID')}
                  </ThemedText>
                </View>
                <View className="h-[1.5px] my-1" style={{ backgroundColor: theme.neutral[200] }} />
                <View className="flex-row justify-between items-center">
                  <ThemedText>Dana Direfund</ThemedText>
                  <ThemedText className="font-bold text-primary">{formatCurrency(item.total)}</ThemedText>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}
