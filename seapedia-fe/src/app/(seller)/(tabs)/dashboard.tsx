import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Store, ShoppingBag, ClipboardList, RefreshCcw, LogOut, Pencil, X, TrendingUp, Package } from 'lucide-react-native';
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
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

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

  const openEditModal = async () => {
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const renderSkeleton = () => (
    <ThemedView className="flex-1">
      <Animated.View style={{ opacity: pulseAnim }} className="p-4">
        <View className="h-28 rounded-xl mb-4" style={{ backgroundColor: theme.neutral[200] }} />

        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 h-24 rounded-xl" style={{ backgroundColor: theme.neutral[200] }} />
          <View className="flex-1 h-24 rounded-xl" style={{ backgroundColor: theme.neutral[200] }} />
        </View>

        <View className="h-24 rounded-xl mb-4" style={{ backgroundColor: theme.neutral[200] }} />

        <View className="h-5 w-32 rounded mb-3" style={{ backgroundColor: theme.neutral[200] }} />
        <View className="h-12 rounded-xl mb-3" style={{ backgroundColor: theme.neutral[200] }} />
        <View className="h-12 rounded-xl mb-3" style={{ backgroundColor: theme.neutral[200] }} />
      </Animated.View>
    </ThemedView>
  );

  if (loading && !refreshing) {
    return renderSkeleton();
  }

  return (
    <ThemedView className="flex-1">
      <ScrollView
        contentContainerClassName="p-4 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        <Card className="mb-4 p-4 border border-primary  bg-primary/5 rounded-xl">
          <View className="flex-row items-center">
            <View className="w-14 h-14 rounded-2xl items-center justify-center" style={{ backgroundColor: `${theme.neutral}15` }}>
              <Store size={32} color={theme.primary} />
            </View>
            <View className="ml-4 flex-1">
              <ThemedText type="large" style={{ color: theme.neutral[800] }}>
                {summary?.storeName}
              </ThemedText>
              <ThemedText className=" mt-1 font-medium" style={{ color: theme.neutral[700] }}>
                {user?.name} - @{user?.username}
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

        <View className="flex-row gap-3 mb-4">
          <Pressable
            className="flex-1 active:opacity-80"
            onPress={() => router.push('/(seller)/(tabs)/products')}
          >
            <Card className="p-4 border border-neutral-300 rounded-xl">
              <View className="flex-row items-center justify-between mb-3">
                <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${theme.primary}15` }}>
                  <Package size={22} color={theme.primary} />
                </View>
              </View>
              <ThemedText type='extraLarge' className="font-black" style={{ color: theme.neutral[900] }}>
                {summary?.totalProducts ?? 0}
              </ThemedText>
              <ThemedText className="font-medium mt-1" style={{ color: theme.neutral[500] }}>
                Total Produk
              </ThemedText>
            </Card>
          </Pressable>

          <Pressable
            className="flex-1 active:opacity-80"
            onPress={() => router.push('/(seller)/(tabs)/orders')}
          >
            <Card className="p-4 border border-neutral-300 rounded-xl">
              <View className="flex-row items-center justify-between mb-3">
                <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${theme.danger}15` }}>
                  <ClipboardList size={22} color={theme.danger} />
                </View>
              </View>
              <ThemedText type='extraLarge' className="font-black" style={{ color: theme.neutral[900] }}>
                {summary?.pendingOrders ?? 0}
              </ThemedText>
              <ThemedText className="font-medium mt-1" style={{ color: theme.neutral[500] }}>
                Order Baru
              </ThemedText>
            </Card>
          </Pressable>
        </View>

        <Card className="p-4 border border-neutral-300 rounded-xl">
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${theme.primary}15` }}>
              <TrendingUp size={22} color={theme.primary} />
            </View>
            <ThemedText className="ml-3  font-semibold" style={{ color: theme.neutral[500] }}>
              Pendapatan Penjualan
            </ThemedText>
          </View>
          <ThemedText type='extraLarge' className="font-black" style={{ color: theme.primary }}>
            {formatCurrency(summary?.totalIncome ?? 0)}
          </ThemedText>
        </Card>

        <View className="flex-row items-center gap-2 my-4">
          <View className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.primary }} />
          <ThemedText className="font-bold" style={{ color: theme.neutral[900] }}>
            Navigasi Toko
          </ThemedText>
        </View>

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

        <Button
          label="Keluar Dari Akun"
          variant="danger"
          leftIcon={<LogOut size={20} color="#FFFFFF" />}
          onPress={handleLogout}
          loading={loggingOut}
          className="mt-2 h-[50px]"
        />
      </ScrollView>

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
                <ThemedView className="rounded-t-[24px] pb-6">
                  <View className="flex-row justify-between items-center p-4 border-b" style={{ borderBottomColor: theme.neutral[200] }}>
                    <View className="flex-row items-center gap-2">
                      <View className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.primary }} />
                      <ThemedText className="text-base font-bold" style={{ color: theme.neutral[900] }}>
                        Edit Profil Toko
                      </ThemedText>
                    </View>
                    <Pressable
                      onPress={() => setEditModalVisible(false)}
                      className="p-1"
                    >
                      <X size={20} color={theme.neutral[500]} />
                    </Pressable>
                  </View>

                  <View className="px-4 pt-4">
                    <Input
                      label="Nama Toko"
                      placeholder="Masukkan nama toko"
                      value={editName}
                      onChangeText={setEditName}
                      leftIcon={<Store size={20} color={theme.neutral[400]} />}
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
