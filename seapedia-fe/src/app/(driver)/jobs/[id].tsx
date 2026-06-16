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
import { Truck, MapPin, Store, Calendar, CreditCard, ShieldAlert, Phone, User, Package, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spacing } from '@/constants/theme';
import { DELIVERY_METHODS, DELIVERY_STATUS_LABELS } from '@/constants/config';
import api from '@/services/api';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface JobDetail {
  id: string;
  orderId: string;
  status: 'AVAILABLE' | 'TAKEN' | 'COMPLETED' | 'CANCELLED';
  earning: number;
  takenAt: string | null;
  completedAt: string | null;
  order: {
    id: string;
    deliveryMethod: 'INSTANT' | 'NEXT_DAY' | 'REGULAR';
    total: number;
    status: string;
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
    items: OrderItem[];
  };
}

export default function DriverJobDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchJobDetail = async () => {
    try {
      setError(null);
      const res = await api.get(`/driver/jobs/${id}`);
      if (res.data?.success) {
        setJob(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat rincian pekerjaan.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) fetchJobDetail();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobDetail();
  };

  const handleTakeJob = () => {
    if (!job) return;
    Alert.alert(
      'Ambil Pekerjaan',
      'Apakah Anda yakin ingin mengambil pekerjaan pengiriman ini? Anda wajib menyelesaikannya tepat waktu sesuai batas SLA.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Ambil',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await api.post(`/driver/jobs/${job.id}/take`);
              if (res.data?.success) {
                Alert.alert('Sukses', 'Pekerjaan berhasil diambil! Mengalihkan ke Dasbor.');
                router.replace('/(driver)/(tabs)/dashboard' as any);
              }
            } catch (err: any) {
              if (err.response?.status === 409) {
                Alert.alert('Gagal', 'Pekerjaan ini sudah diambil oleh kurir lain.');
                fetchJobDetail();
              } else {
                Alert.alert('Gagal', err.response?.data?.message || 'Gagal mengambil pekerjaan.');
              }
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCompleteJob = () => {
    if (!job) return;
    Alert.alert(
      'Selesaikan Pekerjaan',
      'Apakah Anda yakin telah mengirimkan pesanan ke alamat pembeli dan ingin menyelesaikan pekerjaan ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Selesai',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await api.post(`/driver/jobs/${job.id}/complete`);
              if (res.data?.success) {
                Alert.alert('Sukses', 'Pekerjaan berhasil diselesaikan!');
                router.replace('/(driver)/(tabs)/dashboard' as any);
              }
            } catch (err: any) {
              Alert.alert('Gagal', err.response?.data?.message || 'Gagal menyelesaikan pekerjaan.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (status: string) => {
    const label = DELIVERY_STATUS_LABELS[status as keyof typeof DELIVERY_STATUS_LABELS] || status;
    switch (status) {
      case 'AVAILABLE':
        return <Badge label={label} variant="success" />;
      case 'TAKEN':
        return <Badge label={label} variant="primary" />;
      case 'COMPLETED':
        return <Badge label="Selesai" variant="success" />;
      case 'CANCELLED':
        return <Badge label={label} variant="danger" />;
      default:
        return <Badge label={label} variant="neutral" />;
    }
  };

  if (loading && !refreshing) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText className="mt-3" themeColor="textSecondary">
          Mengambil rincian pekerjaan...
        </ThemedText>
      </ThemedView>
    );
  }

  if (error || !job) {
    return (
      <ThemedView className="flex-1 items-center justify-center p-5">
        <ShieldAlert size={48} color={theme.danger} />
        <ThemedText className="text-[16px] font-semibold mt-3 text-center">{error || 'Rincian pekerjaan tidak ditemukan'}</ThemedText>
        <Button label="Kembali" onPress={() => router.back()} className="mt-4" />
      </ThemedView>
    );
  }

  const deliveryMethodLabel = DELIVERY_METHODS[job.order.deliveryMethod]?.label || job.order.deliveryMethod;

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
        {/* Status Header Card */}
        <Card className="p-4">
          <View className="flex-row justify-between items-center">
            <View>
              <ThemedText className="text-[11px] uppercase font-semibold" themeColor="textSecondary">
                ID Job Pengiriman:
              </ThemedText>
              <ThemedText className="text-[13px] font-extrabold font-mono mt-[2px]">
                {job.id}
              </ThemedText>
            </View>
            {getStatusBadge(job.status)}
          </View>
          <View className="h-[1.5px] my-3" style={{ backgroundColor: theme.border }} />
          <View className="flex-row items-center">
            <Truck size={18} color={theme.primary} />
            <ThemedText className="text-[14px] font-bold ml-2">
              Ongkos Kirim (Earning): {formatCurrency(job.earning)}
            </ThemedText>
          </View>
        </Card>

        {/* Route Card (Pickup & destination) */}
        <ThemedText type="smallBold" className="text-[12px] uppercase font-bold tracking-wider mb-1 mt-2">
          Rute Pengiriman
        </ThemedText>
        <Card className="p-4">
          {/* Pickup */}
          <View className="flex-row items-start gap-3">
            <View className="w-3 h-3 rounded-full mt-1" style={{ backgroundColor: theme.primary }} />
            <View className="flex-1 gap-[2px]">
              <ThemedText className="text-[11px] uppercase font-semibold" themeColor="textSecondary">
                Penjemputan (Toko Nelayan)
              </ThemedText>
              <ThemedText type="smallBold" className="text-[15px]">
                {job.order.store.name}
              </ThemedText>
            </View>
          </View>

          {/* Line */}
          <View className="w-[2px] h-[25px] ml-[5px] my-[2px]" style={{ backgroundColor: theme.border }} />

          {/* Dropoff */}
          <View className="flex-row items-start gap-3">
            <View className="w-3 h-3 rounded-full mt-1" style={{ backgroundColor: theme.warning }} />
            <View className="flex-1 gap-[2px]">
              <View className="flex-row justify-between items-center mb-[2px]">
                <ThemedText className="text-[11px] uppercase font-semibold" themeColor="textSecondary">
                  Tujuan (Penerima)
                </ThemedText>
                <Badge label={deliveryMethodLabel} variant="neutral" />
              </View>
              <ThemedText type="smallBold" className="text-[15px]">
                {job.order.address.recipientName} ({job.order.address.phoneNumber})
              </ThemedText>
              <ThemedText className="text-[13px] leading-[18px] mt-[2px]" themeColor="textSecondary">
                {job.order.address.fullAddress}, {job.order.address.city}, {job.order.address.postalCode}
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Items to Deliver */}
        <ThemedText type="smallBold" className="text-[12px] uppercase font-bold tracking-wider mb-1 mt-2">
          Daftar Barang Bawaan
        </ThemedText>
        <Card className="p-4">
          {job.order.items.map((item, idx) => (
            <View key={item.id}>
              {idx > 0 && <View className="h-[1.5px] my-2" style={{ backgroundColor: theme.border }} />}
              <View className="flex-row justify-between items-center">
                <View className="flex-1 pr-3">
                  <ThemedText type="smallBold" className="text-[14px]">
                    {item.productName}
                  </ThemedText>
                  <ThemedText className="text-[12px] mt-[2px]" themeColor="textSecondary">
                    Jumlah: {item.quantity} item
                  </ThemedText>
                </View>
                <ThemedText className="text-[12px]" themeColor="textSecondary">
                  {formatCurrency(item.price)} / pcs
                </ThemedText>
              </View>
            </View>
          ))}
        </Card>

        {/* Job Dates */}
        {job.status !== 'AVAILABLE' && (
          <Card className="p-4">
            {job.takenAt && (
              <View className="flex-row items-center">
                <Calendar size={16} color={theme.textSecondary} />
                <ThemedText className="text-[13px] ml-2" themeColor="textSecondary">
                  Diambil pada: {new Date(job.takenAt).toLocaleString('id-ID')}
                </ThemedText>
              </View>
            )}
            {job.completedAt && (
              <View className="flex-row items-center mt-2">
                <CheckCircle2 size={16} color={theme.success} />
                <ThemedText className="text-[13px] ml-2" themeColor="textSecondary">
                  Selesai pada: {new Date(job.completedAt).toLocaleString('id-ID')}
                </ThemedText>
              </View>
            )}
          </Card>
        )}

        {/* Action Button */}
        {job.status === 'AVAILABLE' && (
          <Button
            label="Ambil Pekerjaan Ini"
            variant="primary"
            size="large"
            loading={actionLoading}
            onPress={handleTakeJob}
            className="mt-2"
          />
        )}

        {job.status === 'TAKEN' && (
          <Button
            label="Selesaikan Pengantaran"
            variant="primary"
            size="large"
            loading={actionLoading}
            leftIcon={<CheckCircle2 size={20} color="#FFFFFF" />}
            onPress={handleCompleteJob}
            className="mt-2"
          />
        )}
      </ScrollView>
    </ThemedView>
  );
}
