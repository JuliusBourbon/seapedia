import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Truck, MapPin, Store, Calendar, ShieldAlert, Package, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
        <ThemedText className="mt-3">
          Mengambil rincian pekerjaan...
        </ThemedText>
      </ThemedView>
    );
  }

  if (error || !job) {
    return (
      <ThemedView className="flex-1 items-center justify-center p-5">
        <ShieldAlert size={48} color={theme.danger} />
        <ThemedText className="font-semibold mt-3 text-center">{error || 'Rincian pekerjaan tidak ditemukan'}</ThemedText>
        <Button label="Kembali" onPress={() => router.back()} className="mt-4" />
      </ThemedView>
    );
  }

  const deliveryMethodLabel = DELIVERY_METHODS[job.order.deliveryMethod]?.label || job.order.deliveryMethod;

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
        <Card className="p-4 border rounded-md border-primary">
          <View className="flex-row justify-between items-start gap-2">
            <View className="flex-1">
              <ThemedText className="uppercase font-semibold">
                ID Job Pengiriman:
              </ThemedText>
              <ThemedText className="font-mono mt-[2px]">
                {job.id}
              </ThemedText>
            </View>
            <View className="flex-shrink items-end">
              {getStatusBadge(job.status)}
            </View>
          </View>

          <View className="h-[1.5px] my-3" style={{ backgroundColor: theme.neutral[400] }} />

          <View className="flex-row items-center justify-center gap-1">
            <Truck size={18} color={theme.primary} />
            <ThemedText type='large' className="font-medium">
              Earning:
            </ThemedText>
            <ThemedText type='large' className="font-bold text-primary">
              {formatCurrency(job.earning)}
            </ThemedText>
          </View>
        </Card>

        <View className="flex-row items-center gap-2">
          <View className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.primary }} />
          <ThemedText className="font-bold">Rute Pengiriman</ThemedText>
        </View>
        <Card className="p-4 border border-primary rounded-md">
          <View className="flex-row items-start gap-3">
            <View className="w-3 h-3 rounded-full mt-1" style={{ backgroundColor: theme.primary }} />
            <View className="flex-1 gap-[2px]">
              <ThemedText className="font-medium">
                Penjemputan (Toko)
              </ThemedText>
              <ThemedText className="font-semibold">
                {job.order.store.name}
              </ThemedText>
            </View>
          </View>

          <View className="w-[2px] h-[25px] ml-[5px] my-[2px]" style={{ backgroundColor: theme.neutral[500] }} />

          <View className="flex-row items-start gap-3">
            <View className="w-3 h-3 rounded-full mt-1" style={{ backgroundColor: theme.danger }} />
            <View className="flex-1 gap-[2px]">
              <View className="flex-row justify-between items-center mb-[2px]">
                <ThemedText className="font-medium">
                  Tujuan (Penerima)
                </ThemedText>
                <Badge label={deliveryMethodLabel} variant="neutral" />
              </View>
              <ThemedText className="font-semibold">
                {job.order.address.recipientName} ({job.order.address.phoneNumber})
              </ThemedText>
              <ThemedText className="leading-[18px] mt-[2px]">
                {job.order.address.fullAddress}, {job.order.address.city}, {job.order.address.postalCode}
              </ThemedText>
            </View>
          </View>
        </Card>

        <View className="flex-row items-center gap-2">
          <View className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.primary }} />
          <ThemedText className="font-bold">Daftar Barang Bawaan</ThemedText>
        </View>
        <Card className="p-4 border border-primary rounded-md">
          {job.order.items.map((item, idx) => (
            <View key={item.id}>
              {idx > 0 && <View className="h-[1.5px] my-2" style={{ backgroundColor: theme.neutral[400] }} />}
              <View className="flex-row justify-between items-center mb-2">
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
            </View>
          ))}
        </Card>

        {job.status !== 'AVAILABLE' && (
          <>
            <View className="flex-row items-center gap-2">
              <View className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.primary }} />
              <ThemedText className="font-bold">Informasi Waktu</ThemedText>
            </View>
            <Card className="p-4 border border-primary rounded-md">
              {job.takenAt && (
                <View className="flex-row items-center">
                  <Calendar size={16} color={theme.neutral[500]} />
                  <ThemedText className="ml-2">
                    Diambil pada: {new Date(job.takenAt).toLocaleString('id-ID')}
                  </ThemedText>
                </View>
              )}
              {job.completedAt && (
                <View className="flex-row items-center mt-2">
                  <CheckCircle2 size={16} color={theme.primary} />
                  <ThemedText className="ml-2">
                    Selesai pada: {new Date(job.completedAt).toLocaleString('id-ID')}
                  </ThemedText>
                </View>
              )}
            </Card>
          </>
        )}

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
