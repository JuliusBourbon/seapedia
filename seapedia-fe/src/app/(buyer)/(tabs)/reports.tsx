import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { BarChart3, TrendingDown, DollarSign, Gift, Truck, Percent, ShieldCheck, HelpCircle } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spacing } from '@/constants/theme';
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
        <ThemedText className="mt-3" themeColor="textSecondary">
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
          <View className="flex-row items-center gap-2">
            <DollarSign size={24} color="#FFFFFF" />
            <ThemedText className="text-[rgba(255,255,255,0.85)] text-[13px] font-semibold">Total Pengeluaran Belanja</ThemedText>
          </View>
          <ThemedText className="text-white text-[30px] font-black mt-2">
            {formatCurrency(report?.totalSpending ?? 0)}
          </ThemedText>
          <ThemedText className="text-[rgba(255,255,255,0.7)] text-[13px] mt-1">
            Dari total {report?.totalOrders ?? 0} pesanan yang dibuat
          </ThemedText>
        </Card>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap gap-3">
          <Card className="w-[47.5%] p-4 gap-1">
            <View className="w-9 h-9 rounded-lg items-center justify-center mb-1" style={{ backgroundColor: `${theme.success}10` }}>
              <Gift size={20} color={theme.success} />
            </View>
            <ThemedText className="text-[11px]" themeColor="textSecondary">Hemat Voucher</ThemedText>
            <ThemedText type="smallBold" className="text-[15px]" style={{ color: theme.success }}>
              {formatCurrency(report?.totalDiscount ?? 0)}
            </ThemedText>
          </Card>

          <Card className="w-[47.5%] p-4 gap-1">
            <View className="w-9 h-9 rounded-lg items-center justify-center mb-1" style={{ backgroundColor: `${theme.primary}10` }}>
              <Percent size={20} color={theme.primary} />
            </View>
            <ThemedText className="text-[11px]" themeColor="textSecondary">Total PPN (12%)</ThemedText>
            <ThemedText type="smallBold" className="text-[15px]">
              {formatCurrency(report?.totalPpn ?? 0)}
            </ThemedText>
          </Card>

          <Card className="w-[47.5%] p-4 gap-1">
            <View className="w-9 h-9 rounded-lg items-center justify-center mb-1" style={{ backgroundColor: `${theme.secondary}10` }}>
              <Truck size={20} color={theme.secondary} />
            </View>
            <ThemedText className="text-[11px]" themeColor="textSecondary">Ongkos Kirim</ThemedText>
            <ThemedText type="smallBold" className="text-[15px]">
              {formatCurrency(report?.totalDeliveryFee ?? 0)}
            </ThemedText>
          </Card>

          <Card className="w-[47.5%] p-4 gap-1">
            <View className="w-9 h-9 rounded-lg items-center justify-center mb-1" style={{ backgroundColor: `${theme.danger}10` }}>
              <TrendingDown size={20} color={theme.danger} />
            </View>
            <ThemedText className="text-[11px]" themeColor="textSecondary">Refund Pengembalian</ThemedText>
            <ThemedText type="smallBold" className="text-[15px]" style={{ color: theme.danger }}>
              {formatCurrency(report?.totalRefunded ?? 0)}
            </ThemedText>
          </Card>
        </View>

        {/* Status Breakdown Section */}
        <ThemedText type="smallBold" className="text-[12px] uppercase font-bold tracking-wider mb-1 mt-2">
          Sebaran Status Pesanan
        </ThemedText>
        <Card className="p-4 gap-3">
          {statusKeys.length === 0 ? (
            <ThemedText className="text-center my-4" themeColor="textSecondary">
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
                    <ThemedText type="smallBold" className="text-[13px]">
                      {label}
                    </ThemedText>
                    <ThemedText className="text-[13px]" themeColor="textSecondary">
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

        {/* Note on Refund */}
        {report && report.refundedOrdersCount > 0 && (
          <Card className="p-4 flex-row gap-3 items-start bg-warning/5">
            <HelpCircle size={18} color={theme.warning} />
            <ThemedText className="flex-1 text-[12px] leading-[18px]" themeColor="textSecondary">
              Sebanyak **{report.refundedOrdersCount} pesanan** dibatalkan dan direfund (dikembalikan ke Wallet Anda) senilai total **{formatCurrency(report.totalRefunded)}** karena melewati SLA waktu pengantaran kurir.
            </ThemedText>
          </Card>
        )}
      </ScrollView>
    </ThemedView>
  );
}
