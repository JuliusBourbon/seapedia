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
import { Wallet, ShoppingBag, MapPin, BarChart3, LogOut, RefreshCcw, User } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';

interface Transaction {
  id: string;
  type: 'TOPUP' | 'PAYMENT' | 'REFUND';
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
}

interface SummaryData {
  walletBalance: number;
  activeOrders: number;
  recentTransactions: Transaction[];
}

export default function BuyerDashboardScreen() {
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
      const response = await api.get('/dashboard/buyer/summary');
      if (response.data?.success) {
        setSummary(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat ringkasan dasbor.');
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
            // Silently ignore logout API errors and clear auth locally anyway
          } finally {
            clearAuth();
            setLoggingOut(false);
            router.replace('/(public)/(tabs)/login');
          }
        },
      },
    ]);
  };

  const formattedBalance = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(summary?.walletBalance ?? 0);

  const getTxTypeBadge = (type: string) => {
    switch (type) {
      case 'TOPUP':
        return <Badge label="Top Up" variant="success" />;
      case 'PAYMENT':
        return <Badge label="Bayar" variant="danger" />;
      case 'REFUND':
        return <Badge label="Refund" variant="primary" />;
      default:
        return <Badge label={type} variant="neutral" />;
    }
  };

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={{ marginTop: Spacing.three, color: theme.textSecondary }}>
          Mempersiapkan dasbor Anda...
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
        {/* Profile Card & Welcoming */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, { backgroundColor: `${theme.primary}15` }]}>
              <User size={32} color={theme.primary} />
            </View>
            <View style={styles.profileText}>
              <ThemedText type="smallBold" style={styles.profileName}>
                {user?.name}
              </ThemedText>
              <ThemedText style={styles.profileUsername} themeColor="textSecondary">
                @{user?.username} • Pembeli
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
              style={{ marginTop: Spacing.two }}
            />
          )}
        </Card>

        {/* Wallet balance display */}
        <Card style={styles.walletCard}>
          <View style={styles.walletRow}>
            <View>
              <ThemedText style={styles.walletLabel} themeColor="textSecondary">
                Saldo Dompet SEAPEDIA
              </ThemedText>
              <ThemedText style={styles.walletAmount}>
                {formattedBalance}
              </ThemedText>
            </View>
            <View style={[styles.walletIconContainer, { backgroundColor: `${theme.primary}20` }]}>
              <Wallet size={28} color={theme.primary} />
            </View>
          </View>
          <Button
            label="Kelola Dompet & Top-Up"
            onPress={() => router.push('/(buyer)/wallet-history')}
            style={styles.walletButton}
          />
        </Card>

        {/* Quick Stats Grid */}
        <View style={styles.statsContainer}>
          <Pressable
            style={styles.statBoxPressable}
            onPress={() => router.push('/(buyer)/(tabs)/orders')}
          >
            <Card style={styles.statCard}>
              <ShoppingBag size={24} color={theme.primary} />
              <View style={styles.statTextContainer}>
                <ThemedText type="subtitle" style={styles.statCount}>
                  {summary?.activeOrders ?? 0}
                </ThemedText>
                <ThemedText style={styles.statLabel} themeColor="textSecondary">
                  Pesanan Aktif
                </ThemedText>
              </View>
            </Card>
          </Pressable>

          <Pressable
            style={styles.statBoxPressable}
            onPress={() => router.push('/(buyer)/(tabs)/addresses')}
          >
            <Card style={styles.statCard}>
              <MapPin size={24} color={theme.secondary} />
              <View style={styles.statTextContainer}>
                <ThemedText type="smallBold" style={{ fontSize: 18 }}>
                  Kelola
                </ThemedText>
                <ThemedText style={styles.statLabel} themeColor="textSecondary">
                  Buku Alamat
                </ThemedText>
              </View>
            </Card>
          </Pressable>
        </View>

        {/* Recent Transactions List */}
        <View style={styles.sectionContainer}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Transaksi Terakhir
          </ThemedText>
          {summary && summary.recentTransactions.length > 0 ? (
            summary.recentTransactions.map((tx) => {
              const txFormatted = new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
              }).format(tx.amount);
              
              const isPositive = tx.type === 'TOPUP' || tx.type === 'REFUND';

              return (
                <Card key={tx.id} style={styles.txRow}>
                  <View style={styles.txLeft}>
                    {getTxTypeBadge(tx.type)}
                    <View style={styles.txDetails}>
                      <ThemedText type="smallBold" numberOfLines={1}>
                        {tx.description || 'Transaksi Dompet'}
                      </ThemedText>
                      <ThemedText style={{ fontSize: 11, marginTop: 2 }} themeColor="textSecondary">
                        {new Date(tx.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={[styles.txAmount, { color: isPositive ? theme.success : theme.danger }]}>
                    {isPositive ? '+' : '-'} {txFormatted}
                  </ThemedText>
                </Card>
              );
            })
          ) : (
            <Card style={styles.emptyCard}>
              <ThemedText style={{ color: theme.textSecondary }}>
                Belum ada transaksi dompet.
              </ThemedText>
            </Card>
          )}
        </View>

        {/* Quick Action Marketplace Catalog Link */}
        <Button
          label="Mulai Belanja di Pasar Laut"
          leftIcon={<ShoppingBag size={20} color="#FFFFFF" />}
          onPress={() => router.push('/(public)/(tabs)')}
          style={styles.actionBtn}
        />

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
  },
  profileCard: {
    marginBottom: Spacing.three,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    marginLeft: Spacing.four,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
  },
  profileUsername: {
    fontSize: 13,
    marginTop: 2,
  },
  walletCard: {
    marginBottom: Spacing.three,
    padding: Spacing.four,
  },
  walletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  walletAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0D9488', // Teal accent
    marginTop: Spacing.one,
  },
  walletIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletButton: {
    marginTop: Spacing.three,
    height: 44,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  statBoxPressable: {
    flex: 1,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
  },
  statTextContainer: {
    marginLeft: Spacing.three,
    flex: 1,
  },
  statCount: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionContainer: {
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.three,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
    padding: Spacing.three,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  txDetails: {
    marginLeft: Spacing.three,
    flex: 1,
    paddingRight: Spacing.two,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.four,
  },
  actionBtn: {
    marginBottom: Spacing.three,
    height: 50,
  },
  logoutBtn: {
    height: 50,
  },
});
