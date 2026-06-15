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
      <Card style={styles.historyCard}>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <ShieldCheck size={16} color={theme.success} />
            <ThemedText type="smallBold" style={{ fontSize: 13 }} themeColor="success">
              Pengiriman Selesai
            </ThemedText>
          </View>
          <ThemedText style={styles.earningText}>
            +{formatCurrency(item.earning)}
          </ThemedText>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Store size={14} color={theme.textSecondary} />
            <ThemedText style={styles.infoText} themeColor="textSecondary">
              Pickup: {item.order.store.name}
            </ThemedText>
          </View>

          <View style={styles.infoRow}>
            <MapPin size={14} color={theme.textSecondary} />
            <ThemedText style={styles.infoText} themeColor="textSecondary">
              Tujuan: {item.order.address.recipientName} ({item.order.address.city})
            </ThemedText>
          </View>

          <View style={styles.infoRow}>
            <Calendar size={14} color={theme.textSecondary} />
            <ThemedText style={styles.infoText} themeColor="textSecondary">
              Waktu Selesai: {formattedDate}
            </ThemedText>
          </View>

          <ThemedText style={styles.orderIdText} themeColor="textSecondary">
            ID Job: {item.id}
          </ThemedText>
        </View>
      </Card>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <ClipboardList size={52} color={theme.placeholder} />
        <ThemedText style={{ color: theme.textSecondary, marginTop: Spacing.three, textAlign: 'center' }}>
          {error ? error : 'Anda belum memiliki riwayat pengiriman selesai.'}
        </ThemedText>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={{ marginTop: Spacing.three, color: theme.textSecondary }}>
          Mengambil data pendapatan Anda...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Earnings Overview Header */}
      <View style={[styles.headerSection, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <View style={styles.summaryBox}>
          <Wallet size={28} color={theme.primary} />
          <View style={styles.summaryText}>
            <ThemedText style={{ fontSize: 13 }} themeColor="textSecondary">
              Akumulasi Saldo Mitra
            </ThemedText>
            <ThemedText type="title" style={styles.totalEarnings}>
              {formatCurrency(summary?.totalEarnings ?? 0)}
            </ThemedText>
          </View>
        </View>

        <View style={[styles.dividerVertical, { backgroundColor: theme.border }]} />

        <View style={styles.jobsCountBox}>
          <CheckCircle2 size={28} color={theme.success} />
          <View style={styles.summaryText}>
            <ThemedText style={{ fontSize: 13 }} themeColor="textSecondary">
              Total Order
            </ThemedText>
            <ThemedText type="subtitle" style={styles.totalJobs}>
              {summary?.totalCompletedJobs ?? 0} Job
            </ThemedText>
          </View>
        </View>
      </View>

      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  summaryBox: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  jobsCountBox: {
    flex: 0.8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingLeft: Spacing.two,
  },
  summaryText: {
    gap: 2,
  },
  totalEarnings: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0D9488',
  },
  totalJobs: {
    fontSize: 16,
    fontWeight: '800',
  },
  dividerVertical: {
    width: 1.5,
    height: 40,
    marginHorizontal: Spacing.two,
  },
  listContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.five,
  },
  historyCard: {
    marginBottom: Spacing.three,
    padding: Spacing.four,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    paddingBottom: Spacing.two,
    marginBottom: Spacing.two,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  earningText: {
    fontWeight: '800',
    color: '#10B981', // green
    fontSize: 15,
  },
  cardBody: {
    gap: Spacing.two,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  infoText: {
    fontSize: 13,
  },
  orderIdText: {
    fontSize: 10,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.five,
  },
});
