import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  Pressable,
  Alert,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import { Percent, Plus, ToggleLeft, ToggleRight, Calendar, UserCheck, X } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '@/services/api';

interface DiscountItem {
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  expiryDate: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount?: number;
}

type ModeTab = 'VOUCHER' | 'PROMO';

export default function AdminDiscountScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [vouchers, setVouchers] = useState<DiscountItem[]>([]);
  const [promos, setPromos] = useState<DiscountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ModeTab>('VOUCHER');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formType, setFormType] = useState<ModeTab>('VOUCHER');
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [value, setValue] = useState('');
  const [expiryDate, setExpiryDate] = useState('2026-12-31');
  const [usageLimit, setUsageLimit] = useState('100');

  const [submitLoading, setSubmitLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const fetchData = async () => {
    try {
      const vouchersRes = await api.get('/vouchers');
      if (vouchersRes.data?.success) {
        setVouchers(vouchersRes.data.data);
      }

      const promosRes = await api.get('/promos');
      if (promosRes.data?.success) {
        setPromos(promosRes.data.data);
      }
    } catch (err: any) {
      console.log('Error fetching discount lists:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleToggleStatus = async (item: DiscountItem) => {
    const typeLabel = activeTab === 'VOUCHER' ? 'voucher' : 'promo';
    const actionLabel = item.isActive ? 'menonaktifkan' : 'mengaktifkan';

    Alert.alert(
      'Ubah Status',
      `Apakah Anda yakin ingin ${actionLabel} ${typeLabel} dengan kode "${item.code}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya',
          onPress: async () => {
            try {
              const url = activeTab === 'VOUCHER'
                ? `/admin/vouchers/${item.code}/toggle`
                : `/admin/promos/${item.code}/toggle`;

              const res = await api.patch(url);
              if (res.data?.success) {
                Alert.alert('Sukses', `${typeLabel} berhasil di-toggle.`);
                fetchData();
              }
            } catch (err: any) {
              Alert.alert('Gagal', err.response?.data?.message || 'Gagal mengubah status diskon.');
            }
          },
        },
      ]
    );
  };

  const validateForm = (c: string, v: string, e: string, u: string) => {
    const errors: Record<string, string> = {};
    if (!c || c.length < 3) {
      errors.code = 'Kode minimal 3 karakter alfanumerik.';
    }

    const valueNum = Number(v);
    if (!v || isNaN(valueNum) || valueNum <= 0) {
      errors.value = 'Nilai diskon harus berupa angka positif.';
    } else if (discountType === 'PERCENTAGE' && valueNum > 100) {
      errors.value = 'Nilai persentase maksimal 100%.';
    }

    if (!e || isNaN(Date.parse(e))) {
      errors.expiryDate = 'Format tanggal kadaluarsa tidak valid (YYYY-MM-DD).';
    }

    if (formType === 'VOUCHER') {
      const limitNum = Number(u);
      if (!u || isNaN(limitNum) || limitNum <= 0) {
        errors.usageLimit = 'Batas penggunaan harus berupa angka positif.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateDiscount = async () => {
    const cleanCode = code.toUpperCase().trim().replace(/[^A-Z0-9]/g, '').slice(0, 20);
    const cleanValue = value.trim().replace(/\D/g, '');
    const cleanUsageLimit = usageLimit.trim().replace(/\D/g, '');
    const cleanExpiryDate = expiryDate.trim();

    setCode(cleanCode);
    setValue(cleanValue);
    setUsageLimit(cleanUsageLimit);
    setExpiryDate(cleanExpiryDate);

    if (!validateForm(cleanCode, cleanValue, cleanExpiryDate, cleanUsageLimit)) return;

    setSubmitLoading(true);
    try {
      const formattedDate = new Date(cleanExpiryDate).toISOString();
      const payload: any = {
        code: cleanCode,
        type: discountType,
        value: Number(cleanValue),
        expiryDate: formattedDate,
      };

      if (formType === 'VOUCHER') {
        payload.usageLimit = Number(cleanUsageLimit);
      }

      const url = formType === 'VOUCHER' ? '/admin/vouchers' : '/admin/promos';
      const res = await api.post(url, payload);

      if (res.data?.success) {
        Alert.alert('Sukses', `${formType} berhasil ditambahkan!`);
        setIsModalOpen(false);
        setCode('');
        setValue('');
        setFormErrors({});
        fetchData();
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Terjadi kesalahan saat membuat diskon.';
      Alert.alert('Gagal Membuat', errMsg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const renderDiscountItem = ({ item }: { item: DiscountItem }) => {
    const formattedDate = new Date(item.expiryDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const displayValue = item.type === 'PERCENTAGE' ? `${item.value}%` : formatCurrency(item.value);

    return (
      <Card className={`mb-3 p-4 border rounded-md ${item.isActive ? 'border-primary' : 'border-neutral-300'} ${!item.isActive ? 'opacity-60' : ''}`}>
        <View className="flex-row justify-between items-center pb-3 mb-3" style={{ borderBottomWidth: 1.5, borderBottomColor: theme.neutral[200] }}>
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: `${theme.primary}15` }}>
              <Percent size={16} color={theme.primary} />
            </View>
            <ThemedText className="font-bold">
              {item.code}
            </ThemedText>
          </View>
          <Badge label={item.isActive ? 'Aktif' : 'Nonaktif'} variant={item.isActive ? 'success' : 'neutral'} />
        </View>

        <View className="gap-2">
          <View className="flex-row justify-between items-center">
            <ThemedText>Potongan Diskon</ThemedText>
            <ThemedText className="font-bold text-primary">
              {displayValue}
            </ThemedText>
          </View>

          <View className="flex-row items-center gap-2">
            <Calendar size={14} color={theme.neutral[500]} />
            <ThemedText>
              Kadaluarsa: {formattedDate}
            </ThemedText>
          </View>

          {activeTab === 'VOUCHER' && (
            <View className="flex-row items-center gap-2">
              <UserCheck size={14} color={theme.neutral[500]} />
              <ThemedText>
                Pemakaian: {item.usedCount ?? 0} / {item.usageLimit}
              </ThemedText>
            </View>
          )}

          <View className="h-[1.5px] my-1" style={{ backgroundColor: theme.neutral[200] }} />

          <Pressable
            onPress={() => handleToggleStatus(item)}
            className="flex-row justify-between items-center pt-1 active:opacity-60"
          >
            <ThemedText className="font-semibold">
              Status Aktif
            </ThemedText>
            {item.isActive ? (
              <ToggleRight size={36} color={theme.primary} />
            ) : (
              <ToggleLeft size={36} color={theme.neutral[400]} />
            )}
          </Pressable>
        </View>
      </Card>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View className="items-center justify-center py-10 px-5 mt-8">
        <View className="w-24 h-24 rounded-full items-center justify-center mb-5" style={{ backgroundColor: theme.neutral[100] }}>
          <Percent size={44} color={theme.neutral[400]} />
        </View>
        <ThemedText className="font-bold text-center mb-2" style={{ color: theme.neutral[900] }}>
          Belum Ada Data
        </ThemedText>
        <ThemedText className="text-center px-4 leading-5" style={{ color: theme.neutral[500] }}>
          Belum ada {activeTab === 'VOUCHER' ? 'voucher belanja' : 'promo global aplikasi'} yang terdaftar. Tekan tombol + untuk menambah.
        </ThemedText>
      </View>
    );
  };

  const renderSkeleton = () => (
    <ThemedView className="flex-1">
      <View className="flex-row h-12 border-b" style={{ borderBottomColor: theme.neutral[200] }}>
        <View className="flex-1 items-center justify-center">
          <View className="h-4 w-28 rounded" style={{ backgroundColor: theme.neutral[200] }} />
        </View>
        <View className="flex-1 items-center justify-center">
          <View className="h-4 w-28 rounded" style={{ backgroundColor: theme.neutral[200] }} />
        </View>
      </View>
      <Animated.View style={{ opacity: pulseAnim }} className="p-4">
        {[1, 2, 3, 4].map((i) => (
          <View key={i} className="h-40 rounded-xl mb-3" style={{ backgroundColor: theme.neutral[200] }} />
        ))}
      </Animated.View>
    </ThemedView>
  );

  if (loading && !refreshing) {
    return renderSkeleton();
  }

  const activeData = activeTab === 'VOUCHER' ? vouchers : promos;

  return (
    <ThemedView className="flex-1">
      <View className="flex-row h-12" style={{ backgroundColor: theme.neutral[50], borderBottomWidth: 1.5, borderBottomColor: theme.neutral[200] }}>
        <Pressable
          className="flex-1 items-center justify-center"
          style={{ borderBottomWidth: 2.5, borderBottomColor: activeTab === 'VOUCHER' ? theme.primary : 'transparent' }}
          onPress={() => setActiveTab('VOUCHER')}
        >
          <ThemedText
            className="font-semibold"
            style={{ color: activeTab === 'VOUCHER' ? theme.primary : theme.neutral[500] }}
          >
            Voucher Belanja
          </ThemedText>
        </Pressable>
        <Pressable
          className="flex-1 items-center justify-center"
          style={{ borderBottomWidth: 2.5, borderBottomColor: activeTab === 'PROMO' ? theme.primary : 'transparent' }}
          onPress={() => setActiveTab('PROMO')}
        >
          <ThemedText
            className="font-semibold"
            style={{ color: activeTab === 'PROMO' ? theme.primary : theme.neutral[500] }}
          >
            Promo Aplikasi
          </ThemedText>
        </Pressable>
      </View>

      <FlatList
        data={activeData}
        renderItem={renderDiscountItem}
        keyExtractor={(item) => item.code}
        contentContainerClassName="p-4"
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

      <Pressable
        onPress={() => {
          setFormType(activeTab);
          setIsModalOpen(true);
        }}
        className="absolute w-14 h-14 rounded-full items-center justify-center right-4"
        style={{
          backgroundColor: theme.primary,
          bottom: 20,
        }}
      >
        <Plus size={24} color="#FFFFFF" />
      </Pressable>

      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-3xl max-h-[85%] p-5" style={{ backgroundColor: theme.neutral[50] }}>
            <View className="flex-row justify-between items-center pb-4 mb-4" style={{ borderBottomWidth: 1.5, borderBottomColor: theme.neutral[200] }}>
              <ThemedText className="font-bold" style={{ color: theme.neutral[900] }}>
                Tambah {formType === 'VOUCHER' ? 'Voucher Belanja' : 'Promo Aplikasi'}
              </ThemedText>
              <Pressable onPress={() => setIsModalOpen(false)} className="p-1 active:opacity-60">
                <ThemedText className="font-bold" style={{ color: theme.neutral[500] }}><X size={18} color={theme.neutral[500]} /></ThemedText>
              </Pressable>
            </View>

            <ScrollView contentContainerClassName="pb-5">
              <Input
                label="Kode Kupon Diskon"
                placeholder="CONTOH: SEAVOUCHER20"
                value={code}
                onChangeText={setCode}
                error={formErrors.code}
                autoCapitalize="characters"
              />

              <ThemedText className="font-semibold mb-2" style={{ color: theme.neutral[700] }}>
                Tipe Potongan Harga
              </ThemedText>
              <View className="flex-row gap-2 mb-4">
                <Pressable
                  onPress={() => setDiscountType('PERCENTAGE')}
                  className="flex-1 h-11 rounded-lg items-center justify-center active:opacity-70"
                  style={{
                    backgroundColor: discountType === 'PERCENTAGE' ? theme.primary : 'transparent',
                    borderWidth: 1.5,
                    borderColor: discountType === 'PERCENTAGE' ? theme.primary : theme.neutral[300],
                  }}
                >
                  <ThemedText
                    className="font-bold"
                    style={{ color: discountType === 'PERCENTAGE' ? '#FFFFFF' : theme.neutral[700] }}
                  >
                    Persentase (%)
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => setDiscountType('FIXED')}
                  className="flex-1 h-11 rounded-lg items-center justify-center active:opacity-70"
                  style={{
                    backgroundColor: discountType === 'FIXED' ? theme.primary : 'transparent',
                    borderWidth: 1.5,
                    borderColor: discountType === 'FIXED' ? theme.primary : theme.neutral[300],
                  }}
                >
                  <ThemedText
                    className="font-bold"
                    style={{ color: discountType === 'FIXED' ? '#FFFFFF' : theme.neutral[700] }}
                  >
                    Nominal Flat (Rp)
                  </ThemedText>
                </Pressable>
              </View>

              <Input
                label={`Nilai Diskon (${discountType === 'PERCENTAGE' ? '%' : 'Rp'})`}
                placeholder={discountType === 'PERCENTAGE' ? 'Contoh: 15' : 'Contoh: 10000'}
                value={value}
                onChangeText={setValue}
                keyboardType="numeric"
                error={formErrors.value}
              />

              <Input
                label="Tanggal Kedaluwarsa (YYYY-MM-DD)"
                placeholder="Contoh: 2026-12-31"
                value={expiryDate}
                onChangeText={setExpiryDate}
                error={formErrors.expiryDate}
              />

              {formType === 'VOUCHER' && (
                <Input
                  label="Batas Kuota Penggunaan Kupon"
                  placeholder="Contoh: 100"
                  value={usageLimit}
                  onChangeText={setUsageLimit}
                  keyboardType="numeric"
                  error={formErrors.usageLimit}
                />
              )}

              <Button
                label={`Tambah ${formType === 'VOUCHER' ? 'Voucher' : 'Promo'}`}
                loading={submitLoading}
                onPress={handleCreateDiscount}
                className="mt-4"
                size="large"
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}
