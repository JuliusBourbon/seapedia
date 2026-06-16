import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ClipboardList, MapPin, Store, DollarSign, Navigation, Info } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spacing } from '@/constants/theme';
import { DELIVERY_METHODS } from '@/constants/config';
import api from '@/services/api';

interface Job {
  id: string;
  orderId: string;
  status: 'AVAILABLE' | 'TAKEN' | 'COMPLETED' | 'CANCELLED';
  earning: number;
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
  };
}

export default function DriverJobsScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [takingId, setTakingId] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setError(null);
      const res = await api.get('/driver/jobs');
      if (res.data?.success) {
        setJobs(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat lowongan pengiriman.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const handleTakeJob = (jobId: string) => {
    Alert.alert(
      'Ambil Pekerjaan',
      'Apakah Anda yakin ingin mengambil pekerjaan pengantaran ini? Anda wajib menyelesaikannya tepat waktu sesuai batas SLA.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Ambil',
          onPress: async () => {
            setTakingId(jobId);
            try {
              const res = await api.post(`/driver/jobs/${jobId}/take`);
              if (res.data?.success) {
                Alert.alert(
                  'Sukses',
                  'Pekerjaan berhasil diambil! Halaman akan diarahkan ke Dasbor untuk detail pengiriman.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        router.replace('/(driver)/(tabs)/dashboard' as any);
                      },
                    },
                  ]
                );
              }
            } catch (err: any) {
              if (err.response?.status === 409) {
                Alert.alert(
                  'Pekerjaan Terambil',
                  'Mohon maaf, pekerjaan ini baru saja diambil oleh kurir lain. Halaman akan dimuat ulang.'
                );
                fetchJobs();
              } else {
                Alert.alert('Gagal', err.response?.data?.message || 'Terjadi kesalahan saat mengambil pekerjaan.');
              }
            } finally {
              setTakingId(null);
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

  const renderJobItem = ({ item }: { item: Job }) => {
    const deliveryMethodLabel = DELIVERY_METHODS[item.order.deliveryMethod]?.label || item.order.deliveryMethod;

    return (
      <Card className="mb-3 p-4">
        <View className="flex-row justify-between items-center border-b border-black/5 dark:border-white/5 pb-2 mb-2">
          <View className="flex-row items-center gap-2">
            <Navigation size={16} color={theme.primary} />
            <ThemedText type="smallBold" className="text-[14px]">
              {deliveryMethodLabel}
            </ThemedText>
          </View>
          <Badge label="Tersedia" variant="success" />
        </View>

        <View className="gap-3">
          {/* Pickup */}
          <View className="flex-row items-start gap-3">
            <Store size={16} color={theme.textSecondary} className="mt-[2px]" />
            <View className="flex-1">
              <ThemedText className="text-[11px] uppercase font-semibold" themeColor="textSecondary">
                Penjemputan (Toko)
              </ThemedText>
              <ThemedText type="smallBold" className="text-[14px] mt-[1px]">
                {item.order.store.name}
              </ThemedText>
            </View>
          </View>

          {/* Destination */}
          <View className="flex-row items-start gap-3">
            <MapPin size={16} color={theme.textSecondary} className="mt-[2px]" />
            <View className="flex-1">
              <ThemedText className="text-[11px] uppercase font-semibold" themeColor="textSecondary">
                Tujuan (Kota)
              </ThemedText>
              <ThemedText type="smallBold" className="text-[14px] mt-[1px]">
                {item.order.address.recipientName} - {item.order.address.city}
              </ThemedText>
            </View>
          </View>

          <View className="h-[1px] my-1" style={{ backgroundColor: theme.border }} />

          <View className="flex-row justify-between items-center">
            <View>
              <ThemedText className="text-[11px]" themeColor="textSecondary">
                Earning Kurir
              </ThemedText>
              <ThemedText className="text-[18px] font-extrabold text-[#0D9488] mt-[2px]">
                {formatCurrency(item.earning)}
              </ThemedText>
            </View>

            <View className="flex-row gap-2">
              <Button
                label="Ambil"
                variant="primary"
                size="small"
                loading={takingId === item.id}
                onPress={() => handleTakeJob(item.id)}
                className="px-4 h-9"
              />
              <Button
                label="Detail"
                variant="outline"
                size="small"
                onPress={() => router.push(`/(driver)/jobs/${item.id}` as any)}
                className="px-3 h-9"
              />
            </View>
          </View>
        </View>
      </Card>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View className="items-center justify-center py-6 px-5">
        <ClipboardList size={52} color={theme.placeholder} />
        <ThemedText className="text-center mt-3" themeColor="textSecondary">
          {error ? error : 'Saat ini tidak ada lowongan pekerjaan pengiriman yang tersedia.'}
        </ThemedText>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText className="mt-3" themeColor="textSecondary">
          Mencari lowongan pekerjaan...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <FlatList
        data={jobs}
        renderItem={renderJobItem}
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
