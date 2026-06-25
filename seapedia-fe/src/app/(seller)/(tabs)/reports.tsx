import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  Animated,
} from 'react-native';
import { TrendingDown, AlertTriangle, Package, HelpCircle, HandCoins } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { ORDER_STATUS_LABELS } from '@/constants/config';
import api from '@/services/api';

interface ReportData {
  storeName: string;
  totalOrders: number;
  totalIncome: number;
  totalReversedIncome: number;
  returnedOrdersCount: number;
  statusBreakdown: Record<string, number>;
  monthlyIncome?: { label: string; value: number }[];
}

export default function SellerReportsScreen() {
  const theme = useTheme();

  const [report, setReport] = useState<ReportData | null>(null);
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

  const renderSkeleton = () => (
    <ThemedView className="flex-1">
      <Animated.View style={{ opacity: pulseAnim }} className="p-4">
        <View className="h-36 rounded-xl mb-4" style={{ backgroundColor: theme.neutral[200] }} />
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 h-28 rounded-xl" style={{ backgroundColor: theme.neutral[200] }} />
          <View className="flex-1 h-28 rounded-xl" style={{ backgroundColor: theme.neutral[200] }} />
        </View>
        <View className="h-5 w-40 rounded mb-3" style={{ backgroundColor: theme.neutral[200] }} />
        <View className="h-48 rounded-xl" style={{ backgroundColor: theme.neutral[200] }} />
      </Animated.View>
    </ThemedView>
  );

  if (loading && !refreshing) {
    return renderSkeleton();
  }

  const baseIncome = report?.totalIncome ?? 0;
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
        <Card className="p-5 bg-primary border-primary">
          <View className="flex-row items-center gap-2 mb-5">
            <HandCoins size={24} color="#FFFFFF" />
            <View>
              <ThemedText type="large" className="text-[rgba(255,255,255,0.85)]">Total Pendapatan Bersih</ThemedText>
              <ThemedText className="text-[rgba(255,255,255,0.7)]">{report?.storeName}</ThemedText>
            </View>
          </View>
          <ThemedText type="extraLarge" className="text-white py-1">
            {formatCurrency(baseIncome)}
          </ThemedText>
          <ThemedText type="small" className="text-[rgba(255,255,255,0.7)]">
            Dari total {report?.totalOrders ?? 0} pesanan masuk
          </ThemedText>
        </Card>

        <View className="flex-row flex-wrap gap-3">
          <Card className="w-[47.5%] p-4 gap-1 border border-neutral-300 rounded-md">
            <View className="w-9 h-9 rounded-lg items-center justify-center mb-1" style={{ backgroundColor: `${theme.danger}10` }}>
              <AlertTriangle size={20} color={theme.danger} />
            </View>
            <ThemedText type="small">Refund</ThemedText>
            <ThemedText type="large" style={{ color: theme.danger }}>
              {formatCurrency(report?.totalReversedIncome ?? 0)}
            </ThemedText>
          </Card>

          <Card className="w-[47.5%] p-4 gap-1 border border-neutral-300 rounded-md">
            <View className="w-9 h-9 rounded-lg items-center justify-center mb-1 bg-secondary/10">
              <Package size={20} color={theme.secondary} />
            </View>
            <ThemedText type="small">Pesanan Overdue</ThemedText>
            <ThemedText type="large">
              {report?.returnedOrdersCount ?? 0}
            </ThemedText>
          </Card>
        </View>

        <View className="flex-row items-center gap-2 mt-4">
          <View className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.primary }} />
          <ThemedText className="font-bold">Sebaran Status Pesanan</ThemedText>
        </View>
        <Card className="p-4 gap-3 border border-primary rounded-md">
          {statusKeys.length === 0 ? (
            <ThemedText className="text-center my-4">
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
                    <ThemedText className="font-semibold">
                      {label}
                    </ThemedText>
                    <ThemedText>
                      {count} Pesanan
                    </ThemedText>
                  </View>
                  <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.neutral[200] }}>
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${barPercent}%`,
                        backgroundColor:
                          statusKey === 'DIKEMBALIKAN'
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

        {report && report.returnedOrdersCount > 0 && (
          <Card className="p-4 flex-row gap-3 items-start border border-danger rounded-md">
            <HelpCircle size={18} color={theme.danger} />
            <ThemedText className="flex-1 leading-[18px]">
              Toko Anda mendapati {report.returnedOrdersCount} pesanan berstatus dikembalikan karena keterlambatan pengiriman oleh kurir. Nilai pendapatan sebesar {formatCurrency(report.totalReversedIncome)} telah dipotong dari saldo toko Anda dan dana dikembalikan penuh ke Wallet pembeli.
            </ThemedText>
          </Card>
        )}
      </ScrollView>
    </ThemedView>
  );
}