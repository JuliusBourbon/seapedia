import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Clock, ShieldAlert, CheckCircle2, Play, Calendar, AlertTriangle, User, Store } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spacing } from '@/constants/theme';
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
        const count = res.data.data?.returnedCount ?? 0;
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
                const returnedCount = checkResult.returnedCount ?? 0;
                
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
          Mengambil data parameter logistik sistem...
        </ThemedText>
      </ThemedView>
    );
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
        {/* Simulated Time Banner */}
        <Card className="p-4 gap-2">
          <View className="flex-row items-center">
            <Clock size={20} color={theme.primary} />
            <ThemedText type="smallBold" className="text-[14px] ml-2">
              Simulasi Jam Server Seapedia
            </ThemedText>
          </View>
          <ThemedText className="text-[18px] font-extrabold mt-1">
            {simulatedTimeFormatted}
          </ThemedText>

          <View className="flex-row gap-2 mt-2">
            <Button
              label="Simulasikan +24 Jam"
              variant="primary"
              size="small"
              loading={simulating}
              leftIcon={<Play size={16} color="#FFFFFF" />}
              onPress={handleSimulateNextDay}
              className="flex-1"
            />
            <Button
              label="Cek Overdue"
              variant="outline"
              size="small"
              loading={runningCheck}
              onPress={handleRunOverdueCheck}
              style={{ flex: 0.8 }}
            />
          </View>
        </Card>

        {/* SLA Rules display */}
        <ThemedText type="smallBold" className="text-[12px] uppercase font-bold tracking-wider mb-1 mt-2">
          Ketentuan Batas SLA Pengantaran
        </ThemedText>
        <Card className="p-4">
          <View className="flex-row justify-between items-center">
            <ThemedText className="text-[13px] font-semibold">INSTANT</ThemedText>
            <ThemedText type="smallBold">3 Jam</ThemedText>
          </View>
          <View className="h-[1px] my-2" style={{ backgroundColor: theme.border }} />
          <View className="flex-row justify-between items-center">
            <ThemedText className="text-[13px] font-semibold">NEXT DAY</ThemedText>
            <ThemedText type="smallBold">24 Jam</ThemedText>
          </View>
          <View className="h-[1px] my-2" style={{ backgroundColor: theme.border }} />
          <View className="flex-row justify-between items-center">
            <ThemedText className="text-[13px] font-semibold">REGULAR</ThemedText>
            <ThemedText type="smallBold">72 Jam</ThemedText>
          </View>
        </Card>

        {/* Overdue Candidates list */}
        <ThemedText type="smallBold" className="text-[12px] uppercase font-bold tracking-wider mb-1 mt-2">
          Pesanan Overdue Belum Diproses ({data?.overdueCandidates.length ?? 0})
        </ThemedText>
        {data?.overdueCandidates.length === 0 ? (
          <Card className="p-5 items-center justify-center gap-2">
            <CheckCircle2 size={32} color={theme.success} />
            <ThemedText className="text-[13.5px] text-center" themeColor="textSecondary">
              Tidak ada pesanan aktif yang melewati batas SLA saat ini.
            </ThemedText>
          </Card>
        ) : (
          data?.overdueCandidates.map((item) => (
            <Card key={item.id} className="mb-2 p-4">
              <View className="flex-row justify-between items-center border-b border-black/5 dark:border-white/5 pb-2 mb-2">
                <ThemedText className="text-[11px] font-mono" themeColor="textSecondary">
                  ID: {item.id}
                </ThemedText>
                <Badge label="Overdue" variant="danger" />
              </View>

              <View className="gap-1.5">
                <View className="flex-row items-center gap-2">
                  <Store size={14} color={theme.textSecondary} />
                  <ThemedText className="text-[13px]" themeColor="textSecondary">
                    Toko: {item.store.name}
                  </ThemedText>
                </View>
                <View className="flex-row items-center gap-2">
                  <User size={14} color={theme.textSecondary} />
                  <ThemedText className="text-[13px]" themeColor="textSecondary">
                    Pembeli: @{item.buyer.username}
                  </ThemedText>
                </View>
                <View className="flex-row items-center gap-2">
                  <AlertTriangle size={14} color={theme.textSecondary} />
                  <ThemedText className="text-[13px]" themeColor="textSecondary">
                    Batas SLA: {new Date(item.slaDeadline).toLocaleString('id-ID')}
                  </ThemedText>
                </View>
                <View className="h-[1px] my-1" style={{ backgroundColor: theme.border }} />
                <View className="flex-row justify-between items-center">
                  <ThemedText className="text-[12px]" themeColor="textSecondary">Total Transaksi</ThemedText>
                  <ThemedText type="smallBold" style={{ color: theme.danger }}>{formatCurrency(item.total)}</ThemedText>
                </View>
              </View>
            </Card>
          ))
        )}

        {/* Returned Orders history */}
        <ThemedText type="smallBold" className="text-[12px] uppercase font-bold tracking-wider mb-1 mt-2">
          Riwayat Pesanan Dikembalikan ({data?.returnedOrders.length ?? 0})
        </ThemedText>
        {data?.returnedOrders.length === 0 ? (
          <Card className="p-5 items-center justify-center gap-2">
            <ThemedText className="text-[13.5px] text-center" themeColor="textSecondary">
              Belum ada riwayat pesanan yang dikembalikan.
            </ThemedText>
          </Card>
        ) : (
          data?.returnedOrders.map((item) => (
            <Card key={item.id} className="mb-2 p-4">
              <View className="flex-row justify-between items-center border-b border-black/5 dark:border-white/5 pb-2 mb-2">
                <ThemedText className="text-[11px] font-mono" themeColor="textSecondary">
                  ID: {item.id}
                </ThemedText>
                <Badge label="Dikembalikan" variant="neutral" />
              </View>

              <View className="gap-1.5">
                <View className="flex-row items-center gap-2">
                  <Store size={14} color={theme.textSecondary} />
                  <ThemedText className="text-[13px]" themeColor="textSecondary">
                    Toko: {item.store.name}
                  </ThemedText>
                </View>
                <View className="flex-row items-center gap-2">
                  <User size={14} color={theme.textSecondary} />
                  <ThemedText className="text-[13px]" themeColor="textSecondary">
                    Pembeli: @{item.buyer.username}
                  </ThemedText>
                </View>
                <View className="flex-row items-center gap-2">
                  <Calendar size={14} color={theme.textSecondary} />
                  <ThemedText className="text-[13px]" themeColor="textSecondary">
                    Waktu Dikembalikan: {new Date(item.returnedAt).toLocaleString('id-ID')}
                  </ThemedText>
                </View>
                <View className="h-[1px] my-1" style={{ backgroundColor: theme.border }} />
                <View className="flex-row justify-between items-center">
                  <ThemedText className="text-[12px]" themeColor="textSecondary">Dana Direfund</ThemedText>
                  <ThemedText type="smallBold" style={{ color: theme.primary }}>{formatCurrency(item.total)}</ThemedText>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}
