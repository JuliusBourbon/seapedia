import React, { useEffect, useState } from 'react';
import {
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

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
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText className="mt-4 text-textSecondary">
          Memuat rincian tangkapan laut...
        </ThemedText>
      </ThemedView>
    );
  }

  if (error || !product) {
    return (
      <ThemedView className="flex-1 items-center justify-center p-8">
        <ShieldAlert size={48} color={theme.danger} />
        <ThemedText className="text-base font-semibold mt-4 text-center">
          {error || 'Produk tidak ditemukan'}
        </ThemedText>
        <Button label="Kembali" onPress={() => router.back()} className="mt-6" />
      </ThemedView>
    );
  }

  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(product.price);

  return (
    <ThemedView className="flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}>
        {/* Product Visual Header */}
        <LinearGradient
          colors={['#0D9488', '#0EA5E9', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="h-[220px] items-center justify-center relative"
        >
          <ShoppingBag size={64} color="#FFFFFF" opacity={0.7} />
          {product.stock === 0 ? (
            <Badge label="Stok Habis" variant="danger" className="absolute bottom-4 left-4" />
          ) : product.stock <= 5 ? (
            <Badge label={`Sisa ${product.stock}`} variant="warning" className="absolute bottom-4 left-4" />
          ) : (
            <Badge label="Tersedia" variant="success" className="absolute bottom-4 left-4" />
          )}
        </LinearGradient>

        <View className="p-4">
          {/* Price and Title */}
          <ThemedText className="text-[26px] font-black text-[#0D9488] mb-1">
            {formattedPrice}
          </ThemedText>
          <ThemedText type="subtitle" className="text-[22px] font-extrabold leading-7">
            {product.name}
          </ThemedText>

          {/* Divider */}
          <View className="h-[1.5px] my-4 bg-border" />

          {/* Description */}
          <View className="w-full">
            <ThemedText type="smallBold" className="text-xs uppercase font-bold tracking-wider mb-2" themeColor="textSecondary">
              Deskripsi Produk
            </ThemedText>
            <ThemedText className="text-[15px] leading-[22px]">
              {product.description || 'Tidak ada deskripsi produk.'}
            </ThemedText>
          </View>

          {/* Divider */}
          <View className="h-[1.5px] my-4 bg-border" />

          {/* Store Info Card */}
          <View className="w-full">
            <ThemedText type="smallBold" className="text-xs uppercase font-bold tracking-wider mb-2" themeColor="textSecondary">
              Informasi Toko
            </ThemedText>
            <Pressable onPress={() => router.push(`/(public)/store/${product.store.id}` as any)}>
              <Card className="flex-row items-center p-3 rounded-xl mt-1 border border-border">
                <View 
                  className="w-12 h-12 rounded-xl items-center justify-center"
                  style={{ backgroundColor: `${theme.primary}15` }}
                >
                  <StoreIcon size={24} color={theme.primary} />
                </View>
                <View className="flex-1 ml-3">
                  <ThemedText type="smallBold" className="text-[15px] font-bold">
                    {product.store.name}
                  </ThemedText>
                  <ThemedText className="text-[13px] mt-[2px]" numberOfLines={1} themeColor="textSecondary">
                    {product.store.description || 'Lihat daftar produk di toko ini.'}
                  </ThemedText>
                </View>
              </Card>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <ThemedView
        type="backgroundElement"
        className="absolute bottom-0 left-0 right-0 flex-row items-center p-4 border-t border-border"
        style={{
          height: 80 + insets.bottom,
          paddingBottom: 16 + insets.bottom,
        }}
      >
        {product.stock > 0 && activeRole === 'BUYER' && (
          <View className="flex-row items-center mr-4 gap-3">
            <Pressable
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-lg border-[1.5px] border-border items-center justify-center active:opacity-70"
            >
              <ThemedText className="text-lg font-bold">-</ThemedText>
            </Pressable>
            <ThemedText className="text-base font-bold w-5 text-center">{quantity}</ThemedText>
            <Pressable
              onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
              className="w-8 h-8 rounded-lg border-[1.5px] border-border items-center justify-center active:opacity-70"
            >
              <ThemedText className="text-lg font-bold">+</ThemedText>
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
          className="flex-1 h-12"
        />
      </ThemedView>
    </ThemedView>
  );
}
