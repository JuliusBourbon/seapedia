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

  const validateForm = () => {
    const tempErrors: Record<string, string> = {};
    if (!name.trim()) tempErrors.name = 'Nama produk wajib diisi';
    
    const priceNum = Number(price);
    if (!price.trim()) {
      tempErrors.price = 'Harga wajib diisi';
    } else if (isNaN(priceNum) || priceNum <= 0) {
      tempErrors.price = 'Harga harus berupa angka positif';
    }

    const stockNum = Number(stock);
    if (!stock.trim()) {
      tempErrors.stock = 'Stok wajib diisi';
    } else if (isNaN(stockNum) || !Number.isInteger(stockNum) || stockNum < 0) {
      tempErrors.stock = 'Stok harus berupa bilangan bulat non-negatif';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSaveProduct = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        name,
        description: description.trim() || null,
        price: Number(price),
        stock: Number(stock),
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
      <Card style={styles.productCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <ThemedText type="smallBold" style={styles.productName} numberOfLines={1}>
              {item.name}
            </ThemedText>
            {getStockBadge(item.stock)}
          </View>
          <View style={styles.actionButtons}>
            <Pressable onPress={() => openEditModal(item)} style={styles.iconButton}>
              <Edit2 size={16} color={theme.text} />
            </Pressable>
            <Pressable
              onPress={() => handleDeleteProduct(item.id, item.name)}
              style={styles.iconButton}
            >
              <Trash2 size={16} color={theme.danger} />
            </Pressable>
          </View>
        </View>

        <View style={styles.cardBody}>
          <ThemedText style={styles.productPrice} themeColor="primary">
            {formattedPrice}
          </ThemedText>
          {item.description && (
            <ThemedText style={styles.productDesc} themeColor="textSecondary" numberOfLines={2}>
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
      <View style={styles.emptyContainer}>
        <ShoppingBag size={52} color={theme.placeholder} />
        <ThemedText style={{ color: theme.textSecondary, marginTop: Spacing.three, textAlign: 'center' }}>
          Toko Anda belum memiliki produk jualan. Silakan tambah produk baru untuk mulai berjualan.
        </ThemedText>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={{ marginTop: Spacing.three, color: theme.textSecondary }}>
          Mengambil daftar produk Anda...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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

      <View style={styles.fabContainer}>
        <Button
          label="Tambah Produk Baru"
          leftIcon={<Plus size={20} color="#FFFFFF" />}
          onPress={openAddModal}
          style={styles.fabButton}
        />
      </View>

      {/* Product Form Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%' }}
          >
            <ThemedView type="backgroundElement" style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText type="smallBold" style={{ fontSize: 18 }}>
                  {editingProduct ? 'Ubah Informasi Produk' : 'Tambah Produk Baru'}
                </ThemedText>
                <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
                  <X size={20} color={theme.text} />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.formScroll}>
                <Input
                  label="Nama Produk"
                  placeholder="Contoh: Ikan Kakap Merah Segar"
                  value={name}
                  onChangeText={setName}
                  error={errors.name}
                />

                <View style={styles.rowInputs}>
                  <Input
                    label="Harga (Rp)"
                    placeholder="Contoh: 75000"
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    error={errors.price}
                    containerStyle={{ flex: 1.2, marginRight: Spacing.two }}
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
                  inputStyle={{ height: 100, textAlignVertical: 'top', paddingTop: Spacing.two }}
                />

                <Button
                  label={editingProduct ? 'Simpan Perubahan' : 'Publish Produk Jualan'}
                  onPress={handleSaveProduct}
                  loading={submitting}
                  style={{ marginTop: Spacing.three }}
                />
              </ScrollView>
            </ThemedView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
    paddingBottom: 80, // Space for FAB
  },
  productCard: {
    marginBottom: Spacing.three,
    padding: Spacing.four,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    paddingBottom: Spacing.two,
    marginBottom: Spacing.two,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.two,
    paddingRight: Spacing.two,
  },
  productName: {
    fontSize: 15,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  iconButton: {
    padding: Spacing.one,
  },
  cardBody: {
    gap: Spacing.one,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
  },
  productDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: Spacing.one / 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.five,
  },
  fabContainer: {
    position: 'absolute',
    bottom: Spacing.four,
    left: Spacing.four,
    right: Spacing.four,
  },
  fabButton: {
    borderRadius: 99,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.four,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  closeButton: {
    padding: Spacing.one,
  },
  formScroll: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
