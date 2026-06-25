import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ShoppingBag, MapPin, Truck, Calendar, CreditCard, ShieldAlert } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OrderStatusTimeline } from '@/components/order-status-timeline';
import { ORDER_STATUS_LABELS, DELIVERY_METHODS } from '@/constants/config';
import api from '@/services/api';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface OrderDetail {
  id: string;
  buyerId: string;
  storeId: string;
  addressId: string;
  deliveryMethod: 'INSTANT' | 'NEXT_DAY' | 'REGULAR';
  subtotal: number;
  deliveryFee: number;
  ppn: number;
  total: number;
  status: string;
  discountCode: string | null;
  discountSource: string | null;
  discountAmount: number;
  createdAt: string;
  items: OrderItem[];
  statusHistory: {
    id: string;
    status: any;
    note: string | null;
    createdAt: string;
  }[];
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
  delivery: {
    status: 'AVAILABLE' | 'TAKEN' | 'COMPLETED' | 'CANCELLED';
    driver: {
      id: string;
      name: string;
      username: string;
    } | null;
    takenAt: string | null;
    completedAt: string | null;
  } | null;
}

export default function BuyerOrderDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetail = async () => {
    try {
      setError(null);
      const response = await api.get(`/buyer/orders/${id}`);
      if (response.data?.success) {
        setOrder(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat rincian pesanan.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrderDetail();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderDetail();
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  if (loading && !refreshing) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText className="mt-3">
          Mengambil rincian pesanan...
        </ThemedText>
      </ThemedView>
    );
  }

  if (error || !order) {
    return (
      <ThemedView className="flex-1 items-center justify-center p-5">
        <ShieldAlert size={48} color={theme.danger} />
        <ThemedText className="text-base font-semibold mt-3 text-center">{error || 'Rincian pesanan tidak ditemukan'}</ThemedText>
        <Button label="Kembali" onPress={() => router.back()} className="mt-4" />
      </ThemedView>
    );
  }

  const formattedDate = new Date(order.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <ThemedView className="flex-1">
      <ScrollView
        contentContainerClassName="p-4 pb-20 gap-3"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {/* Order Status Header Card */}
        <Card className="p-4 border rounded-md border-primary">
          <View className="flex-row justify-between items-start gap-2">
            <View className="flex-1">
              <ThemedText className="uppercase font-semibold">
                ID Pesanan:
              </ThemedText>
              <ThemedText className="font-mono mt-[2px]">
                {order.id}
              </ThemedText>
            </View>
            <View className="flex-shrink items-end">
              {getStatusBadge(order.status)}
            </View>
          </View>
          <View className="h-[1.5px] my-3" style={{ backgroundColor: theme.neutral[400] }} />
          <View className="flex-row items-center">
            <Calendar size={16} color={theme.neutral[500]} />
            <ThemedText className="text-[13px] ml-1">
              Waktu Transaksi: {formattedDate}
            </ThemedText>
          </View>
        </Card>

        {/* Status history timeline */}
        <View className="flex-row items-center gap-2">
          <View className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.primary }} />
          <ThemedText className="font-bold">Status Pengiriman</ThemedText>
        </View>
        <Card className="p-4 border rounded-md border-primary">
          <OrderStatusTimeline statusHistory={order.statusHistory} currentStatus={order.status} />
        </Card>

        {/* Shipping details (Courier/Driver) */}
        {order.status !== 'SEDANG_DIKEMAS' && (
          <>
            <View className="flex-row items-center gap-2">
              <View className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.primary }} />
              <ThemedText className="font-bold">Informasi Kurir</ThemedText>
            </View>
            <Card className="p-3 border rounded-md border-primary">
              <View className="flex-row items-center">
                <View className="w-11 h-11 rounded-lg items-center justify-center" style={{ backgroundColor: `${theme.primary}15` }}>
                  <Truck size={24} color={theme.primary} />
                </View>
                <View className="ml-3 flex-1">
                  <ThemedText type="smallBold">
                    {order.delivery?.driver ? order.delivery.driver.name : 'Mencari Kurir Pengirim...'}
                  </ThemedText>
                  <ThemedText>
                    {order.delivery?.driver ? `@${order.delivery.driver.username}` : 'Menunggu kurir mengambil pesanan.'}
                  </ThemedText>
                </View>
              </View>
            </Card>
          </>
        )}

        {/* Shipping address details */}
        <View className="flex-row items-center gap-2">
          <View className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.primary }} />
          <ThemedText className="font-bold">Alamat Pengantaran</ThemedText>
        </View>
        <Card className="p-4 border border-primary rounded-md">
          <View className="flex-row items-center">
            <MapPin size={18} color={theme.primary} />
            <ThemedText type="smallBold" className="ml-1">
              {order.address?.label ?? 'Alamat'}
            </ThemedText>
          </View>
          <View className="mt-2 gap-[2px]">
            <ThemedText type="smallBold" className="text-[14px]">
              {order.address?.recipientName ?? 'Penerima tidak diketahui'}
            </ThemedText>
            <ThemedText className="text-[13px]">
              {order.address?.phoneNumber ?? '-'}
            </ThemedText>
            <ThemedText className="text-[13px] leading-[18px] mt-1">
              {order.address ? `${order.address.fullAddress}, ${order.address.city}, ${order.address.postalCode}` : '-'}
            </ThemedText>
          </View>
        </Card>

        {/* List of items purchased */}
        <View className="flex-row items-center gap-2">
          <View className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.primary }} />
          <ThemedText className="font-bold">Barang Yang Dibeli</ThemedText>
        </View>
        <Card className="p-4 border border-primary rounded-md">
          <ThemedText className='font-semibold'>
            Toko: {order.store?.name}
          </ThemedText>
          <View className="h-[1.5px] my-2" style={{ backgroundColor: theme.neutral[400] }} />
          {order.items?.map((item) => (
            <View key={item.id} className="flex-row justify-between items-center mb-2">
              <View className="flex-1 pr-3">
                <ThemedText className="font-semibold">
                  {item.productName}
                </ThemedText>
                <ThemedText className="mt-[2px]">
                  {item.quantity} x {formatCurrency(item.price)}
                </ThemedText>
              </View>
              <ThemedText className="font-bold">
                {formatCurrency(item.subtotal)}
              </ThemedText>
            </View>
          ))}
        </Card>

        {/* Financial billing details */}
        <View className="flex-row items-center gap-2">
          <View className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.primary }} />
          <ThemedText className="font-bold">Rincian Transaksi</ThemedText>
        </View>
        <Card className="p-4 border border-primary rounded-md">
          <View className="gap-2">
            <View className="flex-row justify-between items-center">
              <ThemedText>Subtotal Belanja</ThemedText>
              <ThemedText className="font-semibold">{formatCurrency(order.subtotal)}</ThemedText>
            </View>

            {order.discountAmount > 0 && (
              <View className="flex-row justify-between items-center">
                <ThemedText className='text-primary'>
                  Diskon ({order.discountCode})
                </ThemedText>
                <ThemedText className="font-semibold text-primary" >
                  -{formatCurrency(order.discountAmount)}
                </ThemedText>
              </View>
            )}

            <View className="flex-row justify-between items-center">
              <ThemedText>Biaya Ongkos Kirim</ThemedText>
              <ThemedText className="font-semibold">{formatCurrency(order.deliveryFee)}</ThemedText>
            </View>

            <View className="flex-row justify-between items-center">
              <ThemedText>PPN (12%)</ThemedText>
              <ThemedText className="font-semibold">{formatCurrency(order.ppn)}</ThemedText>
            </View>

            <View className="h-[1.5px] my-2" style={{ backgroundColor: theme.neutral[400] }} />

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-2">
                <CreditCard size={18} color={theme.neutral[500]} />
                <ThemedText type="smallBold">Total Bayar</ThemedText>
              </View>
              <ThemedText className="font-bold text-primary">
                {formatCurrency(order.total)}
              </ThemedText>
            </View>
          </View>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}
