import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
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
import { Spacing } from '@/constants/theme';
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
      <Card style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <ThemedText type="smallBold" style={styles.itemName} numberOfLines={1}>
            {item.productName}
          </ThemedText>
          <Pressable onPress={() => handleRemoveItem(item.productId)} style={styles.removeBtn}>
            <Trash2 size={16} color={theme.danger} />
          </Pressable>
        </View>

        <View style={styles.itemFooter}>
          <ThemedText style={styles.itemPrice} themeColor="primary">
            {formattedPrice}
          </ThemedText>

          <View style={styles.qtyContainer}>
            {isUpdating ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <>
                <Pressable
                  onPress={() => handleUpdateQty(item.productId, item.quantity, item.quantity - 1)}
                  style={[styles.qtyBtn, { borderColor: theme.border }]}
                >
                  <ThemedText style={styles.qtyBtnText}>-</ThemedText>
                </Pressable>
                <ThemedText style={styles.qtyText}>{item.quantity}</ThemedText>
                <Pressable
                  onPress={() => handleUpdateQty(item.productId, item.quantity, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                  style={[
                    styles.qtyBtn,
                    { borderColor: theme.border },
                    item.quantity >= item.stock && { opacity: 0.4 },
                  ]}
                >
                  <ThemedText style={styles.qtyBtnText}>+</ThemedText>
                </Pressable>
              </>
            )}
          </View>
        </View>
        
        {item.quantity >= item.stock && (
          <ThemedText style={styles.stockLimitWarning} themeColor="warning">
            Maksimum stok tercapai ({item.stock} item)
          </ThemedText>
        )}
      </Card>
    );
  };

  const renderHeader = () => {
    if (!cart?.store) return null;
    return (
      <View style={styles.storeHeader}>
        <Store size={20} color={theme.primary} />
        <ThemedText type="smallBold" style={styles.storeName}>
          Toko: {cart.store.name}
        </ThemedText>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <ShoppingCart size={64} color={theme.placeholder} />
        <ThemedText type="smallBold" style={{ fontSize: 18, marginTop: Spacing.three }}>
          Keranjang Belanja Kosong
        </ThemedText>
        <ThemedText style={styles.emptySubtitle} themeColor="textSecondary">
          Yuk, jelajahi produk hasil laut terbaik nelayan kami dan isi keranjang belanja Anda!
        </ThemedText>
        <Button
          label="Mulai Belanja"
          onPress={() => router.push('/(public)/(tabs)')}
          style={styles.emptyButton}
        />
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={{ marginTop: Spacing.three, color: theme.textSecondary }}>
          Membuka keranjang belanja Anda...
        </ThemedText>
      </ThemedView>
    );
  }

  const hasItems = cart && cart.items.length > 0;

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={cart?.items || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.productId}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[styles.listContent, { paddingBottom: 100 + insets.bottom }]}
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
          style={[
            styles.summaryFooter,
            {
              borderTopColor: theme.border,
              height: 84 + insets.bottom,
              paddingBottom: Spacing.four + insets.bottom,
            },
          ]}
        >
          <View style={styles.summaryRow}>
            <View>
              <ThemedText style={{ fontSize: 13 }} themeColor="textSecondary">
                Subtotal ({cart.summary.totalItems} Barang)
              </ThemedText>
              <ThemedText style={styles.subtotalPrice}>
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                }).format(cart.summary.subtotal)}
              </ThemedText>
            </View>
            <View style={styles.footerActions}>
              <Pressable onPress={handleClearCart} style={styles.clearBtn}>
                <ThemedText style={{ color: theme.danger, fontSize: 13, fontWeight: '700' }}>
                  Kosongkan
                </ThemedText>
              </Pressable>
              
              <Button
                label="Checkout"
                rightIcon={<ArrowRight size={16} color="#FFFFFF" />}
                onPress={() => router.push('/(buyer)/checkout')}
                style={styles.checkoutBtn}
              />
            </View>
          </View>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: Spacing.four,
    paddingBottom: 100, // Space for sticky footer
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    gap: Spacing.two,
  },
  storeName: {
    fontSize: 16,
  },
  itemCard: {
    marginBottom: Spacing.three,
    padding: Spacing.four,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  itemName: {
    fontSize: 15,
    flex: 1,
    paddingRight: Spacing.three,
  },
  removeBtn: {
    padding: Spacing.one,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '800',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '700',
    width: 20,
    textAlign: 'center',
  },
  stockLimitWarning: {
    fontSize: 11,
    marginTop: Spacing.one,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.five,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  emptyButton: {
    marginTop: Spacing.four,
    width: 180,
  },
  summaryFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    padding: Spacing.four,
    height: 84,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtotalPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0D9488',
    marginTop: 2,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  clearBtn: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  checkoutBtn: {
    height: 44,
    width: 140,
  },
});
