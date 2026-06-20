import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Store, ShoppingBag, ClipboardList, RefreshCcw, LogOut, Pencil, X } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';

interface SummaryData {
  hasStore: boolean;
  storeId: string | null;
  storeName: string | null;
  storeDescription?: string | null;
  totalProducts: number;
  pendingOrders: number;
  totalIncome: number;
  note: string;
}

export default function SellerDashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, clearAuth, roles } = useAuthStore();

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // Store profile edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchSummary = async () => {
    try {
      setError(null);
      const response = await api.get('/dashboard/seller/summary');
      if (response.data?.success) {
        const data = response.data.data;
        if (!data.hasStore) {
          router.replace('/(seller)/store-setup' as any);
          return;
        }
        setSummary(data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat ringkasan toko.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSummary();
  };

  const handleLogout = async () => {
    Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar dari akun?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await api.post('/auth/logout');
          } catch (err) {
            // Clear auth locally anyway
          } finally {
            clearAuth();
            setLoggingOut(false);
            router.replace('/(public)/(tabs)/login');
          }
        },
      },
    ]);
  };

  // --- Store Profile Edit ---
  const openEditModal = async () => {
    // Pre-fill from summary, and also fetch full store detail for description
    setEditName(summary?.storeName || '');
    setEditDescription('');
    setEditErrors({});

    try {
      const res = await api.get('/seller/store');
      if (res.data?.success && res.data.data) {
        setEditName(res.data.data.name || '');
        setEditDescription(res.data.data.description || '');
      }
    } catch {
      // Fallback to summary data
    }

    setEditModalVisible(true);
  };

  const validateEdit = () => {
    const tempErrors: Record<string, string> = {};
    if (!editName.trim()) tempErrors.name = 'Nama toko wajib diisi';
    else if (editName.trim().length < 3) tempErrors.name = 'Nama toko minimal 3 karakter';
    setEditErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSaveStoreProfile = async () => {
    if (!validateEdit()) return;

    setSaving(true);
    try {
      const response = await api.put('/seller/store', {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });

      if (response.data?.success) {
        setEditModalVisible(false);
        Alert.alert('Berhasil', 'Profil toko berhasil diperbarui.');
        fetchSummary();
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        setEditErrors({ name: err.response?.data?.message || 'Nama toko sudah digunakan.' });
      } else {
        Alert.alert('Gagal', err.response?.data?.message || 'Gagal memperbarui profil toko.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText className="mt-3" themeColor="textSecondary">
          Memuat dasbor toko Anda...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <ScrollView
        contentContainerClassName="p-4 pb-5"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {/* Welcome Shop Banner */}
        <Card className="mb-3 p-4">
          <View className="flex-row items-center">
            <View className="w-[60px] h-[60px] rounded-[14px] items-center justify-center" style={{ backgroundColor: `${theme.primary}15` }}>
              <Store size={36} color={theme.primary} />
            </View>
            <View className="ml-4 flex-1">
              <ThemedText type="large" className="text-[18px]">
                Toko: {summary?.storeName}
              </ThemedText>
              <ThemedText type='smallBold' themeColor="textSecondary">
                Pemilik: {user?.name} (@{user?.username})
              </ThemedText>
            </View>
            <Pressable
              onPress={openEditModal}
              className="w-10 h-10 rounded-xl items-center justify-center active:opacity-60"
              style={{ backgroundColor: `${theme.primary}15` }}
            >
              <Pencil size={18} color={theme.primary} />
            </Pressable>
          </View>

          {roles.length > 1 && (
            <Button
              label="Pindah Peran Akun"
              variant="outline"
              size="small"
              leftIcon={<RefreshCcw size={16} color={theme.primary} />}
              onPress={() => router.push('/(public)/select-role')}
              className="mt-3"
            />
          )}
        </Card>

        {/* Dashboard Metrics Grid */}
        <View className="flex-row gap-3 mb-4">
          <Pressable
            className="flex-1"
            onPress={() => router.push('/(seller)/(tabs)/products')}
          >
            <Card className="flex-row items-center p-3">
              <ShoppingBag size={24} color={theme.primary} />
              <View className="ml-3 flex-1">
                <ThemedText type="subtitle" className="text-[20px] font-extrabold leading-6">
                  {summary?.totalProducts ?? 0}
                </ThemedText>
                <ThemedText type='small' className="mt-[2px]" themeColor="textSecondary">
                  Total Produk
                </ThemedText>
              </View>
            </Card>
          </Pressable>

          <Pressable
            className="flex-1"
            onPress={() => router.push('/(seller)/(tabs)/orders')}
          >
            <Card className="flex-row items-center p-3">
              <ClipboardList size={24} color={theme.warning} />
              <View className="ml-3 flex-1">
                <ThemedText type="subtitle" className="text-[20px] font-extrabold leading-6">
                  {summary?.pendingOrders ?? 0}
                </ThemedText>
                <ThemedText type='small' className="mt-[2px]" themeColor="textSecondary">
                  Order Baru
                </ThemedText>
              </View>
            </Card>
          </Pressable>
        </View>

        {/* Sales Revenue */}
        <Card className="flex-row items-center p-3 mb-4">
          <View className="w-12 h-12 rounded-full items-center justify-center">
            <ShoppingBag size={24} color={theme.success} />
          </View>
          <View className="ml-3 flex-1">
            <ThemedText className="font-semibold" >
              Pendapatan Penjualan
            </ThemedText>
            <ThemedText type="subtitle" className="text-[20px] font-extrabold leading-6 mt-1" style={{ color: theme.success }}>
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(summary?.totalIncome ?? 0)}
            </ThemedText>
          </View>
        </Card>

        {/* Store settings quick links */}
        <ThemedText type="smallBold" className="text-[14px] uppercase font-bold tracking-wider mb-2 mt-2">
          Navigasi Toko
        </ThemedText>

        <Button
          label="Kelola Daftar Produk"
          leftIcon={<ShoppingBag size={20} color="#FFFFFF" />}
          onPress={() => router.push('/(seller)/(tabs)/products')}
          className="mb-3 h-[50px]"
        />

        <Button
          label="Lihat Pesanan Masuk"
          leftIcon={<ClipboardList size={20} color="#FFFFFF" />}
          onPress={() => router.push('/(seller)/(tabs)/orders')}
          className="mb-3 h-[50px]"
        />

        {/* Logout */}
        <Button
          label="Keluar Dari Akun"
          variant="danger"
          leftIcon={<LogOut size={20} color="#FFFFFF" />}
          onPress={handleLogout}
          loading={loggingOut}
          className="mt-2 h-[50px]"
        />
      </ScrollView>

      {/* Store Profile Edit Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setEditModalVisible(false)}>
          <View className="flex-1 bg-black/40 justify-end">
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              >
                <ThemedView type="backgroundElement" className="rounded-t-[24px] pb-6">
                  {/* Modal Header */}
                  <View className="flex-row justify-between items-center p-4 border-b border-white/10">
                    <ThemedText type="smallBold" className="text-[18px]">
                      Edit Profil Toko
                    </ThemedText>
                    <Pressable
                      onPress={() => setEditModalVisible(false)}
                      className="p-1"
                    >
                      <X size={20} color={theme.text} />
                    </Pressable>
                  </View>

                  {/* Modal Body */}
                  <View className="px-4 pt-4">
                    <Input
                      label="Nama Toko"
                      placeholder="Masukkan nama toko"
                      value={editName}
                      onChangeText={setEditName}
                      leftIcon={<Store size={20} color={theme.textSecondary} />}
                      error={editErrors.name}
                    />

                    <Input
                      label="Deskripsi Toko (Opsional)"
                      placeholder="Jelaskan produk yang toko Anda tawarkan"
                      value={editDescription}
                      onChangeText={setEditDescription}
                      multiline
                      numberOfLines={4}
                    />

                    <Button
                      label="Simpan Perubahan"
                      onPress={handleSaveStoreProfile}
                      loading={saving}
                      className="h-[52px]"
                    />

                    <Button
                      label="Batal"
                      variant="outline"
                      onPress={() => setEditModalVisible(false)}
                      className="mt-2 h-[48px]"
                    />
                  </View>
                </ThemedView>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ThemedView>
  );
}
