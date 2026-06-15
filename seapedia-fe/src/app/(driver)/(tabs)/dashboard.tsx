import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Truck, CheckCircle2, Wallet, RefreshCcw, LogOut, Info, MapPin, Phone, User, Package, Calendar } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { DELIVERY_METHODS, ORDER_STATUS_LABELS } from '@/constants/config';
import api from '@/services/api';

interface SummaryData {
  hasActiveJob: boolean;
  activeJobId: string | null;
  completedJobs: number;
  totalEarnings: number;
}

interface ActiveJob {
  id: string;
  orderId: string;
  status: string;
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
    items?: {
      id: string;
      productName: string;
      quantity: number;
      price: number;
      subtotal: number;
    }[];
  };
}

export default function DriverDashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, clearAuth, roles } = useAuthStore();

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [activeJob, setActiveJob] = useState<ActiveJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      // Fetch summary
      const summaryRes = await api.get('/dashboard/driver/summary');
      if (summaryRes.data?.success) {
        const sumData = summaryRes.data.data;
        setSummary(sumData);

        if (sumData.hasActiveJob) {
          // Fetch active job details
          const activeJobRes = await api.get('/driver/jobs/active');
          if (activeJobRes.data?.success) {
            setActiveJob(activeJobRes.data.data);
          }
        } else {
          setActiveJob(null);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data dasbor kurir.');
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

  const handleCompleteJob = (jobId: string) => {
    Alert.alert(
      'Konfirmasi Selesai',
      'Apakah Anda yakin telah mengirimkan pesanan ke alamat pembeli dan ingin menyelesaikan pekerjaan ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Selesai',
          onPress: async () => {
            setCompleting(true);
            try {
              const res = await api.post(`/driver/jobs/${jobId}/complete`);
              if (res.data?.success) {
                Alert.alert('Sukses', 'Pekerjaan pengantaran berhasil diselesaikan! Pendapatan telah ditambahkan ke dompet Anda.');
                fetchData();
              }
            } catch (err: any) {
              Alert.alert('Gagal', err.response?.data?.message || 'Terjadi kesalahan saat menyelesaikan pekerjaan.');
            } finally {
              setCompleting(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar dari akun?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await api.post('/auth/logout');
          } catch (err) {
            // Local clear
          } finally {
            clearAuth();
            setLoggingOut(false);
            router.replace('/(public)/(tabs)/login');
          }
        },
      },
    ]);
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
          Memuat dasbor kurir Anda...
        </ThemedText>
      </ThemedView>
    );
  }

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
        {/* Profile Info Banner */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatarBox, { backgroundColor: `${theme.primary}15` }]}>
              <User size={36} color={theme.primary} />
            </View>
            <View style={styles.profileText}>
              <ThemedText type="smallBold" style={{ fontSize: 18 }}>
                {user?.name}
              </ThemedText>
              <ThemedText style={{ fontSize: 13 }} themeColor="textSecondary">
                Kurir Mitra (@{user?.username})
              </ThemedText>
            </View>
          </View>

          {roles.length > 1 && (
            <Button
              label="Pindah Peran Akun"
              variant="outline"
              size="small"
              leftIcon={<RefreshCcw size={16} color={theme.primary} />}
              onPress={() => router.push('/(public)/select-role')}
              style={{ marginTop: Spacing.three }}
            />
          )}
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Wallet size={24} color={theme.primary} />
            <ThemedText style={styles.statLabel} themeColor="textSecondary">
              Total Pendapatan
            </ThemedText>
            <ThemedText type="subtitle" style={styles.statVal}>
              {formatCurrency(summary?.totalEarnings ?? 0)}
            </ThemedText>
          </Card>

          <Card style={styles.statCard}>
            <CheckCircle2 size={24} color={theme.success} />
            <ThemedText style={styles.statLabel} themeColor="textSecondary">
              Order Selesai
            </ThemedText>
            <ThemedText type="subtitle" style={styles.statVal}>
              {summary?.completedJobs ?? 0}
            </ThemedText>
          </Card>
        </View>

        {/* Active Job Section */}
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Tugas Pengantaran Aktif
        </ThemedText>

        {activeJob ? (
          <Card style={styles.activeJobCard}>
            <View style={styles.jobHeader}>
              <Badge label="Pekerjaan Berlangsung" variant="primary" />
              <ThemedText style={styles.earningText}>
                Earning: {formatCurrency(activeJob.earning)}
              </ThemedText>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Pickup Location */}
            <View style={styles.routePoint}>
              <View style={[styles.pointDot, { backgroundColor: theme.primary }]} />
              <View style={styles.routeDetails}>
                <ThemedText style={styles.pointLabel} themeColor="textSecondary">
                  Lokasi Penjemputan (Toko Nelayan)
                </ThemedText>
                <ThemedText type="smallBold" style={styles.pointValue}>
                  {activeJob.order.store.name}
                </ThemedText>
              </View>
            </View>

            {/* Connecting line */}
            <View style={[styles.pointLine, { backgroundColor: theme.border }]} />

            {/* Destination Location */}
            <View style={styles.routePoint}>
              <View style={[styles.pointDot, { backgroundColor: theme.warning }]} />
              <View style={styles.routeDetails}>
                <View style={styles.destHeader}>
                  <ThemedText style={styles.pointLabel} themeColor="textSecondary">
                    Lokasi Pengantaran (Pembeli)
                  </ThemedText>
                  <Badge 
                    label={DELIVERY_METHODS[activeJob.order.deliveryMethod]?.label || activeJob.order.deliveryMethod} 
                    variant="neutral" 
                    style={{ paddingVertical: 1, paddingHorizontal: 4 }} 
                  />
                </View>
                <ThemedText type="smallBold" style={styles.pointValue}>
                  {activeJob.order.address.recipientName} ({activeJob.order.address.phoneNumber})
                </ThemedText>
                <ThemedText style={styles.addressText} themeColor="textSecondary">
                  {activeJob.order.address.fullAddress}, {activeJob.order.address.city}, {activeJob.order.address.postalCode}
                </ThemedText>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Items Summary */}
            {activeJob.order.items && activeJob.order.items.length > 0 && (
              <View style={styles.itemsSummary}>
                <ThemedText type="smallBold" style={{ fontSize: 13, marginBottom: Spacing.one }}>
                  Daftar Barang Bawaan:
                </ThemedText>
                {activeJob.order.items.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <Package size={14} color={theme.textSecondary} />
                    <ThemedText style={styles.itemText} themeColor="textSecondary">
                      {item.productName} (x{item.quantity})
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}

            <Button
              label="Selesaikan Pengantaran"
              variant="primary"
              size="large"
              loading={completing}
              leftIcon={<CheckCircle2 size={20} color="#FFFFFF" />}
              onPress={() => handleCompleteJob(activeJob.id)}
              style={styles.completeBtn}
            />

            <Button
              label="Lihat Rincian Rute"
              variant="outline"
              size="small"
              onPress={() => router.push(`/(driver)/jobs/${activeJob.id}` as any)}
              style={{ marginTop: Spacing.two }}
            />
          </Card>
        ) : (
          <Card style={styles.noJobCard}>
            <Info size={36} color={theme.placeholder} />
            <ThemedText style={styles.noJobText} themeColor="textSecondary">
              Anda tidak memiliki pekerjaan pengantaran aktif saat ini.
            </ThemedText>
            <Button
              label="Cari Lowongan Pengiriman"
              variant="primary"
              size="medium"
              leftIcon={<Truck size={18} color="#FFFFFF" />}
              onPress={() => router.push('/(driver)/(tabs)/jobs')}
              style={styles.findJobBtn}
            />
          </Card>
        )}

        {/* Logout Button */}
        <Button
          label="Keluar Dari Akun"
          variant="danger"
          leftIcon={<LogOut size={20} color="#FFFFFF" />}
          onPress={handleLogout}
          loading={loggingOut}
          style={styles.logoutBtn}
        />
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
  profileCard: {
    marginBottom: Spacing.two,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 60,
    height: 60,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    marginLeft: Spacing.four,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  statCard: {
    flex: 1,
    padding: Spacing.four,
    alignItems: 'flex-start',
    gap: Spacing.one,
  },
  statLabel: {
    fontSize: 12,
    marginTop: Spacing.one,
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: Spacing.one,
    marginTop: Spacing.two,
  },
  activeJobCard: {
    padding: Spacing.four,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningText: {
    fontWeight: '800',
    color: '#0D9488',
    fontSize: 15,
  },
  divider: {
    height: 1.5,
    marginVertical: Spacing.three,
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
  itemsSummary: {
    marginBottom: Spacing.three,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.half,
  },
  itemText: {
    fontSize: 13,
  },
  completeBtn: {
    height: 50,
  },
  noJobCard: {
    padding: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  noJobText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: Spacing.one,
    lineHeight: 20,
  },
  findJobBtn: {
    marginTop: Spacing.three,
    alignSelf: 'stretch',
  },
  logoutBtn: {
    marginTop: Spacing.four,
    height: 50,
  },
});
