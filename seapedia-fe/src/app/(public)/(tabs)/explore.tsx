import React, { useEffect, useState } from 'react';
import {
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
      <View className="items-center justify-center py-16">
        <ThemedText className="text-textSecondary">
          {error ? error : 'Produk tidak ditemukan.'}
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView className="flex-1">
      <View className="p-4 border-b border-black/5 dark:border-white/5">
        <Input
          placeholder="Cari ikan, kepiting, udang, atau toko..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color={theme.textSecondary} />}
          containerClasses="mb-0"
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText className="mt-4 text-textSecondary">
            Mencari produk...
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
          contentContainerClassName={Platform.OS === 'web' ? "flex-row flex-wrap justify-center px-4 py-3 pb-8" : "py-3 pb-8"}
          columnWrapperClassName={Platform.OS !== 'web' && filteredProducts.length > 0 ? "justify-between px-2" : undefined}
          ListEmptyComponent={renderEmpty}
        />
      )}
    </ThemedView>
  );
}
