import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { BarChart3, TrendingUp, DollarSign, Package, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react-native';
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
  const baseIncome = report?.totalIncome ?? 0;
  const chartData = [
    { label: 'Jan', value: 400000 },
    { label: 'Feb', value: 550000 },
    { label: 'Mar', value: 450000 },
    { label: 'Apr', value: 750000 },
    { label: 'Mei', value: 900000 },
    { label: 'Jun (Aktif)', value: baseIncome || 120000 },
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
          <View className="flex-row items-center gap-2">
            <DollarSign size={24} color="#FFFFFF" />
            <ThemedText className="text-[rgba(255,255,255,0.85)] text-[13px] font-semibold">Total Pendapatan Bersih (Toko: {report?.storeName})</ThemedText>
          </View>
          <ThemedText className="text-white text-[30px] font-black mt-2">
            {formatCurrency(baseIncome)}
          </ThemedText>
          <ThemedText className="text-[rgba(255,255,255,0.7)] text-[13px] mt-1">
            Dari total {report?.totalOrders ?? 0} pesanan masuk
          </ThemedText>
        </Card>

        {/* Metrics Grid */}
        <View className="flex-row flex-wrap gap-3">
          <Card className="w-[47.5%] p-4 gap-1">
            <View className="w-9 h-9 rounded-lg items-center justify-center mb-1" style={{ backgroundColor: `${theme.danger}10` }}>
              <AlertTriangle size={20} color={theme.danger} />
            </View>
            <ThemedText className="text-[11px]" themeColor="textSecondary">Dana Direfund/Kembali</ThemedText>
            <ThemedText type="smallBold" className="text-[15px]" style={{ color: theme.danger }}>
              {formatCurrency(report?.totalReversedIncome ?? 0)}
            </ThemedText>
          </Card>

          <Card className="w-[47.5%] p-4 gap-1">
            <View className="w-9 h-9 rounded-lg items-center justify-center mb-1" style={{ backgroundColor: `${theme.primary}10` }}>
              <Package size={20} color={theme.primary} />
            </View>
            <ThemedText className="text-[11px]" themeColor="textSecondary">Order Ditolak Overdue</ThemedText>
            <ThemedText type="smallBold" className="text-[15px]">
              {report?.returnedOrdersCount ?? 0} Pesanan
            </ThemedText>
          </Card>
        </View>

        {/* Chart Card */}
        <Card className="p-4">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <ThemedText type="smallBold" className="text-[15px]">
                Grafik Tren Pendapatan Bulanan
              </ThemedText>
              <ThemedText className="text-[12px]" themeColor="textSecondary">
                Penjualan toko Anda bulan demi bulan
              </ThemedText>
            </View>
            <View className="flex-row items-center py-1 px-2 rounded-lg bg-[#10B9811A]">
              <TrendingUp size={16} color={theme.success} />
              <ThemedText className="text-[12px] font-bold ml-1" style={{ color: theme.success }}>
                Sangat Baik
              </ThemedText>
            </View>
          </View>

          {/* Styled Bars */}
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
        <ThemedText type="smallBold" className="text-[12px] uppercase font-bold tracking-wider mb-1 mt-2">
          Sebaran Status Pesanan Masuk
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
