import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Plus, Edit2, Trash2, X, ShoppingBag } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '@/services/api';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
}

export default function SellerProductsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal & Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/seller/products');
      if (response.data?.success) {
        setProducts(response.data.data);
      }
    } catch (err: any) {
      Alert.alert('Gagal', err.response?.data?.message || 'Gagal memuat produk toko.');
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

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice('');
    setStock('');
    setErrors({});
    setModalVisible(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setDescription(prod.description || '');
    setPrice(prod.price.toString());
    setStock(prod.stock.toString());
    setErrors({});
    setModalVisible(true);
  };

  const validateForm = (nm: string, prc: string, stk: string) => {
    const tempErrors: Record<string, string> = {};
    if (!nm) tempErrors.name = 'Nama produk wajib diisi';
    
    const priceNum = Number(prc);
    if (!prc) {
      tempErrors.price = 'Harga wajib diisi';
    } else if (isNaN(priceNum) || priceNum <= 0) {
      tempErrors.price = 'Harga harus berupa angka positif';
    }

    const stockNum = Number(stk);
    if (!stk) {
      tempErrors.stock = 'Stok wajib diisi';
    } else if (isNaN(stockNum) || stockNum < 0) {
      tempErrors.stock = 'Stok harus berupa bilangan bulat non-negatif';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSaveProduct = async () => {
    // Sanitasi input sisi klien
    const cleanName = name.trim().slice(0, 100);
    const cleanDescription = description.trim().slice(0, 500);
    const cleanPriceStr = price.trim().replace(/\D/g, '');
    const cleanStockStr = stock.trim().replace(/\D/g, '');

    // Sinkronisasi dengan state UI
    setName(cleanName);
    setDescription(cleanDescription);
    setPrice(cleanPriceStr);
    setStock(cleanStockStr);

    if (!validateForm(cleanName, cleanPriceStr, cleanStockStr)) return;

    setSubmitting(true);
    try {
      const payload = {
        name: cleanName,
        description: cleanDescription || null,
        price: Number(cleanPriceStr),
        stock: Number(cleanStockStr),
      };

      let response;
      if (editingProduct) {
        response = await api.put(`/seller/products/${editingProduct.id}`, payload);
      } else {
        response = await api.post('/seller/products', payload);
      }

      if (response.data?.success) {
        Alert.alert(
          'Sukses',
          editingProduct ? 'Produk berhasil diupdate' : 'Produk baru berhasil ditambahkan'
        );
        setModalVisible(false);
        fetchProducts();
      }
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const beErrors: Record<string, string> = {};
        const errorsData = err.response.data.errors;
        if (typeof errorsData === 'object' && errorsData !== null) {
          Object.keys(errorsData).forEach((key) => {
            const val = errorsData[key];
            beErrors[key] = Array.isArray(val) ? val[0] : String(val);
          });
        }
        setErrors(beErrors);
      } else {
        Alert.alert('Gagal', err.response?.data?.message || 'Gagal menyimpan produk.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = (id: string, prodName: string) => {
    Alert.alert('Hapus Produk', `Apakah Anda yakin ingin menghapus produk "${prodName}" dari katalog?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await api.delete(`/seller/products/${id}`);
            if (response.data?.success) {
              Alert.alert('Sukses', 'Produk berhasil dihapus.');
              fetchProducts();
            }
          } catch (err: any) {
            Alert.alert('Gagal', err.response?.data?.message || 'Gagal menghapus produk.');
          }
        },
      },
    ]);
  };

  const getStockBadge = (stk: number) => {
    if (stk === 0) {
      return <Badge label="Habis" variant="danger" />;
    }
    if (stk <= 5) {
      return <Badge label={`Sisa ${stk}`} variant="warning" />;
    }
    return <Badge label={`Stok: ${stk}`} variant="success" />;
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const formattedPrice = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(item.price);

    return (
      <Card className="mb-3 p-4">
        <View className="flex-row justify-between items-center border-b border-black/5 dark:border-white/5 pb-2 mb-2">
          <View className="flex-row items-center flex-1 gap-2 pr-2">
            <ThemedText type="smallBold" className="text-[15px] flex-1" numberOfLines={1}>
              {item.name}
            </ThemedText>
            {getStockBadge(item.stock)}
          </View>
          <View className="flex-row gap-3">
            <Pressable onPress={() => openEditModal(item)} className="p-1">
              <Edit2 size={16} color={theme.text} />
            </Pressable>
            <Pressable
              onPress={() => handleDeleteProduct(item.id, item.name)}
              className="p-1"
            >
              <Trash2 size={16} color={theme.danger} />
            </Pressable>
          </View>
        </View>

        <View className="gap-1">
          <ThemedText className="text-[16px] font-extrabold" themeColor="primary">
            {formattedPrice}
          </ThemedText>
          {item.description && (
            <ThemedText className="text-[13px] leading-[18px] mt-[2px]" themeColor="textSecondary" numberOfLines={2}>
              {item.description}
            </ThemedText>
          )}
        </View>
      </Card>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View className="items-center justify-center py-6 px-5">
        <ShoppingBag size={52} color={theme.placeholder} />
        <ThemedText className="text-center mt-3" themeColor="textSecondary">
          Toko Anda belum memiliki produk jualan. Silakan tambah produk baru untuk mulai berjualan.
        </ThemedText>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText className="mt-3" themeColor="textSecondary">
          Mengambil daftar produk Anda...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4 pb-20"
        contentContainerStyle={{ paddingBottom: 136 + insets.bottom }}
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

      <View className="absolute left-4 right-4" style={{ bottom: 68 + insets.bottom }}>
        <Button
          label="Tambah Produk Baru"
          leftIcon={<Plus size={20} color="#FFFFFF" />}
          onPress={openAddModal}
          className="rounded-full h-[52px] shadow-sm elevation-5"
        />
      </View>

      {/* Product Form Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%' }}
          >
            <ThemedView type="backgroundElement" className="rounded-t-[24px] max-h-[85%]">
              <View className="flex-row justify-between items-center p-4 border-b border-black/5 dark:border-white/5">
                <ThemedText type="smallBold" className="text-[18px]">
                  {editingProduct ? 'Ubah Informasi Produk' : 'Tambah Produk Baru'}
                </ThemedText>
                <Pressable onPress={() => setModalVisible(false)} className="p-1">
                  <X size={20} color={theme.text} />
                </Pressable>
              </View>

              <ScrollView contentContainerClassName="p-4 pb-6">
                <Input
                  label="Nama Produk"
                  placeholder="Contoh: Ikan Kakap Merah Segar"
                  value={name}
                  onChangeText={setName}
                  error={errors.name}
                />

                <View className="flex-row justify-between">
                  <Input
                    label="Harga (Rp)"
                    placeholder="Contoh: 75000"
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    error={errors.price}
                    containerStyle={{ flex: 1.2, marginRight: 8 }}
                  />
                  <Input
                    label="Stok Barang"
                    placeholder="Contoh: 15"
                    value={stock}
                    onChangeText={setStock}
                    keyboardType="number-pad"
                    error={errors.stock}
                    containerStyle={{ flex: 0.8 }}
                  />
                </View>

                <Input
                  label="Deskripsi Produk"
                  placeholder="Jelaskan ukuran, berat, kondisi tangkapan laut Anda..."
                  value={description}
                  onChangeText={setDescription}
                  error={errors.description}
                  multiline
                  numberOfLines={4}
                  inputStyle={{ height: 100, textAlignVertical: 'top', paddingTop: 8 }}
                />

                <Button
                  label={editingProduct ? 'Simpan Perubahan' : 'Publish Produk Jualan'}
                  onPress={handleSaveProduct}
                  loading={submitting}
                  className="mt-3"
                />
              </ScrollView>
            </ThemedView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ThemedView>
  );
}
