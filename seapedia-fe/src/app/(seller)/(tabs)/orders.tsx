import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ClipboardList, Calendar, ArrowRight, User, Package, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { ORDER_STATUS_LABELS } from '@/constants/config';
import api from '@/services/api';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
}

interface Order {
  id: string;
  buyerId: string;
  buyer: {
    id: string;
    name: string;
    username: string;
  };
  deliveryMethod: string;
  subtotal: number;
  deliveryFee: number;
  ppn: number;
  total: number;
  status: 'SEDANG_DIKEMAS' | 'MENUNGGU_PENGIRIM' | 'SEDANG_DIKIRIM' | 'PESANAN_SELESAI' | 'DIKEMBALIKAN';
  createdAt: string;
  items?: OrderItem[];
}

type FilterStatus = 'ALL' | 'SEDANG_DIKEMAS' | 'MENUNGGU_PENGIRIM' | 'SEDANG_DIKIRIM' | 'PESANAN_SELESAI' | 'DIKEMBALIKAN';

export default function SellerOrdersScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterStatus>('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setError(null);
      const response = await api.get('/seller/orders');
      if (response.data?.success) {
        setOrders(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat pesanan masuk.');
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

  const handleProcessOrder = (orderId: string) => {
    Alert.alert(
      'Proses Pesanan',
      'Pesanan akan dipindahkan ke status "Menunggu Pengirim" dan pekerjaan kurir (delivery job) akan otomatis dibuat. Apakah Anda yakin?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Proses',
          onPress: async () => {
            setProcessingId(orderId);
            try {
              const response = await api.patch(`/seller/orders/${orderId}/process`);
              if (response.data?.success) {
                Alert.alert('Sukses', 'Pesanan berhasil diproses dan menunggu kurir mengambilnya.');
                fetchOrders();
              }
            } catch (err: any) {
              Alert.alert(
                'Gagal Memproses',
                err.response?.data?.message || 'Terjadi kesalahan saat memproses pesanan.'
              );
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
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

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'ALL') return true;
    return order.status === activeTab;
  });

  const filterTabs: { key: FilterStatus; label: string }[] = [
    { key: 'ALL', label: 'Semua' },
    { key: 'SEDANG_DIKEMAS', label: 'Baru' },
    { key: 'MENUNGGU_PENGIRIM', label: 'Diproses' },
    { key: 'SEDANG_DIKIRIM', label: 'Dikirim' },
    { key: 'PESANAN_SELESAI', label: 'Selesai' },
    { key: 'DIKEMBALIKAN', label: 'Kembali' },
  ];

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

    // Get order item summary description
    let itemsSummary = '';
    if (item.items && item.items.length > 0) {
      const firstItem = item.items[0];
      itemsSummary = `${firstItem.productName} (${firstItem.quantity} pcs)`;
      if (item.items.length > 1) {
        itemsSummary += ` & ${item.items.length - 1} produk lainnya`;
      }
    } else {
      itemsSummary = 'Lihat detail untuk daftar barang';
    }

    return (
      <Card style={styles.orderCard}>
        <View style={styles.cardHeader}>
          <View style={styles.buyerContainer}>
            <User size={16} color={theme.textSecondary} />
            <ThemedText type="smallBold" style={styles.buyerName}>
              {item.buyer.name} (@{item.buyer.username})
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

          <View style={styles.infoRow}>
            <Package size={14} color={theme.textSecondary} />
            <ThemedText style={styles.infoText} themeColor="textSecondary" numberOfLines={1}>
              {itemsSummary}
            </ThemedText>
          </View>

          <ThemedText style={styles.orderIdText} themeColor="textSecondary">
            ID: {item.id}
          </ThemedText>

          <View style={styles.footerRow}>
            <View>
              <ThemedText style={{ fontSize: 11 }} themeColor="textSecondary">
                Total Pendapatan
              </ThemedText>
              <ThemedText style={styles.totalPrice}>
                {formattedTotal}
              </ThemedText>
            </View>

            <View style={styles.actionRow}>
              <Pressable
                onPress={() => router.push(`/(seller)/orders/${item.id}` as any)}
                style={[styles.detailBtn, { backgroundColor: `${theme.primary}10` }]}
              >
                <ThemedText style={{ color: theme.primary, fontSize: 13, fontWeight: '700' }}>
                  Rincian
                </ThemedText>
                <ArrowRight size={14} color={theme.primary} />
              </Pressable>
            </View>
          </View>

          {item.status === 'SEDANG_DIKEMAS' && (
            <Button
              label="Proses Pesanan"
              variant="primary"
              size="small"
              loading={processingId === item.id}
              onPress={() => handleProcessOrder(item.id)}
              style={styles.processBtn}
            />
          )}
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
          {error ? error : 'Tidak ada pesanan masuk untuk filter ini.'}
        </ThemedText>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={{ marginTop: Spacing.three, color: theme.textSecondary }}>
          Mengambil daftar pesanan masuk...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Horizontally Scrollable Filter Tabs */}
      <View style={[styles.tabContainer, { borderBottomColor: theme.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {filterTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tabItem,
                  isActive && { borderBottomColor: theme.primary },
                ]}
              >
                <ThemedText
                  style={[
                    styles.tabLabel,
                    { color: isActive ? theme.primary : theme.textSecondary },
                    isActive && { fontWeight: '700' },
                  ]}
                >
                  {tab.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredOrders}
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
  tabContainer: {
    borderBottomWidth: 1,
  },
  tabScrollContent: {
    paddingHorizontal: Spacing.four,
    height: 48,
    alignItems: 'center',
  },
  tabItem: {
    paddingHorizontal: Spacing.three,
    height: '100%',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
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
  buyerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
    paddingRight: Spacing.two,
  },
  buyerName: {
    fontSize: 14,
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
    flex: 1,
  },
  orderIdText: {
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
  },
  footerRow: {
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.one * 1.5,
    paddingHorizontal: Spacing.three,
    borderRadius: 8,
    gap: Spacing.one,
  },
  processBtn: {
    marginTop: Spacing.three,
    height: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.five,
  },
});
