import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { BarChart3, TrendingUp, DollarSign, Package, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle, HandCoins } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spacing } from '@/constants/theme';
import { ORDER_STATUS_LABELS } from '@/constants/config';
import api from '@/services/api';

const { width } = Dimensions.get('window');

interface ReportData {
  storeName: string;
  totalOrders: number;
  totalIncome: number;
  totalReversedIncome: number;
  returnedOrdersCount: number;
  statusBreakdown: Record<string, number>;
}

export default function SellerReportsScreen() {
  const theme = useTheme();

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setError(null);
      const res = await api.get('/seller/reports/summary');
      if (res.data?.success) {
        setReport(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat laporan penjualan toko.');
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
        <ThemedText className="mt-3" themeColor="textSecondary">
          Mengompilasi laporan penjualan toko...
        </ThemedText>
      </ThemedView>
    );
  }

  // Define monthly bars based on the actual income + simulated historical data
  {/* TODO: USING REAL DATA FROM API */ }
  const baseIncome = report?.totalIncome ?? 0;
  const chartData = [
    { label: 'Jan', value: 400000 },
    { label: 'Feb', value: 550000 },
    { label: 'Mar', value: 450000 },
    { label: 'Apr', value: 750000 },
    { label: 'Mei', value: 900000 },
    { label: 'Jun', value: baseIncome || 120000 },
  ];
  const maxChartValue = Math.max(...chartData.map((d) => d.value), 1);

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
        {/* Banner */}
        <Card className="p-5 bg-[#0D9488] border-[#0F766E]">
          <View className="flex-row items-center gap-2 mb-5">
            <HandCoins size={24} color="#FFFFFF" />
            <View>
              <ThemedText type='large' className="font-semibold">Total Pendapatan Bersih</ThemedText>
              <ThemedText className="">{report?.storeName}</ThemedText>
            </View>
          </View>
          <ThemedText type='extraLarge' className="font-semibold">
            {formatCurrency(baseIncome)}
          </ThemedText>
          <ThemedText className="mt-1">
            Dari total {report?.totalOrders ?? 0} pesanan masuk
          </ThemedText>
        </Card>

        {/* Metrics Grid */}
        <View className="flex-row flex-wrap gap-3">
          <Card className="w-[47.5%] p-4 gap-1">
            <View className="w-9 h-9 rounded-lg items-center justify-center mb-1" style={{ backgroundColor: `${theme.danger}10` }}>
              <AlertTriangle size={20} color={theme.danger} />
            </View>
            <ThemedText themeColor="textSecondary">Refund</ThemedText>
            <ThemedText type="large" className="text-[15px]" style={{ color: theme.danger }}>
              {formatCurrency(report?.totalReversedIncome ?? 0)}
            </ThemedText>
          </Card>

          <Card className="w-[47.5%] p-4 gap-1">
            <View className="w-9 h-9 rounded-lg items-center justify-center mb-1" style={{ backgroundColor: `${theme.primary}10` }}>
              <Package size={20} color={theme.primary} />
            </View>
            <ThemedText themeColor="textSecondary">Overdue</ThemedText>
            <ThemedText type="large" className="text-[15px]">
              {report?.returnedOrdersCount ?? 0}
            </ThemedText>
          </Card>
        </View>

        {/* Chart Card */}
        <Card className="p-4">
          <View className="flex-col gap-4 mb-10">
            <View>
              <ThemedText type="extraLarge" className="font-semibold">
                Grafik Tren Pendapatan Bulanan
              </ThemedText>
            </View>
            <View className="flex-row items-center px-2 rounded-lg">
              <TrendingUp size={16} color={theme.success} />
              <ThemedText className="ml-2" style={{ color: theme.success }}>
                Sangat Baik
              </ThemedText>
            </View>
          </View>

          {/* Styled Bars */}
          {/* TODO: USING REAL DATA FROM API */}
          <View className="flex-row justify-between items-end h-[150px] mt-3 pb-2">
            {chartData.map((bar, index) => {
              const barHeightPercent = (bar.value / maxChartValue) * 100;
              return (
                <View key={index} className="items-center flex-1">
                  <View className="h-full w-[14px] rounded-full justify-end overflow-hidden bg-black/5 dark:bg-white/5">
                    <View
                      className="w-full rounded-full"
                      style={{
                        height: `${barHeightPercent}%`,
                        backgroundColor: index === chartData.length - 1 ? theme.secondary : theme.primary,
                      }}
                    />
                  </View>
                  <ThemedText className="text-[10px] mt-2" themeColor="textSecondary">
                    {bar.label}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Status Breakdown Section */}
        <ThemedText type="large" className="mb-1 mt-2 font-semibold">
          Sebaran Pesanan
        </ThemedText>
        <Card className="p-4 gap-3">
          {statusKeys.length === 0 ? (
            <ThemedText className="text-center my-4" themeColor="textSecondary">
              Belum ada data pesanan masuk.
            </ThemedText>
          ) : (
            statusKeys.map((statusKey) => {
              const count = statusBreakdown[statusKey];
              const barPercent = (count / maxStatusCount) * 100;
              const label = ORDER_STATUS_LABELS[statusKey as keyof typeof ORDER_STATUS_LABELS] || statusKey;

              return (
                <View key={statusKey} className="gap-1">
                  <View className="flex-row justify-between items-center">
                    <ThemedText type="smallBold" className="text-[13px]">
                      {label}
                    </ThemedText>
                    <ThemedText className="text-[13px]" themeColor="textSecondary">
                      {count} Pesanan
                    </ThemedText>
                  </View>
                  <View className="h-2 mt-1 rounded-full overflow-hidden bg-black/5 dark:bg-white/5">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${barPercent}%`,
                        backgroundColor:
                          statusKey === 'PESANAN_SELESAI'
                            ? theme.success
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

        {/* Note Card */}
        {report && report.returnedOrdersCount > 0 && (
          <Card className="p-4 flex-row gap-3 items-start bg-danger/5">
            <HelpCircle size={18} color={theme.danger} />
            <ThemedText className="flex-1 text-[12px] leading-[18px]" themeColor="textSecondary">
              Toko Anda mendapati **{report.returnedOrdersCount} pesanan** berstatus dikembalikan karena keterlambatan pengiriman oleh kurir. Nilai pendapatan sebesar **{formatCurrency(report.totalReversedIncome)}** telah dipotong dari saldo toko Anda (reversed income) dan dana dikembalikan penuh ke Wallet pembeli.
            </ThemedText>
          </Card>
        )}
      </ScrollView>
    </ThemedView>
  );
}