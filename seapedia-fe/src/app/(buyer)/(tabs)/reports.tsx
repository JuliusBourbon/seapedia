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
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={{ marginTop: Spacing.three, color: theme.textSecondary }}>
          Mengompilasi laporan pengeluaran Anda...
        </ThemedText>
      </ThemedView>
    );
  }

  const statusBreakdown = report?.statusBreakdown || {};
  const statusKeys = Object.keys(statusBreakdown);
  const maxStatusCount = Math.max(...Object.values(statusBreakdown), 1);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
        <Card style={styles.mainSpendCard}>
          <View style={styles.spendHeader}>
            <DollarSign size={24} color="#FFFFFF" />
            <ThemedText style={styles.spendTitle}>Total Pengeluaran Belanja</ThemedText>
          </View>
          <ThemedText style={styles.spendedValue}>
            {formatCurrency(report?.totalSpending ?? 0)}
          </ThemedText>
          <ThemedText style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: Spacing.one }}>
            Dari total {report?.totalOrders ?? 0} pesanan yang dibuat
          </ThemedText>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: `${theme.success}10` }]}>
              <Gift size={20} color={theme.success} />
            </View>
            <ThemedText style={styles.statLabel} themeColor="textSecondary">Hemat Voucher</ThemedText>
            <ThemedText type="smallBold" style={[styles.statVal, { color: theme.success }]}>
              {formatCurrency(report?.totalDiscount ?? 0)}
            </ThemedText>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: `${theme.primary}10` }]}>
              <Percent size={20} color={theme.primary} />
            </View>
            <ThemedText style={styles.statLabel} themeColor="textSecondary">Total PPN (12%)</ThemedText>
            <ThemedText type="smallBold" style={styles.statVal}>
              {formatCurrency(report?.totalPpn ?? 0)}
            </ThemedText>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: `${theme.secondary}10` }]}>
              <Truck size={20} color={theme.secondary} />
            </View>
            <ThemedText style={styles.statLabel} themeColor="textSecondary">Ongkos Kirim</ThemedText>
            <ThemedText type="smallBold" style={styles.statVal}>
              {formatCurrency(report?.totalDeliveryFee ?? 0)}
            </ThemedText>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: `${theme.danger}10` }]}>
              <TrendingDown size={20} color={theme.danger} />
            </View>
            <ThemedText style={styles.statLabel} themeColor="textSecondary">Refund Pengembalian</ThemedText>
            <ThemedText type="smallBold" style={[styles.statVal, { color: theme.danger }]}>
              {formatCurrency(report?.totalRefunded ?? 0)}
            </ThemedText>
          </Card>
        </View>

        {/* Status Breakdown Section */}
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Sebaran Status Pesanan
        </ThemedText>
        <Card style={styles.breakdownCard}>
          {statusKeys.length === 0 ? (
            <ThemedText style={{ textAlign: 'center', marginVertical: Spacing.four }} themeColor="textSecondary">
              Belum ada data status pesanan tersedia.
            </ThemedText>
          ) : (
            statusKeys.map((statusKey, index) => {
              const count = statusBreakdown[statusKey];
              const barPercent = (count / maxStatusCount) * 100;
              const label = ORDER_STATUS_LABELS[statusKey as keyof typeof ORDER_STATUS_LABELS] || statusKey;

              return (
                <View key={statusKey} style={styles.breakdownRow}>
                  <View style={styles.breakdownLabelRow}>
                    <ThemedText type="smallBold" style={{ fontSize: 13 }}>
                      {label}
                    </ThemedText>
                    <ThemedText style={{ fontSize: 13 }} themeColor="textSecondary">
                      {count} Pesanan
                    </ThemedText>
                  </View>
                  <View style={styles.barBackground}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${barPercent}%`,
                          backgroundColor:
                            statusKey === 'PESANAN_SELESAI'
                              ? theme.success
                              : statusKey === 'DIKEMBALIKAN'
                              ? theme.danger
                              : theme.primary,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })
          )}
        </Card>

        {/* Note on Refund */}
        {report && report.refundedOrdersCount > 0 && (
          <Card style={styles.infoCard}>
            <HelpCircle size={18} color={theme.warning} />
            <ThemedText style={styles.infoText} themeColor="textSecondary">
              Sebanyak **{report.refundedOrdersCount} pesanan** dibatalkan dan direfund (dikembalikan ke Wallet Anda) senilai total **{formatCurrency(report.totalRefunded)}** karena melewati SLA waktu pengantaran kurir.
            </ThemedText>
          </Card>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: Spacing.one,
    marginTop: Spacing.two,
  },
  mainSpendCard: {
    padding: Spacing.five,
    backgroundColor: '#0D9488', // Teal primary color override for banner
    borderColor: '#0F766E',
  },
  spendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  spendTitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  spendedValue: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    marginTop: Spacing.two,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  statCard: {
    width: '47.5%',
    padding: Spacing.three * 1.2,
    gap: 4,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
  },
  statVal: {
    fontSize: 15,
  },
  breakdownCard: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  breakdownRow: {
    gap: Spacing.one,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barBackground: {
    height: 8,
    borderRadius: 99,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 99,
  },
  infoCard: {
    padding: Spacing.four,
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
