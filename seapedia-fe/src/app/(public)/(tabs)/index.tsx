import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
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
import { Spacing } from '@/constants/theme';
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
    <View style={styles.headerContainer}>
      {/* Ocean Welcome Banner */}
      <LinearGradient
        colors={['#0F766E', '#0D9488', '#0EA5E9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBanner}
      >
        <View style={styles.heroContent}>
          <Anchor size={40} color="#FFFFFF" style={styles.heroIcon} />
          <ThemedText style={styles.heroTitle}>
            SEAPEDIA
          </ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            Marketplace Multi-Role Hasil Laut & Maritim Terlengkap
          </ThemedText>
        </View>
      </LinearGradient>

      {/* Fake Search Bar Button */}
      <Pressable onPress={handleSearchPress} style={[styles.searchBar, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
        <Search size={20} color={theme.textSecondary} />
        <ThemedText style={{ color: theme.placeholder, marginLeft: Spacing.two }}>
          Cari ikan segar, udang, atau toko maritim...
        </ThemedText>
      </Pressable>

      <View style={styles.sectionHeader}>
        <Store size={20} color={theme.primary} />
        <ThemedText type="smallBold" style={{ fontSize: 18, marginLeft: Spacing.two }}>
          Jelajah Katalog Terkini
        </ThemedText>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={{ color: theme.textSecondary }}>
          {error ? error : 'Belum ada produk yang dijual saat ini.'}
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={{ marginTop: Spacing.three, color: theme.textSecondary }}>
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
          contentContainerStyle={[
            styles.listContainer,
            Platform.OS === 'web' && styles.webListContainer,
          ]}
          columnWrapperStyle={Platform.OS !== 'web' && products.length > 0 ? styles.columnWrapper : undefined}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    paddingBottom: Spacing.five,
  },
  webListContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
  },
  headerContainer: {
    width: '100%',
    paddingBottom: Spacing.three,
  },
  heroBanner: {
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    marginBottom: Spacing.four,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroIcon: {
    marginBottom: Spacing.two,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.one,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.four,
    paddingHorizontal: Spacing.three,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: Spacing.four,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
  },
});
