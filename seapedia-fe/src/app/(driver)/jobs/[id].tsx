import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Truck, MapPin, Store, Calendar, CreditCard, ShieldAlert, Phone, User, Package, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spacing } from '@/constants/theme';
import { DELIVERY_METHODS, DELIVERY_STATUS_LABELS } from '@/constants/config';
import api from '@/services/api';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface JobDetail {
  id: string;
  orderId: string;
  status: 'AVAILABLE' | 'TAKEN' | 'COMPLETED' | 'CANCELLED';
  earning: number;
  takenAt: string | null;
  completedAt: string | null;
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
    items: OrderItem[];
  };
}

export default function DriverJobDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchJobDetail = async () => {
    try {
      setError(null);
      const res = await api.get(`/driver/jobs/${id}`);
      if (res.data?.success) {
        setJob(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat rincian pekerjaan.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) fetchJobDetail();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobDetail();
  };

  const handleTakeJob = () => {
    if (!job) return;
    Alert.alert(
      'Ambil Pekerjaan',
      'Apakah Anda yakin ingin mengambil pekerjaan pengiriman ini? Anda wajib menyelesaikannya tepat waktu sesuai batas SLA.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Ambil',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await api.post(`/driver/jobs/${job.id}/take`);
              if (res.data?.success) {
                Alert.alert('Sukses', 'Pekerjaan berhasil diambil! Mengalihkan ke Dasbor.');
                router.replace('/(driver)/(tabs)/dashboard' as any);
              }
            } catch (err: any) {
              if (err.response?.status === 409) {
                Alert.alert('Gagal', 'Pekerjaan ini sudah diambil oleh kurir lain.');
                fetchJobDetail();
              } else {
                Alert.alert('Gagal', err.response?.data?.message || 'Gagal mengambil pekerjaan.');
              }
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCompleteJob = () => {
    if (!job) return;
    Alert.alert(
      'Selesaikan Pekerjaan',
      'Apakah Anda yakin telah mengirimkan pesanan ke alamat pembeli dan ingin menyelesaikan pekerjaan ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Selesai',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await api.post(`/driver/jobs/${job.id}/complete`);
              if (res.data?.success) {
                Alert.alert('Sukses', 'Pekerjaan berhasil diselesaikan!');
                router.replace('/(driver)/(tabs)/dashboard' as any);
              }
            } catch (err: any) {
              Alert.alert('Gagal', err.response?.data?.message || 'Gagal menyelesaikan pekerjaan.');
            } finally {
              setActionLoading(false);
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

  const getStatusBadge = (status: string) => {
    const label = DELIVERY_STATUS_LABELS[status as keyof typeof DELIVERY_STATUS_LABELS] || status;
    switch (status) {
      case 'AVAILABLE':
        return <Badge label={label} variant="success" />;
      case 'TAKEN':
        return <Badge label={label} variant="primary" />;
      case 'COMPLETED':
        return <Badge label="Selesai" variant="success" />;
      case 'CANCELLED':
        return <Badge label={label} variant="danger" />;
      default:
        return <Badge label={label} variant="neutral" />;
    }
  };

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={{ marginTop: Spacing.three, color: theme.textSecondary }}>
          Mengambil rincian pekerjaan...
        </ThemedText>
      </ThemedView>
    );
  }

  if (error || !job) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ShieldAlert size={48} color={theme.danger} />
        <ThemedText style={styles.errorText}>{error || 'Rincian pekerjaan tidak ditemukan'}</ThemedText>
        <Button label="Kembali" onPress={() => router.back()} style={{ marginTop: Spacing.four }} />
      </ThemedView>
    );
  }

  const deliveryMethodLabel = DELIVERY_METHODS[job.order.deliveryMethod]?.label || job.order.deliveryMethod;

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
        {/* Status Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View>
              <ThemedText style={styles.orderIdText} themeColor="textSecondary">
                ID Job Pengiriman:
              </ThemedText>
              <ThemedText style={styles.orderIdValue}>
                {job.id}
              </ThemedText>
            </View>
            {getStatusBadge(job.status)}
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.earningRow}>
            <Truck size={18} color={theme.primary} />
            <ThemedText style={{ fontSize: 14, fontWeight: '700', marginLeft: Spacing.two }}>
              Ongkos Kirim (Earning): {formatCurrency(job.earning)}
            </ThemedText>
          </View>
        </Card>

        {/* Route Card (Pickup & destination) */}
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Rute Pengiriman
        </ThemedText>
        <Card style={styles.cardPadding}>
          {/* Pickup */}
          <View style={styles.routePoint}>
            <View style={[styles.pointDot, { backgroundColor: theme.primary }]} />
            <View style={styles.routeDetails}>
              <ThemedText style={styles.pointLabel} themeColor="textSecondary">
                Penjemputan (Toko Nelayan)
              </ThemedText>
              <ThemedText type="smallBold" style={styles.pointValue}>
                {job.order.store.name}
              </ThemedText>
            </View>
          </View>

          {/* Line */}
          <View style={[styles.pointLine, { backgroundColor: theme.border }]} />

          {/* Dropoff */}
          <View style={styles.routePoint}>
            <View style={[styles.pointDot, { backgroundColor: theme.warning }]} />
            <View style={styles.routeDetails}>
              <View style={styles.destHeader}>
                <ThemedText style={styles.pointLabel} themeColor="textSecondary">
                  Tujuan (Penerima)
                </ThemedText>
                <Badge label={deliveryMethodLabel} variant="neutral" />
              </View>
              <ThemedText type="smallBold" style={styles.pointValue}>
                {job.order.address.recipientName} ({job.order.address.phoneNumber})
              </ThemedText>
              <ThemedText style={styles.addressText} themeColor="textSecondary">
                {job.order.address.fullAddress}, {job.order.address.city}, {job.order.address.postalCode}
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Items to Deliver */}
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Daftar Barang Bawaan
        </ThemedText>
        <Card style={styles.cardPadding}>
          {job.order.items.map((item, idx) => (
            <View key={item.id}>
              {idx > 0 && <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: Spacing.two }]} />}
              <View style={styles.itemRow}>
                <View style={styles.itemDetails}>
                  <ThemedText type="smallBold" style={{ fontSize: 14 }}>
                    {item.productName}
                  </ThemedText>
                  <ThemedText style={{ fontSize: 12, marginTop: 2 }} themeColor="textSecondary">
                    Jumlah: {item.quantity} item
                  </ThemedText>
                </View>
                <ThemedText style={{ fontSize: 12 }} themeColor="textSecondary">
                  {formatCurrency(item.price)} / pcs
                </ThemedText>
              </View>
            </View>
          ))}
        </Card>

        {/* Job Dates */}
        {job.status !== 'AVAILABLE' && (
          <Card style={styles.cardPadding}>
            {job.takenAt && (
              <View style={styles.dateInfoRow}>
                <Calendar size={16} color={theme.textSecondary} />
                <ThemedText style={styles.dateInfoText} themeColor="textSecondary">
                  Diambil pada: {new Date(job.takenAt).toLocaleString('id-ID')}
                </ThemedText>
              </View>
            )}
            {job.completedAt && (
              <View style={[styles.dateInfoRow, { marginTop: Spacing.two }]}>
                <CheckCircle2 size={16} color={theme.success} />
                <ThemedText style={styles.dateInfoText} themeColor="textSecondary">
                  Selesai pada: {new Date(job.completedAt).toLocaleString('id-ID')}
                </ThemedText>
              </View>
            )}
          </Card>
        )}

        {/* Action Button */}
        {job.status === 'AVAILABLE' && (
          <Button
            label="Ambil Pekerjaan Ini"
            variant="primary"
            size="large"
            loading={actionLoading}
            onPress={handleTakeJob}
            style={styles.actionButton}
          />
        )}

        {job.status === 'TAKEN' && (
          <Button
            label="Selesaikan Pengantaran"
            variant="primary"
            size="large"
            loading={actionLoading}
            leftIcon={<CheckCircle2 size={20} color="#FFFFFF" />}
            onPress={handleCompleteJob}
            style={styles.actionButton}
          />
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: Spacing.three,
    textAlign: 'center',
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
  headerCard: {
    padding: Spacing.four,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderIdText: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  orderIdValue: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
    marginTop: 2,
  },
  divider: {
    height: 1.5,
    marginVertical: Spacing.three,
  },
  earningRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardPadding: {
    padding: Spacing.four,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  pointDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  routeDetails: {
    flex: 1,
    gap: 2,
  },
  destHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  pointLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  pointValue: {
    fontSize: 15,
  },
  addressText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  pointLine: {
    width: 2,
    height: 25,
    marginLeft: 5,
    marginVertical: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    paddingRight: Spacing.three,
  },
  dateInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInfoText: {
    fontSize: 13,
    marginLeft: Spacing.two,
  },
  actionButton: {
    marginTop: Spacing.two,
  },
});
