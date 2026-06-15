import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Search } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Input } from '@/components/ui/input';
import { ProductCard, ProductData } from '@/components/product-card';
import { Spacing } from '@/constants/theme';
import api from '@/services/api';

export default function ExploreProductsScreen() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<ProductData[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
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
      }
    };

    fetchAllProducts();
  }, []);

  // Filter products when searchQuery changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query)) ||
        product.store.name.toLowerCase().includes(query)
    );
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={{ color: theme.textSecondary }}>
          {error ? error : 'Produk maritim tidak ditemukan.'}
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.searchSection}>
        <Input
          placeholder="Cari ikan, kepiting, udang, atau toko..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color={theme.textSecondary} />}
          containerStyle={styles.searchInputContainer}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={{ marginTop: Spacing.three, color: theme.textSecondary }}>
            Mencari produk terbaik...
          </ThemedText>
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
          contentContainerStyle={[
            styles.listContainer,
            Platform.OS === 'web' && styles.webListContainer,
          ]}
          columnWrapperStyle={Platform.OS !== 'web' && filteredProducts.length > 0 ? styles.columnWrapper : undefined}
          ListEmptyComponent={renderEmpty}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    padding: Spacing.four,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  searchInputContainer: {
    marginBottom: 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    paddingVertical: Spacing.three,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
  },
});
