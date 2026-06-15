import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ShoppingBag, ArrowLeft, Store as StoreIcon, ShieldAlert } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spacing } from '@/constants/theme';
import api from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';

interface ProductDetail {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string | null;
  storeId: string;
  store: {
    id: string;
    name: string;
    description: string | null;
  };
}

export default function ProductDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeRole, isAuthenticated } = useAuthStore();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        if (response.data?.success) {
          setProduct(response.data.data);
        } else {
          setError('Gagal memuat detail produk');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Terjadi kesalahan koneksi');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProductDetails();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Diperlukan',
        'Silakan masuk terlebih dahulu untuk berbelanja.',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Masuk', onPress: () => router.push('/(public)/(tabs)/login') },
        ]
      );
      return;
    }

    if (activeRole !== 'BUYER') {
      Alert.alert(
        'Akses Ditolak',
        'Hanya pengguna dengan peran Pembeli (Buyer) yang dapat berbelanja. Silakan ganti peran Anda terlebih dahulu.'
      );
      return;
    }

    if (!product) return;

    setAddingToCart(true);
    try {
      const response = await api.post('/buyer/cart/items', {
        productId: product.id,
        quantity,
      });

      if (response.data?.success) {
        Alert.alert('Sukses', 'Produk berhasil ditambahkan ke keranjang belanja.');
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        // Single store checkout rule conflict!
        Alert.alert(
          'Konflik Keranjang',
          'Keranjang Anda berisi produk dari toko lain. Kosongkan keranjang untuk membeli produk dari toko ini?',
          [
            { text: 'Batal', style: 'cancel' },
            {
              text: 'Kosongkan & Tambah',
              onPress: async () => {
                try {
                  // Clear cart
                  await api.delete('/buyer/cart');
                  // Re-add product
                  await api.post('/buyer/cart/items', {
                    productId: product.id,
                    quantity,
                  });
                  Alert.alert('Sukses', 'Keranjang dikosongkan dan produk berhasil ditambahkan.');
                } catch (clearErr: any) {
                  Alert.alert('Gagal', 'Gagal mengosongkan keranjang.');
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Gagal', err.response?.data?.message || 'Gagal menambahkan produk ke keranjang.');
      }
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={{ marginTop: Spacing.three, color: theme.textSecondary }}>
          Memuat rincian tangkapan laut...
        </ThemedText>
      </ThemedView>
    );
  }

  if (error || !product) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ShieldAlert size={48} color={theme.danger} />
        <ThemedText style={styles.errorText}>{error || 'Produk tidak ditemukan'}</ThemedText>
        <Button label="Kembali" onPress={() => router.back()} style={{ marginTop: Spacing.four }} />
      </ThemedView>
    );
  }

  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(product.price);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Product Visual Header */}
        <LinearGradient
          colors={['#0D9488', '#0EA5E9', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.productBanner}
        >
          <ShoppingBag size={64} color="#FFFFFF" opacity={0.7} />
          {product.stock === 0 ? (
            <Badge label="Stok Habis" variant="danger" style={styles.bannerBadge} />
          ) : product.stock <= 5 ? (
            <Badge label={`Sisa ${product.stock}`} variant="warning" style={styles.bannerBadge} />
          ) : (
            <Badge label="Tersedia" variant="success" style={styles.bannerBadge} />
          )}
        </LinearGradient>

        <View style={styles.body}>
          {/* Price and Title */}
          <ThemedText style={styles.productPrice}>{formattedPrice}</ThemedText>
          <ThemedText type="subtitle" style={styles.productName}>
            {product.name}
          </ThemedText>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Description */}
          <View style={styles.section}>
            <ThemedText type="smallBold" style={styles.sectionTitle} themeColor="textSecondary">
              Deskripsi Produk
            </ThemedText>
            <ThemedText style={styles.descriptionText}>
              {product.description || 'Tidak ada deskripsi produk.'}
            </ThemedText>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Store Info Card */}
          <View style={styles.section}>
            <ThemedText type="smallBold" style={styles.sectionTitle} themeColor="textSecondary">
              Informasi Toko
            </ThemedText>
            <Pressable onPress={() => router.push(`/(public)/store/${product.store.id}`)}>
              <Card style={styles.storeCard}>
                <View style={[styles.storeIconContainer, { backgroundColor: `${theme.primary}15` }]}>
                  <StoreIcon size={24} color={theme.primary} />
                </View>
                <View style={styles.storeTextContainer}>
                  <ThemedText type="smallBold" style={styles.storeName}>
                    {product.store.name}
                  </ThemedText>
                  <ThemedText style={styles.storeDescription} numberOfLines={1} themeColor="textSecondary">
                    {product.store.description || 'Lihat daftar produk di toko ini.'}
                  </ThemedText>
                </View>
              </Card>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <ThemedView type="backgroundElement" style={[styles.stickyFooter, { borderTopColor: theme.border }]}>
        {product.stock > 0 && activeRole === 'BUYER' && (
          <View style={styles.qtyContainer}>
            <Pressable
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              style={[styles.qtyBtn, { borderColor: theme.border }]}
            >
              <ThemedText style={styles.qtyBtnText}>-</ThemedText>
            </Pressable>
            <ThemedText style={styles.qtyText}>{quantity}</ThemedText>
            <Pressable
              onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
              style={[styles.qtyBtn, { borderColor: theme.border }]}
            >
              <ThemedText style={styles.qtyBtnText}>+</ThemedText>
            </Pressable>
          </View>
        )}
        
        <Button
          label={
            !isAuthenticated
              ? 'Login untuk Membeli'
              : activeRole !== 'BUYER'
              ? 'Peran Pembeli Diperlukan'
              : product.stock === 0
              ? 'Stok Habis'
              : 'Tambah ke Keranjang'
          }
          onPress={handleAddToCart}
          loading={addingToCart}
          disabled={product.stock === 0 || (isAuthenticated && activeRole !== 'BUYER')}
          style={styles.addToCartBtn}
        />
      </ThemedView>
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
  scrollContent: {
    paddingBottom: 100, // Space for footer
  },
  productBanner: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bannerBadge: {
    position: 'absolute',
    bottom: Spacing.three,
    left: Spacing.four,
  },
  body: {
    padding: Spacing.four,
  },
  productPrice: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0D9488', // Teal highlight
    marginBottom: Spacing.one,
  },
  productName: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  divider: {
    height: 1.5,
    marginVertical: Spacing.four,
  },
  section: {
    alignSelf: 'stretch',
  },
  sectionTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: Spacing.two,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 12,
    marginTop: Spacing.one,
  },
  storeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeTextContainer: {
    flex: 1,
    marginLeft: Spacing.three,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '700',
  },
  storeDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderTopWidth: 1,
    height: 80,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.four,
    gap: Spacing.three,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '700',
    width: 20,
    textAlign: 'center',
  },
  addToCartBtn: {
    flex: 1,
    height: 48,
  },
});
