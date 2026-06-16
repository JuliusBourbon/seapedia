import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Anchor, Store } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ProductCard, ProductData } from '@/components/product-card';
import api from '@/services/api';

const { width } = Dimensions.get('window');

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
    <View className="w-full pb-4">
      {/* Ocean Welcome Banner */}
      <LinearGradient
        colors={['#0F766E', '#0D9488', '#0EA5E9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="py-8 px-6 rounded-b-[24px] shadow-lg shadow-[#0D9488]/10 elevation-5 mb-6"
      >
        <View className="items-center">
          <Anchor size={40} color="#FFFFFF" className="mb-2" />
          <ThemedText 
            className="text-white text-[32px] font-black tracking-widest"
            style={{ textShadowColor: 'rgba(0, 0, 0, 0.2)', textShadowOffset: { width: 1, height: 2 }, textShadowRadius: 4 }}
          >
            SEAPEDIA
          </ThemedText>
          <ThemedText className="text-white/90 text-sm font-semibold text-center mt-1">
            Marketplace Multi-Role Hasil Laut & Maritim Terlengkap
          </ThemedText>
        </View>
      </LinearGradient>

      {/* Fake Search Bar Button */}
      <Pressable 
        onPress={handleSearchPress} 
        className="flex-row items-center mx-6 px-4 h-12 rounded-xl border-[1.5px] mb-6 bg-backgroundElement border-border"
      >
        <Search size={20} color={theme.textSecondary} />
        <ThemedText className="text-placeholder ml-2">
          Cari ikan segar, udang, atau toko maritim...
        </ThemedText>
      </Pressable>

      <View className="flex-row items-center px-6 mt-2 mb-2">
        <Store size={20} color={theme.primary} />
        <ThemedText type="smallBold" className="text-lg ml-2">
          Jelajah Katalog Terkini
        </ThemedText>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View className="items-center justify-center py-16">
        <ThemedText className="text-textSecondary">
          {error ? error : 'Belum ada produk yang dijual saat ini.'}
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView className="flex-1">
      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText className="mt-4 text-textSecondary">
            Menyelam mencari produk maritim...
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              showAddToCart={false} // Add to cart disabled for guest
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={Platform.OS === 'web' ? undefined : 2}
          contentContainerClassName={Platform.OS === 'web' ? "flex-row flex-wrap justify-center px-4 pb-8" : "pb-8"}
          columnWrapperClassName={Platform.OS !== 'web' && products.length > 0 ? "justify-between px-2" : undefined}
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
