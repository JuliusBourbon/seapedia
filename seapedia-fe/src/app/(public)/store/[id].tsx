import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
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
import { Spacing } from '@/constants/theme';
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
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#0F766E', '#0D9488']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.storeBanner}
        >
          <View style={[styles.storeIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
            <Store size={36} color="#FFFFFF" />
          </View>
          <View style={styles.storeInfoText}>
            <ThemedText style={styles.storeName}>{store.name}</ThemedText>
            <ThemedText style={styles.storeDescription}>
              {store.description || 'Nelayan / Toko Maritim Terpercaya'}
            </ThemedText>
          </View>
        </LinearGradient>

        <View style={styles.sectionTitleRow}>
          <ThemedText type="smallBold" style={{ fontSize: 16 }}>
            Produk Toko ({store.products?.length || 0})
          </ThemedText>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={{ color: theme.textSecondary }}>
          Toko ini belum memiliki produk yang dijual.
        </ThemedText>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={{ marginTop: Spacing.three, color: theme.textSecondary }}>
          Memuat halaman toko maritim...
        </ThemedText>
      </ThemedView>
    );
  }

  if (error || !store) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ShieldAlert size={48} color={theme.danger} />
        <ThemedText style={styles.errorText}>{error || 'Toko tidak ditemukan'}</ThemedText>
        <Button label="Kembali" onPress={() => router.back()} style={{ marginTop: Spacing.four }} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
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
        contentContainerStyle={[
          styles.listContainer,
          Platform.OS === 'web' && styles.webListContainer,
        ]}
        columnWrapperStyle={Platform.OS !== 'web' && store.products?.length > 0 ? styles.columnWrapper : undefined}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: Spacing.three,
    textAlign: 'center',
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
    paddingBottom: Spacing.two,
  },
  storeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: Spacing.three,
  },
  storeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeInfoText: {
    flex: 1,
    marginLeft: Spacing.four,
  },
  storeName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  storeDescription: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitleRow: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
  },
});
