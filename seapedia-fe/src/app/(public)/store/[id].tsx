import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Store, ShieldAlert } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ProductCard, ProductData } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import api from '@/services/api';

interface StoreDetail {
  id: string;
  name: string;
  description: string | null;
  products: ProductData[];
}

export default function StoreDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [store, setStore] = useState<StoreDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStoreDetails = async () => {
    try {
      setError(null);
      const response = await api.get(`/stores/${id}`);
      if (response.data?.success) {
        setStore(response.data.data);
      } else {
        setError('Gagal memuat detail toko');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) fetchStoreDetails();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStoreDetails();
  };

  const renderHeader = () => {
    if (!store) return null;
    return (
      <View className='bg-white/5 mb-4'>
        <View className="w-full px-4 py-4 flex-row items-center gap-4">
          <Store size={36} color="#FFFFFF" />
          <View className="flex-1">
            <ThemedText className="text-white text-xl font-extrabold">{store.name}</ThemedText>
            <ThemedText className="text-white/85 text-[13px] mt-[2px]">
              {store.description || 'Nelayan / Toko Maritim Terpercaya'}
            </ThemedText>
          </View>

        </View>

        <View className="px-4 pb-4 flex items-end">
          <ThemedText className='font-semibold'>
            Produk Toko ({store.products?.length || 0})
          </ThemedText>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View className="items-center justify-center py-12">
        <ThemedText className="text-textSecondary">
          Toko ini belum memiliki produk yang dijual.
        </ThemedText>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText className="mt-4 text-textSecondary">
          Memuat halaman toko maritim...
        </ThemedText>
      </ThemedView>
    );
  }

  if (error || !store) {
    return (
      <ThemedView className="flex-1 items-center justify-center p-8">
        <ShieldAlert size={48} color={theme.danger} />
        <ThemedText className="text-base font-semibold mt-4 text-center">{error || 'Toko tidak ditemukan'}</ThemedText>
        <Button label="Kembali" onPress={() => router.back()} className="mt-6" />
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <FlatList
        data={store.products || []}
        renderItem={({ item }) => (
          <ProductCard
            product={{ ...item, store: { id: store.id, name: store.name } }}
            showAddToCart={false}
          />
        )}
        keyExtractor={(item) => item.id}
        numColumns={Platform.OS === 'web' ? undefined : 2}
        contentContainerClassName={Platform.OS === 'web' ? "flex-row flex-wrap justify-center px-4 pb-8" : "pb-8"}
        columnWrapperClassName={Platform.OS !== 'web' && store.products?.length > 0 ? "justify-between px-2" : undefined}
        ListHeaderComponent={renderHeader}
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
