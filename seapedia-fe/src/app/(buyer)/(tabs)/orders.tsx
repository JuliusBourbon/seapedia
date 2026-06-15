import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ShoppingBag, Calendar, ArrowRight, ShieldAlert } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spacing } from '@/constants/theme';
import { ORDER_STATUS_LABELS } from '@/constants/config';
import api from '@/services/api';

interface Order {
  id: string;
  storeId: string;
  store: {
    id: string;
    name: string;
  };
  deliveryMethod: string;
  subtotal: number;
  deliveryFee: number;
  ppn: number;
  total: number;
  status: 'SEDANG_DIKEMAS' | 'MENUNGGU_PENGIRIM' | 'SEDANG_DIKIRIM' | 'PESANAN_SELESAI' | 'DIKEMBALIKAN';
  createdAt: string;
}

export default function BuyerOrdersScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setError(null);
      const response = await api.get('/buyer/orders');
      if (response.data?.success) {
        setOrders(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat riwayat pesanan.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusBadge = (status: string) => {
    const label = ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] || status;
    switch (status) {
      case 'SEDANG_DIKEMAS':
        return <Badge label={label} variant="warning" />;
      case 'MENUNGGU_PENGIRIM':
        return <Badge label={label} variant="secondary" />;
      case 'SEDANG_DIKIRIM':
        return <Badge label={label} variant="primary" />;
      case 'PESANAN_SELESAI':
        return <Badge label={label} variant="success" />;
      case 'DIKEMBALIKAN':
        return <Badge label={label} variant="danger" />;
      default:
        return <Badge label={label} variant="neutral" />;
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const formattedDate = new Date(item.createdAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const formattedTotal = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(item.total);

    return (
      <Card style={styles.orderCard}>
        <View style={styles.cardHeader}>
          <View style={styles.storeContainer}>
            <ShoppingBag size={18} color={theme.primary} />
            <ThemedText type="smallBold" style={styles.storeName}>
              {item.store.name}
            </ThemedText>
          </View>
          {getStatusBadge(item.status)}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Calendar size={14} color={theme.textSecondary} />
            <ThemedText style={styles.infoText} themeColor="textSecondary">
              {formattedDate}
            </ThemedText>
          </View>
          
          <ThemedText style={styles.orderIdText} themeColor="textSecondary">
            ID: {item.id}
          </ThemedText>

          <View style={styles.priceRow}>
            <View>
              <ThemedText style={{ fontSize: 12 }} themeColor="textSecondary">
                Total Belanja
              </ThemedText>
              <ThemedText style={styles.totalPrice}>
                {formattedTotal}
              </ThemedText>
            </View>
            
            <Pressable
              onPress={() => router.push(`/(buyer)/orders/${item.id}` as any)}
              style={[styles.detailBtn, { backgroundColor: `${theme.primary}10` }]}
            >
              <ThemedText style={{ color: theme.primary, fontSize: 13, fontWeight: '700' }}>
                Rincian
              </ThemedText>
              <ArrowRight size={14} color={theme.primary} />
            </Pressable>
          </View>
        </View>
      </Card>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <ShoppingBag size={52} color={theme.placeholder} />
        <ThemedText style={{ color: theme.textSecondary, marginTop: Spacing.three, textAlign: 'center' }}>
          {error ? error : 'Anda belum memiliki riwayat pesanan.'}
        </ThemedText>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={{ marginTop: Spacing.three, color: theme.textSecondary }}>
          Mengambil riwayat belanja Anda...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
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
  orderCard: {
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
  storeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
    paddingRight: Spacing.two,
  },
  storeName: {
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
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: Spacing.two,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0D9488',
    marginTop: 2,
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: 8,
    gap: Spacing.one,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.five,
  },
});
