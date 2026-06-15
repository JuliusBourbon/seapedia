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
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={{ marginTop: Spacing.three, color: theme.textSecondary }}>
          Mengambil rincian pesanan...
        </ThemedText>
      </ThemedView>
    );
  }

  if (error || !order) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ShieldAlert size={48} color={theme.danger} />
        <ThemedText style={styles.errorText}>{error || 'Rincian pesanan tidak ditemukan'}</ThemedText>
        <Button label="Kembali" onPress={() => router.back()} style={{ marginTop: Spacing.four }} />
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
        {/* Order Status Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View>
              <ThemedText style={styles.orderIdText} themeColor="textSecondary">
                ID Pesanan:
              </ThemedText>
              <ThemedText style={styles.orderIdValue}>
                {order.id}
              </ThemedText>
            </View>
            {getStatusBadge(order.status)}
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.dateRow}>
            <Calendar size={16} color={theme.textSecondary} />
            <ThemedText style={{ fontSize: 13, marginLeft: Spacing.one }} themeColor="textSecondary">
              Waktu Transaksi: {formattedDate}
            </ThemedText>
          </View>
        </Card>

        {/* Status history timeline */}
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Status Pengiriman
        </ThemedText>
        <Card style={styles.cardPadding}>
          <OrderStatusTimeline statusHistory={order.statusHistory} currentStatus={order.status} />
        </Card>

        {/* Courier / Driver Info */}
        {order.status !== 'SEDANG_DIKEMAS' && (
          <>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              Informasi Kurir Pengirim
            </ThemedText>
            <Card style={styles.driverCard}>
              <View style={styles.driverRow}>
                <View style={[styles.iconBox, { backgroundColor: `${theme.primary}15` }]}>
                  <Truck size={24} color={theme.primary} />
                </View>
                <View style={styles.driverInfo}>
                  <ThemedText type="smallBold">
                    {order.delivery?.driver ? order.delivery.driver.name : 'Mencari Kurir...'}
                  </ThemedText>
                  <ThemedText style={{ fontSize: 12 }} themeColor="textSecondary">
                    {order.delivery?.driver ? `@${order.delivery.driver.username}` : 'Menunggu kurir mengambil pesanan.'}
                  </ThemedText>
                </View>
              </View>
            </Card>
          </>
        )}

        {/* Buyer info */}
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Informasi Pelanggan
        </ThemedText>
        <Card style={styles.cardPadding}>
          <View style={styles.buyerHeaderRow}>
            <User size={18} color={theme.primary} />
            <ThemedText type="smallBold" style={{ marginLeft: Spacing.one }}>
              {order.buyer.name}
            </ThemedText>
          </View>
          <ThemedText style={{ fontSize: 13, marginTop: Spacing.one }} themeColor="textSecondary">
            Username: @{order.buyer.username}
          </ThemedText>
        </Card>

        {/* Shipping address details */}
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Alamat Pengiriman
        </ThemedText>
        <Card style={styles.cardPadding}>
          <View style={styles.addressHeaderRow}>
            <MapPin size={18} color={theme.primary} />
            <ThemedText type="smallBold" style={{ marginLeft: Spacing.one }}>
              {order.address?.label || 'Alamat tidak tersedia'}
            </ThemedText>
          </View>
          {order.address ? (
            <View style={{ marginTop: Spacing.two, gap: 2 }}>
              <ThemedText type="smallBold" style={{ fontSize: 14 }}>
                Penerima: {order.address.recipientName}
              </ThemedText>
              <ThemedText style={{ fontSize: 13 }} themeColor="textSecondary">
                Telepon: {order.address.phoneNumber}
              </ThemedText>
              <ThemedText style={styles.fullAddressText}>
                {order.address.fullAddress}, {order.address.city}, {order.address.postalCode}
              </ThemedText>
            </View>
          ) : (
            <ThemedText style={{ fontSize: 13, marginTop: Spacing.two }} themeColor="textSecondary">
              Informasi detail alamat tidak dilampirkan oleh server.
            </ThemedText>
          )}
        </Card>

        {/* List of items purchased */}
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Daftar Produk Dipesan
        </ThemedText>
        <Card style={styles.cardPadding}>
          {order.items.map((item, index) => (
            <View key={item.id}>
              {index > 0 && <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: Spacing.two }]} />}
              <View style={styles.itemRow}>
                <View style={styles.itemDetails}>
                  <ThemedText type="smallBold" style={{ fontSize: 14 }}>
                    {item.productName}
                  </ThemedText>
                  <ThemedText style={{ fontSize: 12, marginTop: 2 }} themeColor="textSecondary">
                    {item.quantity} x {formatCurrency(item.price)}
                  </ThemedText>
                </View>
                <ThemedText type="smallBold" style={styles.itemSubtotal}>
                  {formatCurrency(item.subtotal)}
                </ThemedText>
              </View>
            </View>
          ))}
        </Card>

        {/* Financial billing details */}
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Rincian Transaksi Keuangan
        </ThemedText>
        <Card style={styles.cardPadding}>
          <View style={styles.billingContainer}>
            <View style={styles.billingRow}>
              <ThemedText style={{ color: theme.textSecondary }}>Subtotal Belanja</ThemedText>
              <ThemedText style={styles.billingVal}>{formatCurrency(order.subtotal)}</ThemedText>
            </View>

            {order.discountAmount > 0 && (
              <View style={styles.billingRow}>
                <ThemedText style={{ color: theme.success }}>
                  Diskon Voucher ({order.discountCode})
                </ThemedText>
                <ThemedText style={[styles.billingVal, { color: theme.success }]}>
                  -{formatCurrency(order.discountAmount)}
                </ThemedText>
              </View>
            )}

            <View style={styles.billingRow}>
              <ThemedText style={{ color: theme.textSecondary }}>Layanan Pengiriman ({deliveryMethodLabel})</ThemedText>
              <ThemedText style={styles.billingVal}>{formatCurrency(order.deliveryFee)}</ThemedText>
            </View>

            <View style={styles.billingRow}>
              <ThemedText style={{ color: theme.textSecondary }}>PPN (12%)</ThemedText>
              <ThemedText style={styles.billingVal}>{formatCurrency(order.ppn)}</ThemedText>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: Spacing.two }]} />

            <View style={styles.billingTotalRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                <CreditCard size={18} color={theme.textSecondary} />
                <ThemedText type="smallBold">Total Pendapatan</ThemedText>
              </View>
              <ThemedText style={styles.totalPriceText} themeColor="primary">
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
            style={styles.actionButton}
          />
        )}
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: Spacing.three,
    textAlign: 'center',
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: Spacing.one,
    marginTop: Spacing.two,
  },
  headerCard: {
    padding: Spacing.four,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderIdText: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  orderIdValue: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
    marginTop: 2,
  },
  divider: {
    height: 1.5,
    marginVertical: Spacing.three,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardPadding: {
    padding: Spacing.four,
  },
  driverCard: {
    padding: Spacing.three,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInfo: {
    marginLeft: Spacing.three,
    flex: 1,
  },
  buyerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullAddressText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    paddingRight: Spacing.three,
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: '700',
  },
  billingContainer: {
    gap: Spacing.two,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billingVal: {
    fontSize: 14,
    fontWeight: '600',
  },
  billingTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalPriceText: {
    fontSize: 18,
    fontWeight: '900',
  },
  actionButton: {
    marginTop: Spacing.two,
  },
});
