import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Alert, Image
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
      <Card className="mb-4 p-3 border-0 elevation-sm" style={{ backgroundColor: '#ffffff' }}>
        <View className="flex-row items-start gap-3">
          <Image
            source={require('../../../assets/images/icon.png')}
            className="w-20 h-20 rounded-xl"
            style={{ backgroundColor: theme.neutral[100] }}
            resizeMode="cover"
          />

          <View className="flex-1 justify-between min-h-[80px]">
            <View className="flex-row justify-between items-start">
              <ThemedText className="font-semibold flex-1 pr-2 leading-5" numberOfLines={2} style={{ color: theme.neutral[900] }}>
                {item.productName}
              </ThemedText>
              <Pressable onPress={() => handleRemoveItem(item.productId)} className="p-1 active:opacity-60 -mr-1 -mt-1">
                <Trash2 size={18} color={theme.danger} />
              </Pressable>
            </View>

            <View className="flex-row justify-between items-end mt-2">
              <View>
                <ThemedText className="text-lg font-black" style={{ color: theme.primary }}>
                  {formattedPrice}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.neutral[500] }}>
                  Sisa {item.stock} stok
                </ThemedText>
              </View>

              <View className="flex-row items-center rounded-lg border" style={{ borderColor: theme.neutral[200] }}>
                {isUpdating ? (
                  <View className="h-8 w-[90px] items-center justify-center">
                    <ActivityIndicator size="small" color={theme.primary} />
                  </View>
                ) : (
                  <>
                    <Pressable
                      onPress={() => handleUpdateQty(item.productId, item.quantity, item.quantity - 1)}
                      className="w-8 h-8 items-center justify-center active:opacity-60"
                    >
                      <ThemedText className="text-[16px] font-bold" style={{ color: theme.neutral[600] }}>-</ThemedText>
                    </Pressable>
                    <View className="w-8 items-center justify-center border-l border-r" style={{ borderColor: theme.neutral[200], backgroundColor: theme.neutral[50] }}>
                      <ThemedText className="text-[14px] font-bold" style={{ color: theme.neutral[900] }}>
                        {item.quantity}
                      </ThemedText>
                    </View>
                    <Pressable
                      onPress={() => handleUpdateQty(item.productId, item.quantity, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className={`w-8 h-8 items-center justify-center active:opacity-60 ${item.quantity >= item.stock ? 'opacity-40' : ''}`}
                    >
                      <ThemedText className="text-[16px] font-bold" style={{ color: theme.neutral[600] }}>+</ThemedText>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>
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
        <ShoppingCart size={64} color={theme.primary} />
        <ThemedText type="large" className="mt-4">
          Keranjang Belanja Kosong
        </ThemedText>
        <ThemedText className="text-center mt-2 px-3">
          Yuk, jelajahi produk kami dan isi keranjang belanja Anda!
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
          className="absolute bottom-0 left-0 right-0 border-t border-primary p-4"
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
            <View className="flex-row items-center justify-center gap-4">
              <Pressable onPress={handleClearCart} className="py-2 px-1 active:opacity-70">
                <Trash2 size={24} color={theme.danger} />
              </Pressable>

              <Button
                label="Checkout"
                rightIcon={<ArrowRight size={16} color="#FFFFFF" />}
                onPress={() => router.push('/(buyer)/checkout')}
                className="h-12 w-[120px]"
              />
            </View>
          </View>
        </ThemedView>
      )}
    </ThemedView>
  );
}
