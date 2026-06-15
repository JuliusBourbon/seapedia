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
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={{ marginTop: Spacing.three, color: theme.textSecondary }}>
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
        {/* Simulated Time Banner */}
        <Card style={styles.timeCard}>
          <View style={styles.timeHeader}>
            <Clock size={20} color={theme.primary} />
            <ThemedText type="smallBold" style={{ fontSize: 14, marginLeft: Spacing.two }}>
              Simulasi Jam Server Seapedia
            </ThemedText>
          </View>
          <ThemedText style={styles.timeVal}>
            {simulatedTimeFormatted}
          </ThemedText>

          <View style={styles.actionRow}>
            <Button
              label="Simulasikan +24 Jam"
              variant="primary"
              size="small"
              loading={simulating}
              leftIcon={<Play size={16} color="#FFFFFF" />}
              onPress={handleSimulateNextDay}
              style={{ flex: 1 }}
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
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Ketentuan Batas SLA Pengantaran
        </ThemedText>
        <Card style={styles.cardPadding}>
          <View style={styles.slaRow}>
            <ThemedText style={styles.slaLabel}>INSTANT</ThemedText>
            <ThemedText type="smallBold">3 Jam</ThemedText>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.slaRow}>
            <ThemedText style={styles.slaLabel}>NEXT DAY</ThemedText>
            <ThemedText type="smallBold">24 Jam</ThemedText>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.slaRow}>
            <ThemedText style={styles.slaLabel}>REGULAR</ThemedText>
            <ThemedText type="smallBold">72 Jam</ThemedText>
          </View>
        </Card>

        {/* Overdue Candidates list */}
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Pesanan Overdue Belum Diproses ({data?.overdueCandidates.length ?? 0})
        </ThemedText>
        {data?.overdueCandidates.length === 0 ? (
          <Card style={styles.emptyCard}>
            <CheckCircle2 size={32} color={theme.success} />
            <ThemedText style={styles.emptyText} themeColor="textSecondary">
              Tidak ada pesanan aktif yang melewati batas SLA saat ini.
            </ThemedText>
          </Card>
        ) : (
          data?.overdueCandidates.map((item) => (
            <Card key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <ThemedText style={styles.orderIdText} themeColor="textSecondary">
                  ID: {item.id}
                </ThemedText>
                <Badge label="Overdue" variant="danger" />
              </View>

              <View style={styles.itemBody}>
                <View style={styles.infoRow}>
                  <Store size={14} color={theme.textSecondary} />
                  <ThemedText style={styles.infoText} themeColor="textSecondary">
                    Toko: {item.store.name}
                  </ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <User size={14} color={theme.textSecondary} />
                  <ThemedText style={styles.infoText} themeColor="textSecondary">
                    Pembeli: @{item.buyer.username}
                  </ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <AlertTriangle size={14} color={theme.textSecondary} />
                  <ThemedText style={styles.infoText} themeColor="textSecondary">
                    Batas SLA: {new Date(item.slaDeadline).toLocaleString('id-ID')}
                  </ThemedText>
                </View>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <View style={styles.priceRow}>
                  <ThemedText style={{ fontSize: 12 }} themeColor="textSecondary">Total Transaksi</ThemedText>
                  <ThemedText type="smallBold" style={{ color: theme.danger }}>{formatCurrency(item.total)}</ThemedText>
                </View>
              </View>
            </Card>
          ))
        )}

        {/* Returned Orders history */}
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Riwayat Pesanan Dikembalikan ({data?.returnedOrders.length ?? 0})
        </ThemedText>
        {data?.returnedOrders.length === 0 ? (
          <Card style={styles.emptyCard}>
            <ThemedText style={styles.emptyText} themeColor="textSecondary">
              Belum ada riwayat pesanan yang dikembalikan.
            </ThemedText>
          </Card>
        ) : (
          data?.returnedOrders.map((item) => (
            <Card key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <ThemedText style={styles.orderIdText} themeColor="textSecondary">
                  ID: {item.id}
                </ThemedText>
                <Badge label="Dikembalikan" variant="neutral" />
              </View>

              <View style={styles.itemBody}>
                <View style={styles.infoRow}>
                  <Store size={14} color={theme.textSecondary} />
                  <ThemedText style={styles.infoText} themeColor="textSecondary">
                    Toko: {item.store.name}
                  </ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <User size={14} color={theme.textSecondary} />
                  <ThemedText style={styles.infoText} themeColor="textSecondary">
                    Pembeli: @{item.buyer.username}
                  </ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <Calendar size={14} color={theme.textSecondary} />
                  <ThemedText style={styles.infoText} themeColor="textSecondary">
                    Waktu Dikembalikan: {new Date(item.returnedAt).toLocaleString('id-ID')}
                  </ThemedText>
                </View>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <View style={styles.priceRow}>
                  <ThemedText style={{ fontSize: 12 }} themeColor="textSecondary">Dana Direfund</ThemedText>
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
  timeCard: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeVal: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: Spacing.one,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  cardPadding: {
    padding: Spacing.four,
  },
  slaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slaLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.two,
  },
  emptyCard: {
    padding: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  emptyText: {
    fontSize: 13.5,
    textAlign: 'center',
  },
  itemCard: {
    marginBottom: Spacing.two,
    padding: Spacing.four,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    paddingBottom: Spacing.two,
    marginBottom: Spacing.two,
  },
  orderIdText: {
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
  },
  itemBody: {
    gap: Spacing.one * 1.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  infoText: {
    fontSize: 13,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
