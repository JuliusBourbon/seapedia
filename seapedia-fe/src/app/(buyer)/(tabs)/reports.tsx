import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { TrendingDown, Gift, Truck, Percent, HelpCircle } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { ORDER_STATUS_LABELS } from '@/constants/config';
import api from '@/services/api';

interface ReportData {
  totalOrders: number;
  totalSpending: number;
  totalDiscount: number;
  totalPpn: number;
  totalDeliveryFee: number;
  totalRefunded: number;
  refundedOrdersCount: number;
  statusBreakdown: Record<string, number>;
}

export default function BuyerReportsScreen() {
  const theme = useTheme();

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setError(null);
      const res = await api.get('/buyer/reports/summary');
      if (res.data?.success) {
        setReport(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat laporan pengeluaran.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReport();
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
        <ThemedText className="mt-3">
          Mengompilasi laporan pengeluaran Anda...
        </ThemedText>
      </ThemedView>
    );
  }

  const statusBreakdown = report?.statusBreakdown || {};
  const statusKeys = Object.keys(statusBreakdown);
  const maxStatusCount = Math.max(...Object.values(statusBreakdown), 1);

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
        {/* Banner Overview */}
        <Card className="p-5 bg-[#0D9488] border-[#0F766E]">
          <View className="flex-row items-center">
            <ThemedText type='large' className="text-[rgba(255,255,255,0.85)]">Total Pengeluaran Belanja</ThemedText>
          </View>
          <ThemedText type='large' className="text-white py-3">
            {formatCurrency(report?.totalSpending ?? 0)}
          </ThemedText>
          <ThemedText type='small' className="text-[rgba(255,255,255,0.7)]">
            Dari total {report?.totalOrders ?? 0} pesanan yang dibuat
          </ThemedText>
        </Card>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap gap-3">
          <Card className="w-[47.5%] p-4 gap-1 border border-neutral-300 rounded-md">
            <View className="w-9 h-9 rounded-lg items-center justify-center mb-1 bg-primary/10">
              <Gift size={20} color={theme.primary} />
            </View>
            <ThemedText type='small'>Hemat Voucher</ThemedText>
            <ThemedText type="large" style={{ color: theme.primary }}>
              {formatCurrency(report?.totalDiscount ?? 0)}
            </ThemedText>
          </Card>

          <Card className="w-[47.5%] p-4 gap-1 border border-neutral-300 rounded-md">
            <View className="w-9 h-9 rounded-lg items-center justify-center mb-1 bg-secondary/10">
              <Percent size={20} color={theme.secondary} />
            </View>
            <ThemedText type='small'>Total PPN (12%)</ThemedText>
            <ThemedText type="large">
              {formatCurrency(report?.totalPpn ?? 0)}
            </ThemedText>
          </Card>

          <Card className="w-[47.5%] p-4 gap-1 border border-neutral-300 rounded-md">
            <View className="w-9 h-9 rounded-lg items-center justify-center mb-1 bg-secondary/10">
              <Truck size={20} color={theme.secondary} />
            </View>
            <ThemedText type='small'>Ongkos Kirim</ThemedText>
            <ThemedText type="large">
              {formatCurrency(report?.totalDeliveryFee ?? 0)}
            </ThemedText>
          </Card>

          <Card className="w-[47.5%] p-4 gap-1 border border-neutral-300 rounded-md">
            <View className="w-9 h-9 rounded-lg items-center justify-center mb-1" style={{ backgroundColor: `${theme.danger}10` }}>
              <TrendingDown size={20} color={theme.danger} />
            </View>
            <ThemedText type='small'>Refund</ThemedText>
            <ThemedText type="large" style={{ color: theme.danger }}>
              {formatCurrency(report?.totalRefunded ?? 0)}
            </ThemedText>
          </Card>
        </View>

        {/* Status Breakdown Section */}
        <View className="flex-row items-center gap-2 mt-4">
          <View className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.primary }} />
          <ThemedText className="font-bold">Sebaran Status Pesanan</ThemedText>
        </View>
        <Card className="p-4 gap-3">
          {statusKeys.length === 0 ? (
            <ThemedText className="text-center my-4">
              Belum ada data status pesanan tersedia.
            </ThemedText>
          ) : (
            statusKeys.map((statusKey, index) => {
              const count = statusBreakdown[statusKey];
              const barPercent = (count / maxStatusCount) * 100;
              const label = ORDER_STATUS_LABELS[statusKey as keyof typeof ORDER_STATUS_LABELS] || statusKey;

              return (
                <View key={statusKey} className="gap-1">
                  <View className="flex-row justify-between items-center">
                    <ThemedText className="font-semibold">
                      {label}
                    </ThemedText>
                    <ThemedText className="">
                      {count} Pesanan
                    </ThemedText>
                  </View>
                  <View className="h-2 rounded-full overflow-hidden bg-black/5 dark:bg-white/5">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${barPercent}%`,
                        backgroundColor:
                          statusKey === 'PESANAN_SELESAI'
                            ? theme.primary
                            : statusKey === 'DIKEMBALIKAN'
                              ? theme.danger
                              : theme.primary,
                      }}
                    />
                  </View>
                </View>
              );
            })
          )}
        </Card>

        {/* Note on Refund */}
        {report && report.refundedOrdersCount > 0 && (
          <Card className="p-4 flex-row gap-3 items-start bg-danger">
            <HelpCircle size={18} color={theme.danger} />
            <ThemedText className="flex-1 text-[12px] leading-[18px]">
              Sebanyak **{report.refundedOrdersCount} pesanan** dibatalkan dan direfund (dikembalikan ke Wallet Anda) senilai total **{formatCurrency(report.totalRefunded)}** karena melewati SLA waktu pengantaran kurir.
            </ThemedText>
          </Card>
        )}
      </ScrollView>
    </ThemedView>
  );
}
