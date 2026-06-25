import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ClipboardList, Calendar, ArrowRight, User, Package, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
      <Card className="mb-3 p-4 border border-primary rounded-md bg-neutral-50">
        <View className="flex-row justify-between items-center pb-2 mb-2">
          <View className="flex-row items-center gap-2 flex-1 pr-2">
            <User size={16} color={theme.neutral[700]} />
            <ThemedText className="font-semibold">
              {item.buyer.name} (@{item.buyer.username})
            </ThemedText>
          </View>
          {getStatusBadge(item.status)}
        </View>

        <View className="gap-2 border-t border-neutral-400">
          <View className="flex-row items-center gap-2 mt-2">
            <Calendar size={14} color={theme.neutral[700]} />
            <ThemedText className=" flex-1">
              {formattedDate}
            </ThemedText>
          </View>

          <View className="flex-row items-center gap-2">
            <Package size={14} color={theme.neutral[700]} />
            <ThemedText className=" flex-1" numberOfLines={1}>
              {itemsSummary}
            </ThemedText>
          </View>

          <ThemedText className=" font-mono">
            ID: {item.id}
          </ThemedText>

          <View className="flex-row justify-between items-end mt-2 border-t border-neutral-500">
            <View className='my-2'>
              <ThemedText className="font-semibold">
                Total Pendapatan
              </ThemedText>
              <ThemedText type='large' className="font-bold text-primary my-2">
                {formattedTotal}
              </ThemedText>
            </View>

            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => router.push(`/(seller)/orders/${item.id}` as any)}
                className="flex-row items-center py-1.5 px-3 rounded-lg gap-1"
                style={{ backgroundColor: `${theme.primary}10` }}
              >
                <ThemedText className=" font-bold" style={{ color: theme.primary }}>
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
              className="mt-3 h-10"
            />
          )}
        </View>
      </Card>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View className="items-center justify-center py-6 px-5">
        <ClipboardList size={52} color={theme.primary} />
        <ThemedText className="text-center mt-3">
          {error ? error : 'Tidak ada pesanan masuk untuk filter ini.'}
        </ThemedText>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText className="mt-3">
          Mengambil daftar pesanan masuk...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      {/* Horizontally Scrollable Filter Tabs */}
      <View className="border-b" style={{ borderBottomColor: theme.neutral[500] }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-4 h-12 items-center"
        >
          {filterTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={`px-3 h-full justify-center border-b-2 ${isActive ? 'border-primary' : 'border-transparent'}`}
                style={isActive ? { borderBottomColor: theme.primary } : {}}
              >
                <ThemedText
                  className={` ${isActive ? 'font-bold' : 'font-medium'}`}
                  style={{ color: isActive ? theme.primary : theme.neutral[700] }}
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
        contentContainerClassName="p-4 pb-5"
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
