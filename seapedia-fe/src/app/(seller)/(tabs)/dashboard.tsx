import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Store, ShoppingBag, ClipboardList, RefreshCcw, LogOut, Info } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';

interface SummaryData {
  hasStore: boolean;
  storeId: string | null;
  storeName: string | null;
  totalProducts: number;
  pendingOrders: number;
  totalIncome: number;
  note: string;
}

export default function SellerDashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, clearAuth, roles } = useAuthStore();

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchSummary = async () => {
    try {
      setError(null);
      const response = await api.get('/dashboard/seller/summary');
      if (response.data?.success) {
        const data = response.data.data;
        if (!data.hasStore) {
          router.replace('/(seller)/store-setup' as any);
          return;
        }
        setSummary(data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat ringkasan toko.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSummary();
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
            // Clear auth locally anyway
          } finally {
            clearAuth();
            setLoggingOut(false);
            router.replace('/(public)/(tabs)/login');
          }
        },
      },
    ]);
  };

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={{ marginTop: Spacing.three, color: theme.textSecondary }}>
          Memuat dasbor toko Anda...
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
        {/* Welcome Shop Banner */}
        <Card style={styles.bannerCard}>
          <View style={styles.bannerHeader}>
            <View style={[styles.storeIconBox, { backgroundColor: `${theme.primary}15` }]}>
              <Store size={36} color={theme.primary} />
            </View>
            <View style={styles.bannerText}>
              <ThemedText type="smallBold" style={{ fontSize: 18 }}>
                Toko: {summary?.storeName}
              </ThemedText>
              <ThemedText style={{ fontSize: 13 }} themeColor="textSecondary">
                Pemilik: {user?.name} (@{user?.username})
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

        {/* Dashboard Metrics Grid */}
        <View style={styles.metricsRow}>
          <Pressable
            style={styles.metricItem}
            onPress={() => router.push('/(seller)/(tabs)/products')}
          >
            <Card style={styles.metricCard}>
              <ShoppingBag size={24} color={theme.primary} />
              <View style={styles.metricInfo}>
                <ThemedText type="subtitle" style={styles.metricCount}>
                  {summary?.totalProducts ?? 0}
                </ThemedText>
                <ThemedText style={styles.metricLabel} themeColor="textSecondary">
                  Total Produk
                </ThemedText>
              </View>
            </Card>
          </Pressable>

          <Pressable
            style={styles.metricItem}
            onPress={() => router.push('/(seller)/(tabs)/orders')}
          >
            <Card style={styles.metricCard}>
              <ClipboardList size={24} color={theme.warning} />
              <View style={styles.metricInfo}>
                <ThemedText type="subtitle" style={styles.metricCount}>
                  {summary?.pendingOrders ?? 0}
                </ThemedText>
                <ThemedText style={styles.metricLabel} themeColor="textSecondary">
                  Order Baru
                </ThemedText>
              </View>
            </Card>
          </Pressable>
        </View>

        {/* Sales Revenue Note (Calculated starting Level 6) */}
        <Card style={styles.infoCard}>
          <View style={styles.infoTitleRow}>
            <Info size={20} color={theme.primary} />
            <ThemedText type="smallBold" style={{ marginLeft: Spacing.two }}>
              Informasi Finansial
            </ThemedText>
          </View>
          <ThemedText style={styles.infoDesc} themeColor="textSecondary">
            {summary?.note || 'Data pendapatan penjualan toko nelayan Anda akan mulai dihitung secara real-time pada Level 6.'}
          </ThemedText>
        </Card>

        {/* Store settings quick links */}
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Navigasi Toko
        </ThemedText>
        
        <Button
          label="Kelola Daftar Produk Jualan"
          leftIcon={<ShoppingBag size={20} color="#FFFFFF" />}
          onPress={() => router.push('/(seller)/(tabs)/products')}
          style={styles.actionBtn}
        />

        <Button
          label="Lihat Pesanan Masuk"
          leftIcon={<ClipboardList size={20} color="#FFFFFF" />}
          onPress={() => router.push('/(seller)/(tabs)/orders')}
          style={styles.actionBtn}
        />

        {/* Logout */}
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
  },
  bannerCard: {
    marginBottom: Spacing.three,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIconBox: {
    width: 60,
    height: 60,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    marginLeft: Spacing.four,
    flex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  metricItem: {
    flex: 1,
  },
  metricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
  },
  metricInfo: {
    marginLeft: Spacing.three,
    flex: 1,
  },
  metricCount: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  infoCard: {
    padding: Spacing.four,
    marginBottom: Spacing.four,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: Spacing.two,
  },
  sectionTitle: {
    fontSize: 14,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: Spacing.two,
    marginTop: Spacing.two,
  },
  actionBtn: {
    marginBottom: Spacing.three,
    height: 50,
  },
  logoutBtn: {
    marginTop: Spacing.two,
    height: 50,
  },
});
