import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  Pressable,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { Search, Tag, Percent, Package, Store, ShoppingBag, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ProductCard, ProductData } from '@/components/product-card';
import { Badge } from '@/components/ui/badge';
import api from '@/services/api';

interface PromoData {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  expiryDate: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount?: number;
  isVoucher?: boolean;
}

export default function MarketplaceHomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [promos, setPromos] = useState<PromoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [loading]);

  const fetchData = async () => {
    try {
      setError(null);
      const [productsRes, promosRes, vouchersRes] = await Promise.all([
        api.get('/products'),
        api.get('/promos').catch(() => ({ data: { success: true, data: [] } })),
        api.get('/vouchers').catch(() => ({ data: { success: true, data: [] } })),
      ]);
      if (productsRes.data?.success) {
        setProducts(productsRes.data.data);
      } else {
        setError('Gagal memuat produk');
      }

      let allPromosAndVouchers: PromoData[] = [];
      if (promosRes.data?.success) {
        const rawPromos = promosRes.data.data || [];
        allPromosAndVouchers = [...allPromosAndVouchers, ...rawPromos.map((p: any) => ({ ...p, isVoucher: false }))];
      }
      if (vouchersRes.data?.success) {
        const rawVouchers = vouchersRes.data.data || [];
        allPromosAndVouchers = [...allPromosAndVouchers, ...rawVouchers.map((v: any) => ({ ...v, isVoucher: true }))];
      }

      const activePromos = allPromosAndVouchers.filter(
        (p: PromoData) => p.isActive && new Date(p.expiryDate) > new Date()
      );
      setPromos(activePromos);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSearchPress = () => {
    router.push('/(public)/(tabs)/explore');
  };

  // Extract unique store names for category chips
  const storeNames = [...new Set(products.map((p) => p.store?.name).filter(Boolean))];

  const filteredProducts = activeCategory
    ? products.filter((p) => p.store?.name === activeCategory)
    : products;

  const formatPromoValue = (promo: PromoData) => {
    if (promo.type === 'PERCENTAGE') return `${promo.value}%`;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(promo.value);
  };

  const formatExpiryDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const renderSkeleton = () => (
    <ThemedView className="flex-1" style={{ backgroundColor: theme.neutral[100] }}>
      <Animated.View style={{ opacity: pulseAnim }}>
        <View className="h-40 m-4 rounded-2xl bg-neutral-300" />
        <View className="h-12 mx-4 mb-4 rounded-xl bg-neutral-300" />
        <View className="flex-row px-4 gap-2 mb-4">
          {[80, 60, 90].map((w, i) => (
            <View key={i} className="h-8 rounded-full bg-neutral-300" style={{ width: w }} />
          ))}
        </View>
        <View className="flex-row flex-wrap px-3">
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="w-[48%] m-[1%] rounded-2xl bg-neutral-300 h-48" />
          ))}
        </View>
      </Animated.View>
    </ThemedView>
  );

  const renderPromoCarousel = () => {
    if (promos.length === 0) return null;
    return (
      <View className="mb-2">
        <View className="flex-row items-center justify-between px-4 mb-3">
          <View className="flex-row items-center gap-2">
            <View className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.primary }} />
            <ThemedText className="text-base font-bold">Promo Spesial</ThemedText>
          </View>
          <Badge label={`${promos.length} aktif`} variant="primary" />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        >
          {promos.map((promo) => (
            <Pressable
              key={promo.id}
              className="rounded-2xl overflow-hidden"
              style={{ width: 220 }}
            >
              <View
                className="p-4"
                style={{ backgroundColor: theme.primaryShades[700] }}
              >
                <View
                  className="absolute top-[-20px] right-[-20px] w-[70px] h-[70px] rounded-full"
                  style={{ backgroundColor: theme.primaryShades[900], opacity: 0.3 }}
                />
                <View className="flex-row items-center gap-2 mb-2">
                  <Percent size={16} color={theme.secondaryShades[300]} />
                  <ThemedText
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: theme.neutral[50] }}
                  >
                    Diskon
                  </ThemedText>
                </View>
                <ThemedText className="text-white text-2xl font-extrabold">
                  {formatPromoValue(promo)}
                </ThemedText>
                <ThemedText className="text-neutral-50 text-xs mt-1">
                  Kode: {promo.code}
                </ThemedText>

              </View>
              <View
                className="px-4 py-2 flex-row items-center justify-between"
                style={{ backgroundColor: theme.primaryShades[800] }}
              >
                <ThemedText className="text-neutral-50 text-xs">
                  s.d. {formatExpiryDate(promo.expiryDate)}
                </ThemedText>
                {promo.isVoucher && promo.usageLimit !== undefined && promo.usedCount !== undefined && (
                  <ThemedText className="text-neutral-50 text-xs ml-2">
                    Stok: {promo.usageLimit - promo.usedCount}
                  </ThemedText>
                )}
                <Tag size={12} color={theme.secondaryShades[300]} />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderCategoryChips = () => {
    if (storeNames.length <= 1) return null;
    return (
      <View className="mb-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          <Pressable
            onPress={() => setActiveCategory(null)}
            className="px-4 py-[6px] rounded-full flex-row items-center gap-[6px]"
            style={{
              backgroundColor: !activeCategory ? theme.primary : theme.neutral[200],
            }}
          >
            <ShoppingBag size={14} color={!activeCategory ? theme.neutral[50] : theme.neutral[500]} />
            <ThemedText
              className="text-sm font-semibold"
              style={{ color: !activeCategory ? theme.neutral[50] : theme.neutral[600] }}
            >
              Semua
            </ThemedText>
          </Pressable>
          {storeNames.map((name) => (
            <Pressable
              key={name}
              onPress={() => setActiveCategory(activeCategory === name ? null : name)}
              className="px-4 py-[6px] rounded-full flex-row items-center gap-[6px]"
              style={{
                backgroundColor: activeCategory === name ? theme.primary : theme.neutral[200],
              }}
            >
              <Store size={14} color={activeCategory === name ? theme.neutral[50] : theme.neutral[500]} />
              <ThemedText
                className="text-sm font-semibold"
                style={{ color: activeCategory === name ? theme.neutral[50] : theme.neutral[600] }}
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
      <View
        className="mx-4 mt-4 mb-4 rounded-2xl p-5 overflow-hidden"
        style={{ backgroundColor: theme.primaryShades[700] }}
      >
        <View
          className="absolute top-[-30px] right-[-20px] w-[110px] h-[110px] rounded-full"
          style={{ backgroundColor: theme.primaryShades[900], opacity: 0.3 }}
        />
        <View
          className="absolute bottom-[-15px] left-[-10px] w-[70px] h-[70px] rounded-full"
          style={{ backgroundColor: theme.primaryShades[900], opacity: 0.2 }}
        />
        <ThemedText className="text-neutral-50 font-semibold uppercase mb-1">
          Selamat Datang di
        </ThemedText>
        <ThemedText className="text-white text-xl font-extrabold mb-1">
          Seapedia
        </ThemedText>
        <ThemedText className="text-neutral-50 text-sm leading-5">
          Temukan Produk terbaru dari toko terpercaya.
        </ThemedText>
      </View>

      <Pressable
        onPress={handleSearchPress}
        className="flex-row items-center mx-4 px-4 h-12 rounded-xl mb-4"
        style={{ backgroundColor: theme.neutral[200] }}
      >
        <Search size={18} color={theme.neutral[400]} />
        <ThemedText className="ml-3 text-sm" style={{ color: theme.neutral[600] }}>
          Cari produk atau toko...
        </ThemedText>
        <View className="ml-auto">
          <ChevronRight size={16} color={theme.neutral[400]} />
        </View>
      </Pressable>

      {renderPromoCarousel()}

      {renderCategoryChips()}

      <View className="flex-row items-center justify-between px-4 pt-1 pb-2">
        <View className="flex-row items-center gap-2">
          <View className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.primary }} />
          <ThemedText className="text-base font-bold">Produk Terbaru</ThemedText>
        </View>
        <Badge label={`${filteredProducts.length} item`} variant="primary" />
      </View>
    </Animated.View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View className="items-center justify-center py-16 px-8">
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: `${theme.primary}15` }}
        >
          <Package size={36} color={theme.primaryShades[400]} />
        </View>
        <ThemedText className="text-base font-semibold text-center mb-1">
          {error ? 'Terjadi Kesalahan' : 'Belum Ada Produk'}
        </ThemedText>
        <ThemedText className="text-neutral-400 text-sm text-center leading-5">
          {error || 'Belum ada produk yang dijual saat ini.\nSilakan kembali lagi nanti.'}
        </ThemedText>
      </View>
    );
  };

  if (loading && !refreshing) {
    return renderSkeleton();
  }

  return (
    <ThemedView className="flex-1" style={{ backgroundColor: theme.neutral[100] }}>
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
        contentContainerClassName={Platform.OS === 'web' ? "flex-row flex-wrap justify-center px-4 pb-8" : "pb-8"}
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
    </ThemedView>
  );
}
