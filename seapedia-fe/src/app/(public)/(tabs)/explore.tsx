import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  Platform,
  ScrollView,
  Animated,
  Pressable,
  TextInput,
} from 'react-native';
import { Search, X, Store, ShoppingBag } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ProductCard, ProductData } from '@/components/product-card';
import { Badge } from '@/components/ui/badge';
import api from '@/services/api';

export default function ExploreProductsScreen() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<ProductData[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStore, setActiveStore] = useState<string | null>(null);

  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [loading]);

  const fetchAllProducts = async () => {
    try {
      setError(null);
      const response = await api.get('/products');
      if (response.data?.success) {
        setProducts(response.data.data);
        setFilteredProducts(response.data.data);
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
    fetchAllProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setActiveStore(null);
    setSearchQuery('');
    fetchAllProducts();
  };

  // Filter products when searchQuery or activeStore changes
  useEffect(() => {
    let filtered = products;

    if (activeStore) {
      filtered = filtered.filter((p) => p.store?.name === activeStore);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          (product.description && product.description.toLowerCase().includes(query)) ||
          product.store.name.toLowerCase().includes(query)
      );
    }

    setFilteredProducts(filtered);
  }, [searchQuery, products, activeStore]);

  // Extract unique store names for filter chips
  const storeNames = [...new Set(products.map((p) => p.store?.name).filter(Boolean))];

  const renderSkeleton = () => (
    <Animated.View style={{ opacity: pulseAnim }} className="px-3 pt-3">
      <View className="flex-row gap-2 mb-4 px-1">
        {[70, 90, 65].map((w, i) => (
          <View
            key={i}
            className="h-8 rounded-full"
            style={{ width: w, backgroundColor: theme.neutral[300] }}
          />
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View
            key={i}
            className="w-[48%] m-[1%] rounded-2xl h-48"
            style={{ backgroundColor: theme.neutral[300] }}
          />
        ))}
      </View>
    </Animated.View>
  );

  const renderStoreChips = () => {
    if (storeNames.length <= 1) return null;
    return (
      <View className="mb-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          <Pressable
            onPress={() => setActiveStore(null)}
            className="px-4 py-[6px] rounded-full flex-row items-center gap-[6px]"
            style={{
              backgroundColor: !activeStore ? theme.primary : theme.neutral[200],
            }}
          >
            <ShoppingBag size={14} color={!activeStore ? theme.neutral[50] : theme.neutral[500]} />
            <ThemedText
              className="text-sm font-semibold"
              style={{ color: !activeStore ? theme.neutral[50] : theme.neutral[600] }}
            >
              Semua
            </ThemedText>
          </Pressable>
          {storeNames.map((name) => (
            <Pressable
              key={name}
              onPress={() => setActiveStore(activeStore === name ? null : name)}
              className="px-4 py-[6px] rounded-full flex-row items-center gap-[6px]"
              style={{
                backgroundColor: activeStore === name ? theme.primary : theme.neutral[200],
              }}
            >
              <Store size={14} color={activeStore === name ? theme.neutral[50] : theme.neutral[500]} />
              <ThemedText
                className="text-sm font-semibold"
                style={{ color: activeStore === name ? theme.neutral[50] : theme.neutral[600] }}
                numberOfLines={1}
              >
                {name}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderHeader = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      {renderStoreChips()}

      <View className="flex-row items-center justify-between px-4 pb-2">
        <View className="flex-row items-center gap-2">
          <View
            className="w-1 h-5 rounded-full"
            style={{ backgroundColor: theme.primary }}
          />
          <ThemedText className="text-base font-bold">
            {searchQuery.trim() || activeStore ? 'Hasil Pencarian' : 'Semua Produk'}
          </ThemedText>
        </View>
        <Badge label={`${filteredProducts.length} item`} variant="primary" />
      </View>
    </Animated.View>
  );

  const renderEmpty = () => {
    if (loading) return renderSkeleton();
    return (
      <View className="items-center justify-center py-16 px-8">
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: theme.primaryShades[100] }}
        >
          <Search size={36} color={theme.primaryShades[400]} />
        </View>
        <ThemedText className="text-base font-semibold text-center mb-1">
          {error ? 'Terjadi Kesalahan' : 'Produk Tidak Ditemukan'}
        </ThemedText>
        <ThemedText
          className="text-sm text-center leading-5"
          style={{ color: theme.neutral[400] }}
        >
          {error
            ? error
            : searchQuery.trim()
              ? `Tidak ada hasil untuk "${searchQuery}".\nCoba kata kunci lain.`
              : 'Belum ada produk yang tersedia saat ini.'}
        </ThemedText>
        {(searchQuery.trim() || activeStore) && (
          <Pressable
            onPress={() => {
              setSearchQuery('');
              setActiveStore(null);
            }}
            className="mt-4 px-5 py-2 rounded-full"
            style={{ backgroundColor: theme.primary }}
          >
            <ThemedText
              className="text-sm font-semibold"
              style={{ color: theme.neutral[50] }}
            >
              Reset Filter
            </ThemedText>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <ThemedView className="flex-1" style={{ backgroundColor: theme.neutral[100] }}>
      {/* Search Bar */}
      <View
        className="px-4 pt-3 pb-2"
        style={{ backgroundColor: theme.neutral[100] }}
      >
        <View
          className="flex-row items-center rounded-xl px-4 h-12"
          style={{ backgroundColor: theme.neutral[200] }}
        >
          <Search size={18} color={theme.neutral[400]} />
          <TextInput
            placeholder="Cari produk atau toko..."
            placeholderTextColor={theme.neutral[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-3 h-full text-[15px]"
            style={{ color: theme.neutral[900] }}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} className="p-1">
              <X size={18} color={theme.neutral[400]} />
            </Pressable>
          )}
        </View>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1">
          {renderSkeleton()}
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              showAddToCart={false}
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={Platform.OS === 'web' ? undefined : 2}
          contentContainerClassName={Platform.OS === 'web' ? "flex-row flex-wrap justify-center px-4 py-3 pb-8" : "pt-2 pb-8"}
          columnWrapperClassName={Platform.OS !== 'web' && filteredProducts.length > 0 ? "justify-between px-2" : undefined}
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
