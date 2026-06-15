import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Pressable,
  Keyboard,
} from 'react-native';
import { Wallet, PlusCircle } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spacing } from '@/constants/theme';
import api from '@/services/api';

interface Transaction {
  id: string;
  type: 'TOPUP' | 'PAYMENT' | 'REFUND';
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
}

export default function WalletHistoryScreen() {
  const theme = useTheme();

  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Top Up State
  const [topupAmount, setTopupAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);

  const fetchWalletData = async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        api.get('/buyer/wallet'),
        api.get('/buyer/wallet/transactions'),
      ]);

      if (walletRes.data?.success) {
        setBalance(Number(walletRes.data.data.balance));
      }
      if (txRes.data?.success) {
        setTransactions(txRes.data.data);
      }
    } catch (err: any) {
      Alert.alert('Gagal', err.response?.data?.message || 'Gagal mengambil data dompet.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWalletData();
  };

  const handleTopup = async () => {
    const amountNum = Number(topupAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setAmountError('Jumlah top-up harus berupa angka positif');
      return;
    }
    setAmountError(null);
    Keyboard.dismiss();

    setSubmitting(true);
    try {
      const response = await api.post('/buyer/wallet/topup', { amount: amountNum });
      if (response.data?.success) {
        Alert.alert(
          'Sukses',
          `Berhasil melakukan pengisian saldo sebesar ${new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
          }).format(amountNum)}.`
        );
        setTopupAmount('');
        fetchWalletData();
      }
    } catch (err: any) {
      Alert.alert('Gagal', err.response?.data?.message || 'Gagal memproses top-up.');
    } finally {
      setSubmitting(false);
    }
  };

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

  const quickAmounts = [50000, 100000, 250000, 500000];

  const renderHeader = () => {
    const formattedBalance = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(balance);

    return (
      <View style={styles.header}>
        {/* Wallet Balance Card */}
        <Card style={styles.walletCard}>
          <View style={styles.walletRow}>
            <View>
              <ThemedText style={styles.walletLabel} themeColor="textSecondary">
                Saldo Anda Saat Ini
              </ThemedText>
              <ThemedText style={styles.walletAmount}>{formattedBalance}</ThemedText>
            </View>
            <View style={[styles.walletIconContainer, { backgroundColor: `${theme.primary}20` }]}>
              <Wallet size={28} color={theme.primary} />
            </View>
          </View>
        </Card>

        {/* Topup Form Section */}
        <Card style={styles.topupCard}>
          <ThemedText type="smallBold" style={{ fontSize: 16, marginBottom: Spacing.two }}>
            Isi Ulang Saldo (Dummy)
          </ThemedText>
          <Input
            placeholder="Masukkan jumlah top-up (Rp)"
            value={topupAmount}
            onChangeText={(val) => {
              setTopupAmount(val);
              setAmountError(null);
            }}
            keyboardType="number-pad"
            error={amountError || undefined}
          />

          {/* Quick Selection Chips */}
          <View style={styles.chipsRow}>
            {quickAmounts.map((amount) => (
              <Pressable
                key={amount}
                onPress={() => {
                  setTopupAmount(amount.toString());
                  setAmountError(null);
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: theme.background,
                    borderColor: topupAmount === amount.toString() ? theme.primary : theme.border,
                  },
                ]}
              >
                <ThemedText style={{ fontSize: 12, fontWeight: '700' }}>
                  {(amount / 1000).toLocaleString('id-ID')}k
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <Button
            label="Isi Saldo Sekarang"
            leftIcon={<PlusCircle size={20} color="#FFFFFF" />}
            onPress={handleTopup}
            loading={submitting}
            disabled={!topupAmount}
            style={styles.topupButton}
          />
        </Card>

        <ThemedText type="smallBold" style={styles.historyTitle}>
          Riwayat Transaksi Dompet
        </ThemedText>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(item.amount);

    const isPositive = item.type === 'TOPUP' || item.type === 'REFUND';

    return (
      <Card style={styles.txRow}>
        <View style={styles.txLeft}>
          {getTxTypeBadge(item.type)}
          <View style={styles.txDetails}>
            <ThemedText type="smallBold" numberOfLines={1}>
              {item.description || 'Transaksi Dompet'}
            </ThemedText>
            <ThemedText style={{ fontSize: 11, marginTop: 2 }} themeColor="textSecondary">
              {new Date(item.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </ThemedText>
          </View>
        </View>
        <ThemedText style={[styles.txAmount, { color: isPositive ? theme.success : theme.danger }]}>
          {isPositive ? '+' : '-'} {formattedAmount}
        </ThemedText>
      </Card>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <Card style={styles.emptyCard}>
        <ThemedText style={{ color: theme.textSecondary }}>
          Belum ada riwayat transaksi dompet.
        </ThemedText>
      </Card>
    );
  };

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={{ marginTop: Spacing.three, color: theme.textSecondary }}>
          Mengambil data saldo & riwayat dompet...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
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
  header: {
    marginBottom: Spacing.three,
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
    fontSize: 26,
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
  topupCard: {
    padding: Spacing.four,
    marginBottom: Spacing.four,
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.two,
    gap: Spacing.two,
  },
  chip: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topupButton: {
    marginTop: Spacing.three,
    height: 48,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.two,
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
    paddingVertical: Spacing.five,
  },
});
