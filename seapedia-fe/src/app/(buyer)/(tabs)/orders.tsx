import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  Pressable,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ShoppingBag, Calendar, ArrowRight, Store, PackageOpen } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

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
      month: 'short',
      year: 'numeric',
    });

    const formattedTotal = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(item.total);

    return (
      <Card className="mb-4 p-4 border border-primary elevation-sm bg-neutral-50">
        <View className="flex-row justify-between items-center border-b pb-3 mb-3 border-neutral-500">
          <View className="flex-row items-center gap-2 flex-1 pr-2">
            <Store size={18} color={theme.primary} />
            <ThemedText type="smallBold" className="text-[14px]" style={{ color: theme.neutral[900] }}>
              {item.store.name}
            </ThemedText>
          </View>
          {getStatusBadge(item.status)}
        </View>

        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Calendar size={14} color={theme.neutral[500]} />
              <ThemedText className="text-[12px] font-medium" style={{ color: theme.neutral[600] }}>
                {formattedDate}
              </ThemedText>
            </View>
            <ThemedText className="text-[11px] font-mono font-bold" style={{ color: theme.neutral[400] }}>
              ID: {item.id.substring(0, 8).toUpperCase()}
            </ThemedText>
          </View>

          <View className="flex-row justify-between items-end mt-2">
            <View>
              <ThemedText className="text-[12px] font-semibold" style={{ color: theme.neutral[500] }}>
                Total Belanja
              </ThemedText>
              <ThemedText className="text-[16px] font-black mt-[2px]" style={{ color: theme.primary }}>
                {formattedTotal}
              </ThemedText>
            </View>

            <Pressable
              onPress={() => router.push(`/(buyer)/orders/${item.id}` as any)}
              className="flex-row items-center py-2 px-4 rounded-lg gap-1 active:opacity-70"
              style={{ backgroundColor: `${theme.primary}15` }}
            >
              <ThemedText className="text-[13px] font-bold" style={{ color: theme.primary }}>
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
      <View className="items-center justify-center py-10 px-5 mt-16">
        <View className="w-24 h-24 rounded-full items-center justify-center mb-5" style={{ backgroundColor: theme.neutral[100] }}>
          <PackageOpen size={44} color={theme.neutral[400]} />
        </View>
        <ThemedText type="smallBold" className="text-xl font-bold mb-2 text-center" style={{ color: theme.neutral[900] }}>
          Belum Ada Pesanan
        </ThemedText>
        <ThemedText className="text-[14px] text-center mb-8 px-4 leading-5" style={{ color: theme.neutral[500] }}>
          {error ? error : 'Anda belum pernah berbelanja di Seapedia. Yuk, mulai jelajahi produk kami sekarang!'}
        </ThemedText>
        <Button
          label="Mulai Belanja"
          onPress={() => router.push('/(public)/(tabs)')}
          className="w-[200px]"
        />
      </View>
    );
  };

  const renderSkeleton = () => (
    <ThemedView className="flex-1">
      <Animated.View style={{ opacity: pulseAnim }} className="p-4">
        {[1, 2, 3].map((i) => (
          <View key={i} className="mb-4 rounded-xl p-4" style={{ backgroundColor: theme.neutral[100], height: 140 }}>
            <View className="flex-row justify-between mb-4">
              <View className="h-5 w-1/3 rounded" style={{ backgroundColor: theme.neutral[200] }} />
              <View className="h-6 w-20 rounded-full" style={{ backgroundColor: theme.neutral[200] }} />
            </View>
            <View className="h-4 w-1/4 rounded mb-6" style={{ backgroundColor: theme.neutral[200] }} />
            <View className="flex-row justify-between items-center mt-auto">
              <View className="h-8 w-24 rounded" style={{ backgroundColor: theme.neutral[200] }} />
              <View className="h-8 w-24 rounded-lg" style={{ backgroundColor: theme.neutral[200] }} />
            </View>
          </View>
        ))}
      </Animated.View>
    </ThemedView>
  );

  if (loading && !refreshing) {
    return renderSkeleton();
  }

  return (
    <ThemedView className="flex-1" style={{ backgroundColor: theme.neutral[50] }}>
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
