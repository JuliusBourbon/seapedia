import React, { useEffect, useState } from 'react';
import {
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
      <View className="mb-3">
        {/* Wallet Balance Card */}
        <Card className="mb-3 p-4">
          <View className="flex-row justify-between items-center">
            <View>
              <ThemedText className="text-[12px] font-semibold uppercase tracking-wider" themeColor="textSecondary">
                Saldo Anda Saat Ini
              </ThemedText>
              <ThemedText className="text-[26px] font-black text-[#0D9488] mt-1">{formattedBalance}</ThemedText>
            </View>
            <View className="w-[52px] h-[52px] rounded-xl items-center justify-center" style={{ backgroundColor: `${theme.primary}20` }}>
              <Wallet size={28} color={theme.primary} />
            </View>
          </View>
        </Card>

        {/* Topup Form Section */}
        <Card className="p-4 mb-4">
          <ThemedText type="smallBold" className="text-base mb-2">
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
          <View className="flex-row justify-between my-2 gap-2">
            {quickAmounts.map((amount) => (
              <Pressable
                key={amount}
                onPress={() => {
                  setTopupAmount(amount.toString());
                  setAmountError(null);
                }}
                className={`flex-1 h-[38px] rounded-lg border-[1.5px] items-center justify-center ${topupAmount === amount.toString() ? 'border-primary' : 'border-border'}`}
                style={{ backgroundColor: theme.background }}
              >
                <ThemedText className="text-[12px] font-bold">
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
            className="mt-3 h-12"
          />
        </Card>

        <ThemedText type="smallBold" className="text-base font-bold mb-2">
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
      <Card className="flex-row justify-between items-center mb-2 p-3">
        <View className="flex-row items-center flex-1">
          {getTxTypeBadge(item.type)}
          <View className="ml-3 flex-1 pr-2">
            <ThemedText type="smallBold" numberOfLines={1}>
              {item.description || 'Transaksi Dompet'}
            </ThemedText>
            <ThemedText className="text-[11px] mt-[2px]" themeColor="textSecondary">
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
        <ThemedText className={`text-[14px] font-extrabold ${isPositive ? 'text-success' : 'text-danger'}`}>
          {isPositive ? '+' : '-'} {formattedAmount}
        </ThemedText>
      </Card>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <Card className="items-center justify-center py-5">
        <ThemedText themeColor="textSecondary">
          Belum ada riwayat transaksi dompet.
        </ThemedText>
      </Card>
    );
  };

  if (loading && !refreshing) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText className="mt-4" themeColor="textSecondary">
          Mengambil data saldo & riwayat dompet...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerClassName="p-4 pb-5"
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
