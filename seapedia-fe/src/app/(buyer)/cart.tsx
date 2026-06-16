import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Trash2, ShoppingCart, Store, ArrowRight } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '@/services/api';

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  stock: number;
  quantity: number;
  subtotal: number;
}

interface CartData {
  id: string | null;
  storeId: string | null;
  store: { id: string; name: string } | null;
  items: CartItem[];
  summary: {
    totalItems: number;
    subtotal: number;
  };
}

export default function CartScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const fetchCart = async () => {
    try {
      const response = await api.get('/buyer/cart');
      if (response.data?.success) {
        setCart(response.data.data);
      }
    } catch (err: any) {
      Alert.alert('Gagal', err.response?.data?.message || 'Gagal memuat keranjang.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCart();
  };

  const handleUpdateQty = async (productId: string, currentQty: number, targetQty: number) => {
    if (targetQty < 1) {
      handleRemoveItem(productId);
      return;
    }

    setUpdatingItemId(productId);
    try {
      const response = await api.put(`/buyer/cart/items/${productId}`, { quantity: targetQty });
      if (response.data?.success) {
        setCart(response.data.data);
      }
    } catch (err: any) {
      Alert.alert('Gagal', err.response?.data?.message || 'Gagal mengubah kuantitas.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = (productId: string) => {
    Alert.alert('Hapus Item', 'Apakah Anda yakin ingin menghapus produk ini dari keranjang?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          setUpdatingItemId(productId);
          try {
            const response = await api.delete(`/buyer/cart/items/${productId}`);
            if (response.data?.success) {
              setCart(response.data.data);
            }
          } catch (err: any) {
            Alert.alert('Gagal', err.response?.data?.message || 'Gagal menghapus produk.');
          } finally {
            setUpdatingItemId(null);
          }
        },
      },
    ]);
  };

  const handleClearCart = () => {
    Alert.alert('Kosongkan Keranjang', 'Apakah Anda yakin ingin mengosongkan seluruh keranjang belanja?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Kosongkan',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            const response = await api.delete('/buyer/cart');
            if (response.data?.success) {
              setCart(response.data.data);
            }
          } catch (err: any) {
            Alert.alert('Gagal', err.response?.data?.message || 'Gagal mengosongkan keranjang.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: CartItem }) => {
    const formattedPrice = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(item.price);

    const isUpdating = updatingItemId === item.productId;

    return (
      <Card className="mb-4 p-4">
        <View className="flex-row justify-between items-center mb-2">
          <ThemedText type="smallBold" className="text-[15px] flex-1 pr-3" numberOfLines={1}>
            {item.productName}
          </ThemedText>
          <Pressable onPress={() => handleRemoveItem(item.productId)} className="p-1">
            <Trash2 size={16} color={theme.danger} />
          </Pressable>
        </View>

        <View className="flex-row justify-between items-center">
          <ThemedText className="text-[15px] font-extrabold" themeColor="primary">
            {formattedPrice}
          </ThemedText>

          <View className="flex-row items-center gap-3">
            {isUpdating ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <>
                <Pressable
                  onPress={() => handleUpdateQty(item.productId, item.quantity, item.quantity - 1)}
                  className="w-7 h-7 rounded-md border-[1.5px] border-border items-center justify-center active:opacity-70"
                >
                  <ThemedText className="text-[15px] font-bold">-</ThemedText>
                </Pressable>
                <ThemedText className="text-[14px] font-bold w-5 text-center">{item.quantity}</ThemedText>
                <Pressable
                  onPress={() => handleUpdateQty(item.productId, item.quantity, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                  className={`w-7 h-7 rounded-md border-[1.5px] border-border items-center justify-center active:opacity-70 ${item.quantity >= item.stock ? 'opacity-40' : ''}`}
                >
                  <ThemedText className="text-[15px] font-bold">+</ThemedText>
                </Pressable>
              </>
            )}
          </View>
        </View>
        
        {item.quantity >= item.stock && (
          <ThemedText className="text-[11px] mt-1 font-semibold" themeColor="warning">
            Maksimum stok tercapai ({item.stock} item)
          </ThemedText>
        )}
      </Card>
    );
  };

  const renderHeader = () => {
    if (!cart?.store) return null;
    return (
      <View className="flex-row items-center mb-3 pb-2 border-b-[1.5px] border-black/5 dark:border-white/5 gap-2">
        <Store size={20} color={theme.primary} />
        <ThemedText type="smallBold" className="text-base">
          Toko: {cart.store.name}
        </ThemedText>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View className="items-center justify-center py-6 px-5 mt-12">
        <ShoppingCart size={64} color={theme.placeholder} />
        <ThemedText type="smallBold" className="text-[18px] mt-4">
          Keranjang Belanja Kosong
        </ThemedText>
        <ThemedText className="text-[14px] text-center mt-2 px-3" themeColor="textSecondary">
          Yuk, jelajahi produk hasil laut terbaik nelayan kami dan isi keranjang belanja Anda!
        </ThemedText>
        <Button
          label="Mulai Belanja"
          onPress={() => router.push('/(public)/(tabs)')}
          className="mt-6 w-[180px]"
        />
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText className="mt-4 text-textSecondary">
          Membuka keranjang belanja Anda...
        </ThemedText>
      </ThemedView>
    );
  }

  const hasItems = cart && cart.items.length > 0;

  return (
    <ThemedView className="flex-1">
      <FlatList
        data={cart?.items || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.productId}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerClassName="p-4"
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      />

      {hasItems && (
        <ThemedView
          type="backgroundElement"
          className="absolute bottom-0 left-0 right-0 border-t border-border p-4"
          style={{
            height: 84 + insets.bottom,
            paddingBottom: 16 + insets.bottom,
          }}
        >
          <View className="flex-row justify-between items-center">
            <View>
              <ThemedText className="text-[13px]" themeColor="textSecondary">
                Subtotal ({cart.summary.totalItems} Barang)
              </ThemedText>
              <ThemedText className="text-[18px] font-black text-[#0D9488] mt-[2px]">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                }).format(cart.summary.subtotal)}
              </ThemedText>
            </View>
            <View className="flex-row items-center gap-4">
              <Pressable onPress={handleClearCart} className="py-2 px-1 active:opacity-70">
                <ThemedText className="text-danger text-[13px] font-bold">
                  Kosongkan
                </ThemedText>
              </Pressable>
              
              <Button
                label="Checkout"
                rightIcon={<ArrowRight size={16} color="#FFFFFF" />}
                onPress={() => router.push('/(buyer)/checkout')}
                className="h-11 w-[140px]"
              />
            </View>
          </View>
        </ThemedView>
      )}
    </ThemedView>
  );
}
