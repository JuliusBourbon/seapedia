import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Platform,
} from 'react-native';
import { Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ProductCard, ProductData } from '@/components/product-card';
import api from '@/services/api';

export default function MarketplaceHomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setError(null);
      const response = await api.get('/products');
      if (response.data?.success) {
        setProducts(response.data.data);
      } else {
        setError('Gagal memuat produk');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleSearchPress = () => {
    router.push('/(public)/(tabs)/explore');
  };

  const renderHeader = () => (
    <View className="w-full pb-4 py-5">
      <Pressable
        onPress={handleSearchPress}
        className="flex-row items-center mx-6 px-4 h-12 rounded-md border-[1.5px] mb-6 border-primaryShades-700"
      >
        <Search size={20} color={theme.neutral[800]} />
        <ThemedText className="text-placeholder ml-2" style={{ color: theme.primaryShades[700] }}>
          Cari
        </ThemedText>
      </Pressable>
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View className="items-center justify-center py-16">
        <ThemedText style={{ color: theme.primaryShades[700] }}>
          {error ? error : 'Belum ada produk yang dijual saat ini.'}
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView className="flex-1" style={{ backgroundColor: theme.neutral[100] }}>
      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText className="mt-4">
            Mencari produk..
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              showAddToCart={false}
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={Platform.OS === 'web' ? undefined : 2}
          contentContainerClassName={Platform.OS === 'web' ? "flex-row flex-wrap justify-center px-4 pb-8" : "pb-8"}
          columnWrapperClassName={Platform.OS !== 'web' && products.length > 0 ? "justify-between px-1" : undefined}
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
      )}
    </ThemedView>
  );
}
