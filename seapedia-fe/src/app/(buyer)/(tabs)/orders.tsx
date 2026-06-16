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
      <Card className="mb-3 p-4">
        <View className="flex-row justify-between items-center border-b border-black/5 dark:border-white/5 pb-2 mb-2">
          <View className="flex-row items-center gap-2 flex-1 pr-2">
            <ShoppingBag size={18} color={theme.primary} />
            <ThemedText type="smallBold" className="text-[15px]">
              {item.store.name}
            </ThemedText>
          </View>
          {getStatusBadge(item.status)}
        </View>

        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <Calendar size={14} color={theme.textSecondary} />
            <ThemedText className="text-[13px]" themeColor="textSecondary">
              {formattedDate}
            </ThemedText>
          </View>
          
          <ThemedText className="text-[11px] font-mono" themeColor="textSecondary">
            ID: {item.id}
          </ThemedText>

          <View className="flex-row justify-between items-end mt-2">
            <View>
              <ThemedText className="text-[12px]" themeColor="textSecondary">
                Total Belanja
              </ThemedText>
              <ThemedText className="text-base font-extrabold text-[#0D9488] mt-[2px]">
                {formattedTotal}
              </ThemedText>
            </View>
            
            <Pressable
              onPress={() => router.push(`/(buyer)/orders/${item.id}` as any)}
              className="flex-row items-center py-1 px-3 rounded-lg gap-1"
              style={{ backgroundColor: `${theme.primary}10` }}
            >
              <ThemedText className="text-[13px] font-bold" themeColor="primary">
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
      <View className="items-center justify-center py-6 px-5">
        <ShoppingBag size={52} color={theme.placeholder} />
        <ThemedText className="text-center mt-3" themeColor="textSecondary">
          {error ? error : 'Anda belum memiliki riwayat pesanan.'}
        </ThemedText>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText className="mt-3" themeColor="textSecondary">
          Mengambil riwayat belanja Anda...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <FlatList
        data={orders}
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
