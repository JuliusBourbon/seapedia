import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Wallet, CheckCircle2, Calendar, Store, MapPin, ClipboardList, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
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

  const fetchData = async () => {
    try {
      setError(null);
      // Fetch earnings summary
      const summaryRes = await api.get('/driver/earnings');
      if (summaryRes.data?.success) {
        setSummary(summaryRes.data.data);
      }

      // Fetch completed job history
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

  const renderHistoryItem = ({ item }: { item: CompletedJob }) => {
    const formattedDate = item.completedAt
      ? new Date(item.completedAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      : 'Selesai';

    return (
      <Card className="mb-3 p-4">
        <View className="flex-row justify-between items-center border-b border-black/5 dark:border-white/5 pb-2 mb-2">
          <View className="flex-row items-center gap-2">
            <ShieldCheck size={16} color={theme.success} />
            <ThemedText className="font-semibold" themeColor="success">
              Pengiriman Selesai
            </ThemedText>
          </View>
          <ThemedText className="font-extrabold">
            +{formatCurrency(item.earning)}
          </ThemedText>
        </View>

        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <Store size={14} color={theme.textSecondary} />
            <ThemedText type='small' className="" themeColor="textSecondary">
              Pickup: {item.order.store.name}
            </ThemedText>
          </View>

          <View className="flex-row items-center gap-2">
            <MapPin size={14} color={theme.textSecondary} />
            <ThemedText type='small' className="" themeColor="textSecondary">
              Tujuan: {item.order.address.recipientName} ({item.order.address.city})
            </ThemedText>
          </View>

          <View className="flex-row items-center gap-2">
            <Calendar size={14} color={theme.textSecondary} />
            <ThemedText type='small' className="" themeColor="textSecondary">
              Waktu Selesai: {formattedDate}
            </ThemedText>
          </View>

          <ThemedText type='small' className="font-mono mt-1" themeColor="textSecondary">
            ID Job: {item.id}
          </ThemedText>
        </View>
      </Card>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View className="items-center justify-center py-6 px-5">
        <ClipboardList size={52} color={theme.placeholder} />
        <ThemedText className="text-center mt-3" themeColor="textSecondary">
          {error ? error : 'Anda belum memiliki riwayat pengiriman selesai.'}
        </ThemedText>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText className="mt-3" themeColor="textSecondary">
          Mengambil data pendapatan Anda...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      {/* Earnings Overview Header */}
      <View className="flex-col py-4 px-4 border-b shadow-sm gap-4" style={{ backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }}>
        <Card className="flex flex-row items-center gap-3">
          <Wallet size={28} color={theme.primary} />
          <View className="flex-col">
            <ThemedText className="" themeColor="textSecondary">
              Akumulasi Saldo
            </ThemedText>
            <ThemedText type="extraLarge" className="text-[20px] font-black text-[#0D9488]">
              {formatCurrency(summary?.totalEarnings ?? 0)}
            </ThemedText>
          </View>
        </Card>

        {/* <View className="w-[1.5px] h-10 mx-2" style={{ backgroundColor: theme.border }} /> */}

        <Card className="flex flex-row items-center gap-3">
          <CheckCircle2 size={28} color={theme.success} />
          <View className="gap-[2px]">
            <ThemedText className="" themeColor="textSecondary">
              Total Order Selesai
            </ThemedText>
            <ThemedText type="extraLarge" className="font-extrabold">
              {summary?.totalCompletedJobs ?? 0} Job
            </ThemedText>
          </View>
        </Card>
      </View>

      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4 pb-5"
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
