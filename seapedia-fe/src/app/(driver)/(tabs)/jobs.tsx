import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ClipboardList, MapPin, Store, DollarSign, Navigation, Info } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spacing } from '@/constants/theme';
import { DELIVERY_METHODS } from '@/constants/config';
import api from '@/services/api';

interface Job {
  id: string;
  orderId: string;
  status: 'AVAILABLE' | 'TAKEN' | 'COMPLETED' | 'CANCELLED';
  earning: number;
  order: {
    id: string;
    deliveryMethod: 'INSTANT' | 'NEXT_DAY' | 'REGULAR';
    total: number;
    status: string;
    store: {
      id: string;
      name: string;
    };
    address: {
      label: string;
      recipientName: string;
      phoneNumber: string;
      fullAddress: string;
      city: string;
      postalCode: string;
    };
  };
}

export default function DriverJobsScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [takingId, setTakingId] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setError(null);
      const res = await api.get('/driver/jobs');
      if (res.data?.success) {
        setJobs(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat lowongan pengiriman.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const handleTakeJob = (jobId: string) => {
    Alert.alert(
      'Ambil Pekerjaan',
      'Apakah Anda yakin ingin mengambil pekerjaan pengantaran ini? Anda wajib menyelesaikannya tepat waktu sesuai batas SLA.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Ambil',
          onPress: async () => {
            setTakingId(jobId);
            try {
              const res = await api.post(`/driver/jobs/${jobId}/take`);
              if (res.data?.success) {
                Alert.alert(
                  'Sukses',
                  'Pekerjaan berhasil diambil! Halaman akan diarahkan ke Dasbor untuk detail pengiriman.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        router.replace('/(driver)/(tabs)/dashboard' as any);
                      },
                    },
                  ]
                );
              }
            } catch (err: any) {
              if (err.response?.status === 409) {
                Alert.alert(
                  'Pekerjaan Terambil',
                  'Mohon maaf, pekerjaan ini baru saja diambil oleh kurir lain. Halaman akan dimuat ulang.'
                );
                fetchJobs();
              } else {
                Alert.alert('Gagal', err.response?.data?.message || 'Terjadi kesalahan saat mengambil pekerjaan.');
              }
            } finally {
              setTakingId(null);
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

  const renderJobItem = ({ item }: { item: Job }) => {
    const deliveryMethodLabel = DELIVERY_METHODS[item.order.deliveryMethod]?.label || item.order.deliveryMethod;

    return (
      <Card style={styles.jobCard}>
        <View style={styles.cardHeader}>
          <View style={styles.methodContainer}>
            <Navigation size={16} color={theme.primary} />
            <ThemedText type="smallBold" style={styles.methodLabel}>
              {deliveryMethodLabel}
            </ThemedText>
          </View>
          <Badge label="Tersedia" variant="success" />
        </View>

        <View style={styles.cardBody}>
          {/* Pickup */}
          <View style={styles.routeRow}>
            <Store size={16} color={theme.textSecondary} style={{ marginTop: 2 }} />
            <View style={styles.routeDetails}>
              <ThemedText style={styles.routeRole} themeColor="textSecondary">
                Penjemputan (Toko)
              </ThemedText>
              <ThemedText type="smallBold" style={styles.routeText}>
                {item.order.store.name}
              </ThemedText>
            </View>
          </View>

          {/* Destination */}
          <View style={styles.routeRow}>
            <MapPin size={16} color={theme.textSecondary} style={{ marginTop: 2 }} />
            <View style={styles.routeDetails}>
              <ThemedText style={styles.routeRole} themeColor="textSecondary">
                Tujuan (Kota)
              </ThemedText>
              <ThemedText type="smallBold" style={styles.routeText}>
                {item.order.address.recipientName} - {item.order.address.city}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.footerRow}>
            <View>
              <ThemedText style={{ fontSize: 11 }} themeColor="textSecondary">
                Earning Kurir
              </ThemedText>
              <ThemedText style={styles.earningVal}>
                {formatCurrency(item.earning)}
              </ThemedText>
            </View>

            <View style={styles.actions}>
              <Button
                label="Ambil"
                variant="primary"
                size="small"
                loading={takingId === item.id}
                onPress={() => handleTakeJob(item.id)}
                style={styles.takeBtn}
              />
              <Button
                label="Detail"
                variant="outline"
                size="small"
                onPress={() => router.push(`/(driver)/jobs/${item.id}` as any)}
                style={styles.detailBtn}
              />
            </View>
          </View>
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
          {error ? error : 'Saat ini tidak ada lowongan pekerjaan pengiriman yang tersedia.'}
        </ThemedText>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={{ marginTop: Spacing.three, color: theme.textSecondary }}>
          Mencari lowongan pekerjaan...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={jobs}
        renderItem={renderJobItem}
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
  listContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.five,
  },
  jobCard: {
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
  methodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  methodLabel: {
    fontSize: 14,
  },
  cardBody: {
    gap: Spacing.three,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  routeDetails: {
    flex: 1,
  },
  routeRole: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  routeText: {
    fontSize: 14,
    marginTop: 1,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.one,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D9488',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  takeBtn: {
    paddingHorizontal: Spacing.four,
    height: 36,
  },
  detailBtn: {
    paddingHorizontal: Spacing.three,
    height: 36,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.five,
  },
});
