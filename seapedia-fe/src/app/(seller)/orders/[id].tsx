import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ShoppingBag, MapPin, Truck, Calendar, CreditCard, ShieldAlert, User } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OrderStatusTimeline } from '@/components/order-status-timeline';
import { Spacing } from '@/constants/theme';
import { ORDER_STATUS_LABELS, DELIVERY_METHODS, DeliveryMethodType } from '@/constants/config';
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
  deliveryMethod: DeliveryMethodType;
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
  buyer: {
    id: string;
    name: string;
    username: string;
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

export default function SellerOrderDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchOrderDetail = async () => {
    try {
      setError(null);
      // As there is no specific GET /seller/orders/:id, we fetch all and find by ID
      const response = await api.get('/seller/orders');
      if (response.data?.success) {
        const foundOrder = response.data.data.find((o: OrderDetail) => o.id === id);
        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          setError('Pesanan tidak ditemukan.');
        }
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

  const handleProcessOrder = () => {
    if (!order) return;
    Alert.alert(
      'Proses Pesanan',
      'Apakah Anda yakin ingin memproses pesanan ini? Status akan diperbarui menjadi "Menunggu Pengirim" dan kurir akan dapat mengambil pekerjaan pengiriman ini.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Proses',
          onPress: async () => {
            setProcessing(true);
            try {
              const response = await api.patch(`/seller/orders/${order.id}/process`);
              if (response.data?.success) {
                Alert.alert('Sukses', 'Pesanan berhasil diproses.');
                fetchOrderDetail();
              }
            } catch (err: any) {
              Alert.alert(
                'Gagal Memproses',
                err.response?.data?.message || 'Terjadi kesalahan saat memproses pesanan.'
              );
            } finally {
              setProcessing(false);
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
        <ThemedText className="mt-3" themeColor="textSecondary">
          Mengambil rincian pesanan...
        </ThemedText>
      </ThemedView>
    );
  }

  if (error || !order) {
    return (
      <ThemedView className="flex-1 items-center justify-center p-5">
        <ShieldAlert size={48} color={theme.danger} />
        <ThemedText className="text-[16px] font-semibold mt-3 text-center">{error || 'Rincian pesanan tidak ditemukan'}</ThemedText>
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

  const deliveryMethodLabel = DELIVERY_METHODS[order.deliveryMethod]?.label || order.deliveryMethod;

  return (
    <ThemedView className="flex-1">
      <ScrollView
        contentContainerClassName="p-4 pb-5 gap-3"
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
        <Card className="p-4">
          <View className="flex-row justify-between items-center">
            <View>
              <ThemedText className="text-[11px] uppercase font-semibold" themeColor="textSecondary">
                ID Pesanan:
              </ThemedText>
              <ThemedText className="text-[13px] font-extrabold font-mono mt-[2px]">
                {order.id}
              </ThemedText>
            </View>
            {getStatusBadge(order.status)}
          </View>
          <View className="h-[1.5px] my-3" style={{ backgroundColor: theme.border }} />
          <View className="flex-row items-center">
            <Calendar size={16} color={theme.textSecondary} />
            <ThemedText className="text-[13px] ml-1" themeColor="textSecondary">
              Waktu Transaksi: {formattedDate}
            </ThemedText>
          </View>
        </Card>

        {/* Status history timeline */}
        <ThemedText type="smallBold" className="text-[12px] uppercase font-bold tracking-wider mb-1 mt-2">
          Status Pengiriman
        </ThemedText>
        <Card className="p-4">
          <OrderStatusTimeline statusHistory={order.statusHistory} currentStatus={order.status} />
        </Card>

        {/* Courier / Driver Info */}
        {order.status !== 'SEDANG_DIKEMAS' && (
          <>
            <ThemedText type="smallBold" className="text-[12px] uppercase font-bold tracking-wider mb-1 mt-2">
              Informasi Kurir Pengirim
            </ThemedText>
            <Card className="p-3">
              <View className="flex-row items-center">
                <View className="w-11 h-11 rounded-lg items-center justify-center" style={{ backgroundColor: `${theme.primary}15` }}>
                  <Truck size={24} color={theme.primary} />
                </View>
                <View className="ml-3 flex-1">
                  <ThemedText type="smallBold">
                    {order.delivery?.driver ? order.delivery.driver.name : 'Mencari Kurir...'}
                  </ThemedText>
                  <ThemedText className="text-[12px]" themeColor="textSecondary">
                    {order.delivery?.driver ? `@${order.delivery.driver.username}` : 'Menunggu kurir mengambil pesanan.'}
                  </ThemedText>
                </View>
              </View>
            </Card>
          </>
        )}

        {/* Buyer info */}
        <ThemedText type="smallBold" className="text-[12px] uppercase font-bold tracking-wider mb-1 mt-2">
          Informasi Pelanggan
        </ThemedText>
        <Card className="p-4">
          <View className="flex-row items-center">
            <User size={18} color={theme.primary} />
            <ThemedText type="smallBold" className="ml-1">
              {order.buyer.name}
            </ThemedText>
          </View>
          <ThemedText className="text-[13px] mt-1" themeColor="textSecondary">
            Username: @{order.buyer.username}
          </ThemedText>
        </Card>

        {/* Shipping address details */}
        <ThemedText type="smallBold" className="text-[12px] uppercase font-bold tracking-wider mb-1 mt-2">
          Alamat Pengiriman
        </ThemedText>
        <Card className="p-4">
          <View className="flex-row items-center">
            <MapPin size={18} color={theme.primary} />
            <ThemedText type="smallBold" className="ml-1">
              {order.address?.label || 'Alamat tidak tersedia'}
            </ThemedText>
          </View>
          {order.address ? (
            <View className="mt-2 gap-[2px]">
              <ThemedText type="smallBold" className="text-[14px]">
                Penerima: {order.address.recipientName}
              </ThemedText>
              <ThemedText className="text-[13px]" themeColor="textSecondary">
                Telepon: {order.address.phoneNumber}
              </ThemedText>
              <ThemedText className="text-[13px] leading-[18px] mt-1">
                {order.address.fullAddress}, {order.address.city}, {order.address.postalCode}
              </ThemedText>
            </View>
          ) : (
            <ThemedText className="text-[13px] mt-2" themeColor="textSecondary">
              Informasi detail alamat tidak dilampirkan oleh server.
            </ThemedText>
          )}
        </Card>

        {/* List of items purchased */}
        <ThemedText type="smallBold" className="text-[12px] uppercase font-bold tracking-wider mb-1 mt-2">
          Daftar Produk Dipesan
        </ThemedText>
        <Card className="p-4">
          {order.items.map((item, index) => (
            <View key={item.id}>
              {index > 0 && <View className="h-[1.5px] my-2" style={{ backgroundColor: theme.border }} />}
              <View className="flex-row justify-between items-center">
                <View className="flex-1 pr-3">
                  <ThemedText type="smallBold" className="text-[14px]">
                    {item.productName}
                  </ThemedText>
                  <ThemedText className="text-[12px] mt-[2px]" themeColor="textSecondary">
                    {item.quantity} x {formatCurrency(item.price)}
                  </ThemedText>
                </View>
                <ThemedText type="smallBold" className="text-[14px] font-bold">
                  {formatCurrency(item.subtotal)}
                </ThemedText>
              </View>
            </View>
          ))}
        </Card>

        {/* Financial billing details */}
        <ThemedText type="smallBold" className="text-[12px] uppercase font-bold tracking-wider mb-1 mt-2">
          Rincian Transaksi Keuangan
        </ThemedText>
        <Card className="p-4">
          <View className="gap-2">
            <View className="flex-row justify-between items-center">
              <ThemedText style={{ color: theme.textSecondary }}>Subtotal Belanja</ThemedText>
              <ThemedText className="text-[14px] font-semibold">{formatCurrency(order.subtotal)}</ThemedText>
            </View>

            {order.discountAmount > 0 && (
              <View className="flex-row justify-between items-center">
                <ThemedText style={{ color: theme.success }}>
                  Diskon Voucher ({order.discountCode})
                </ThemedText>
                <ThemedText className="text-[14px] font-semibold" style={{ color: theme.success }}>
                  -{formatCurrency(order.discountAmount)}
                </ThemedText>
              </View>
            )}

            <View className="flex-row justify-between items-center">
              <ThemedText style={{ color: theme.textSecondary }}>Layanan Pengiriman ({deliveryMethodLabel})</ThemedText>
              <ThemedText className="text-[14px] font-semibold">{formatCurrency(order.deliveryFee)}</ThemedText>
            </View>

            <View className="flex-row justify-between items-center">
              <ThemedText style={{ color: theme.textSecondary }}>PPN (12%)</ThemedText>
              <ThemedText className="text-[14px] font-semibold">{formatCurrency(order.ppn)}</ThemedText>
            </View>

            <View className="h-[1.5px] my-2" style={{ backgroundColor: theme.border }} />

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-2">
                <CreditCard size={18} color={theme.textSecondary} />
                <ThemedText type="smallBold">Total Pendapatan</ThemedText>
              </View>
              <ThemedText className="text-[18px] font-black" themeColor="primary">
                {formatCurrency(order.total)}
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Action Button at the bottom if status is SEDANG_DIKEMAS */}
        {order.status === 'SEDANG_DIKEMAS' && (
          <Button
            label="Proses Pesanan"
            variant="primary"
            size="large"
            loading={processing}
            onPress={handleProcessOrder}
            className="mt-2"
          />
        )}
      </ScrollView>
    </ThemedView>
  );
}
