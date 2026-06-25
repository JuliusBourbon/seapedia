import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  Animated,
} from 'react-native';
import { Wallet, CheckCircle2, Calendar, Store, MapPin, ClipboardList, HandCoins } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import api from '@/services/api';

interface CompletedJob {
  id: string;
  orderId: string;
  status: 'COMPLETED';
  earning: number;
  completedAt: string;
  order: {
    id: string;
    deliveryMethod: string;
    store: {
      id: string;
      name: string;
    };
    address: {
      recipientName: string;
      city: string;
    };
  };
}

interface EarningsSummary {
  totalCompletedJobs: number;
  totalEarnings: number;
}

export default function DriverEarningsScreen() {
  const theme = useTheme();

  const [history, setHistory] = useState<CompletedJob[]>([]);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      const summaryRes = await api.get('/driver/earnings');
      if (summaryRes.data?.success) {
        setSummary(summaryRes.data.data);
      }

      const historyRes = await api.get('/driver/jobs/history');
      if (historyRes.data?.success) {
        setHistory(historyRes.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data pendapatan.');
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const renderHeader = () => (
    <View className="mb-4">
      <Card className="p-5 bg-primary border-primary mb-4">
        <View className="flex-row items-center gap-2 mb-4">
          <HandCoins size={24} color="#FFFFFF" />
          <ThemedText type="large" className="text-[rgba(255,255,255,0.85)]">Total Pendapatan Kurir</ThemedText>
        </View>
        <ThemedText type="extraLarge" className="text-white py-1">
          {formatCurrency(summary?.totalEarnings ?? 0)}
        </ThemedText>
        <ThemedText type="small" className="text-[rgba(255,255,255,0.7)]">
          Dari {summary?.totalCompletedJobs ?? 0} pekerjaan selesai
        </ThemedText>
      </Card>

      <View className="flex-row gap-3 mb-4">
        <Card className="flex-1 p-4 gap-1 border border-neutral-300 rounded-md">
          <View className="w-9 h-9 rounded-lg items-center justify-center mb-1 bg-primary/10">
            <Wallet size={20} color={theme.primary} />
          </View>
          <ThemedText type="small">Akumulasi Saldo</ThemedText>
          <ThemedText type="large" style={{ color: theme.primary }}>
            {formatCurrency(summary?.totalEarnings ?? 0)}
          </ThemedText>
        </Card>

        <Card className="flex-1 p-4 gap-1 border border-neutral-300 rounded-md">
          <View className="w-9 h-9 rounded-lg items-center justify-center mb-1 bg-primary/10">
            <CheckCircle2 size={20} color={theme.primary} />
          </View>
          <ThemedText type="small">Order Selesai</ThemedText>
          <ThemedText type="large">
            {summary?.totalCompletedJobs ?? 0} Job
          </ThemedText>
        </Card>
      </View>

      <View className="flex-row items-center gap-2">
        <View className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.primary }} />
        <ThemedText className="font-bold">Riwayat Pengiriman</ThemedText>
      </View>
    </View>
  );

  const renderHistoryItem = ({ item }: { item: CompletedJob }) => {
    const formattedDate = item.completedAt
      ? new Date(item.completedAt).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Selesai';

    return (
      <Card className="mb-3 p-4 border border-primary rounded-md">
        <View className="flex-row justify-between items-center pb-3 mb-3 border-b" style={{ borderBottomColor: theme.neutral[200] }}>
          <View className="flex-row items-center gap-2">
            <CheckCircle2 size={16} color={theme.primary} />
            <ThemedText className="font-semibold" style={{ color: theme.primary }}>
              Selesai
            </ThemedText>
          </View>
          <ThemedText className="font-bold text-primary">
            +{formatCurrency(item.earning)}
          </ThemedText>
        </View>

        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <Store size={14} color={theme.neutral[500]} />
            <ThemedText>
              {item.order.store.name}
            </ThemedText>
          </View>

          <View className="flex-row items-center gap-2">
            <MapPin size={14} color={theme.neutral[500]} />
            <ThemedText>
              {item.order.address.recipientName} ({item.order.address.city})
            </ThemedText>
          </View>

          <View className="flex-row items-center gap-2">
            <Calendar size={14} color={theme.neutral[500]} />
            <ThemedText>
              {formattedDate}
            </ThemedText>
          </View>

          <ThemedText className="font-mono mt-1" style={{ color: theme.neutral[400] }}>
            ID: {item.id.substring(0, 12).toUpperCase()}
          </ThemedText>
        </View>
      </Card>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View className="items-center justify-center py-10 px-5 mt-8">
        <View className="w-24 h-24 rounded-full items-center justify-center mb-5" style={{ backgroundColor: theme.neutral[100] }}>
          <ClipboardList size={44} color={theme.neutral[400]} />
        </View>
        <ThemedText className="font-bold text-center mb-2" style={{ color: theme.neutral[900] }}>
          Belum Ada Riwayat
        </ThemedText>
        <ThemedText className="text-center px-4 leading-5" style={{ color: theme.neutral[500] }}>
          {error ? error : 'Anda belum memiliki riwayat pengiriman selesai. Ambil pekerjaan di halaman Lowongan untuk mulai mendapatkan pendapatan!'}
        </ThemedText>
      </View>
    );
  };

  const renderSkeleton = () => (
    <ThemedView className="flex-1">
      <Animated.View style={{ opacity: pulseAnim }} className="p-4">
        <View className="h-36 rounded-xl mb-4" style={{ backgroundColor: theme.neutral[200] }} />
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 h-28 rounded-xl" style={{ backgroundColor: theme.neutral[200] }} />
          <View className="flex-1 h-28 rounded-xl" style={{ backgroundColor: theme.neutral[200] }} />
        </View>
        <View className="h-5 w-40 rounded mb-3" style={{ backgroundColor: theme.neutral[200] }} />
        {[1, 2, 3].map((i) => (
          <View key={i} className="h-32 rounded-xl mb-3" style={{ backgroundColor: theme.neutral[200] }} />
        ))}
      </Animated.View>
    </ThemedView>
  );

  if (loading && !refreshing) {
    return renderSkeleton();
  }

  return (
    <ThemedView className="flex-1">
      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4 pb-5"
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      />
    </ThemedView>
  );
}
