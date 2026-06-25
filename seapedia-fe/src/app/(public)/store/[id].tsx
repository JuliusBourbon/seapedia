import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  Platform,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Store, ShieldAlert, Package, Anchor } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ProductCard, ProductData } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Skeleton pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (store) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
    }
  }, [store]);

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

  const renderLoadingSkeleton = () => (
    <View className="px-4 mt-4">
      {[1, 2, 3].map((i) => (
        <Animated.View
          key={i}
          style={{ opacity: pulseAnim }}
          className="flex-row gap-3 mb-4"
        >
          <View className="w-28 h-28 rounded-2xl bg-neutral-300" />
          <View className="flex-1 justify-center gap-2">
            <View className="h-4 w-3/4 rounded-lg bg-neutral-300" />
            <View className="h-3 w-1/2 rounded-lg bg-neutral-300" />
            <View className="h-5 w-1/3 rounded-lg bg-neutral-300" />
          </View>
        </Animated.View>
      ))}
    </View>
  );

  const renderHeader = () => {
    if (!store) return null;
    const productCount = store.products?.length || 0;

    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Hero Banner */}
        <View
          className="px-5 pt-5 pb-7 overflow-hidden"
          style={{ backgroundColor: theme.primaryShades[700] }}
        >
          {/* Decorative floating circles */}
          <View
            className="absolute top-[-30px] right-[-30px] w-[120px] h-[120px] rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
          />
          <View
            className="absolute bottom-[-20px] left-[-15px] w-[80px] h-[80px] rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
          />

          {/* Store avatar + info */}
          <View className="flex-row items-center gap-4">
            <View
              className="w-16 h-16 rounded-2xl items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
            >
              <Store size={32} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <ThemedText className="text-white text-xl font-extrabold leading-6">
                {store.name}
              </ThemedText>
              {store.description ? (
                <ThemedText className="text-white/70 text-[13px] mt-1 leading-[18px]" numberOfLines={2}>
                  {store.description}
                </ThemedText>
              ) : null}
            </View>
          </View>

          {/* Stats row */}
          <View className="flex-row mt-5 gap-3">
            <View
              className="flex-row items-center gap-2 px-3 py-2 rounded-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <Package size={16} color="#FFFFFF" />
              <ThemedText className="text-white text-sm font-bold">
                {productCount} Produk
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Products section divider */}
        <View className="flex-row items-center justify-between px-4 pt-5 pb-2">
          <View className="flex-row items-center gap-2">
            <View
              className="w-1 h-5 rounded-full"
              style={{ backgroundColor: theme.primary }}
            />
            <ThemedText className="text-lg font-bold">
              Produk Toko
            </ThemedText>
          </View>
          <Badge label={`${productCount} item`} variant="primary" />
        </View>
      </Animated.View>
    );
  };

  const renderEmpty = () => {
    if (loading) return renderLoadingSkeleton();
    return (
      <View className="items-center justify-center py-16 px-8">
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: `${theme.primary}15` }}
        >
          <Package size={36} color={theme.primaryShades[400]} />
        </View>
        <ThemedText className="text-base font-semibold text-center mb-1">
          Belum Ada Produk
        </ThemedText>
        <ThemedText className="text-neutral-400 text-sm text-center leading-5">
          Toko ini belum memiliki produk yang dijual.{'\n'}Silakan kembali lagi nanti.
        </ThemedText>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <ThemedView className="flex-1">
        {/* Skeleton hero */}
        <Animated.View style={{ opacity: pulseAnim }}>
          <View className="h-44 bg-neutral-300" />
        </Animated.View>
        {renderLoadingSkeleton()}
      </ThemedView>
    );
  }

  if (error || !store) {
    return (
      <ThemedView className="flex-1 items-center justify-center p-8">
        <View
          className="w-24 h-24 rounded-full items-center justify-center mb-5"
          style={{ backgroundColor: `${theme.danger}15` }}
        >
          <ShieldAlert size={44} color={theme.danger} />
        </View>
        <ThemedText className="text-lg font-bold text-center mb-2">
          {error || 'Toko tidak ditemukan'}
        </ThemedText>
        <ThemedText className="text-neutral-400 text-sm text-center mb-6 leading-5">
          Pastikan koneksi internet Anda stabil{'\n'}dan coba lagi dalam beberapa saat.
        </ThemedText>
        <Button label="Kembali" onPress={() => router.back()} className="px-8" />
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
