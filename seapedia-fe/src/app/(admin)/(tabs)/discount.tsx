import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Alert,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Percent, Plus, ToggleLeft, ToggleRight, Calendar, UserCheck, AlertCircle, RefreshCcw } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Spacing } from '@/constants/theme';
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

  // Modal creation states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formType, setFormType] = useState<ModeTab>('VOUCHER');
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [value, setValue] = useState('');
  const [expiryDate, setExpiryDate] = useState('2026-12-31');
  const [usageLimit, setUsageLimit] = useState('100');
  
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
    // Sanitasi input sisi klien
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
        // Reset form
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
      <Card className={`mb-3 p-4 ${!item.isActive ? 'opacity-65' : ''}`}>
        <View className="flex-row justify-between items-center border-b border-black/5 dark:border-white/5 pb-2 mb-2">
          <View className="flex-row items-center gap-2">
            <Percent size={18} color={theme.primary} />
            <ThemedText type="smallBold" className="text-[15px]">
              {item.code}
            </ThemedText>
          </View>
          <Badge label={item.isActive ? 'Aktif' : 'Nonaktif'} variant={item.isActive ? 'success' : 'neutral'} />
        </View>

        <View className="gap-2">
          <View className="flex-row justify-between items-center">
            <ThemedText className="text-[13px]" themeColor="textSecondary">
              Potongan Diskon:
            </ThemedText>
            <ThemedText type="smallBold" className="text-[14px]">
              {displayValue} ({item.type})
            </ThemedText>
          </View>

          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-2">
              <Calendar size={14} color={theme.textSecondary} />
              <ThemedText className="text-[13px]" themeColor="textSecondary">
                Kadaluarsa: {formattedDate}
              </ThemedText>
            </View>
          </View>

          {activeTab === 'VOUCHER' && (
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-2">
                <UserCheck size={14} color={theme.textSecondary} />
                <ThemedText className="text-[13px]" themeColor="textSecondary">
                  Pemakaian: {item.usedCount ?? 0} / {item.usageLimit}
                </ThemedText>
              </View>
            </View>
          )}

          <View className="h-[1px] my-1" style={{ backgroundColor: theme.border }} />

          <Pressable
            onPress={() => handleToggleStatus(item)}
            className="flex-row justify-between items-center pt-1"
          >
            <ThemedText className="text-[13.5px] font-semibold">
              Status Aktif
            </ThemedText>
            {item.isActive ? (
              <ToggleRight size={36} color={theme.primary} />
            ) : (
              <ToggleLeft size={36} color={theme.placeholder} />
            )}
          </Pressable>
        </View>
      </Card>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View className="items-center justify-center py-6 px-5">
        <Percent size={52} color={theme.placeholder} />
        <ThemedText className="text-center mt-3" themeColor="textSecondary">
          Belum ada {activeTab === 'VOUCHER' ? 'voucher belanja' : 'promo global aplikasi'} yang terdaftar.
        </ThemedText>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText className="mt-3" themeColor="textSecondary">
          Mengambil data potongan diskon...
        </ThemedText>
      </ThemedView>
    );
  }

  const activeData = activeTab === 'VOUCHER' ? vouchers : promos;

  return (
    <ThemedView className="flex-1">
      {/* Tab Vouchers vs Promos */}
      <View className="flex-row border-b h-12" style={{ borderBottomColor: theme.border }}>
        <Pressable
          className={`flex-1 items-center justify-center border-b-[2.5px] ${activeTab === 'VOUCHER' ? '' : 'border-transparent'}`}
          style={activeTab === 'VOUCHER' ? { borderBottomColor: theme.primary } : {}}
          onPress={() => setActiveTab('VOUCHER')}
        >
          <ThemedText
            className={`text-[13.5px] font-medium ${activeTab === 'VOUCHER' ? 'font-bold' : ''}`}
            style={{ color: activeTab === 'VOUCHER' ? theme.primary : theme.textSecondary }}
          >
            Voucher Belanja
          </ThemedText>
        </Pressable>
        <Pressable
          className={`flex-1 items-center justify-center border-b-[2.5px] ${activeTab === 'PROMO' ? '' : 'border-transparent'}`}
          style={activeTab === 'PROMO' ? { borderBottomColor: theme.primary } : {}}
          onPress={() => setActiveTab('PROMO')}
        >
          <ThemedText
            className={`text-[13.5px] font-medium ${activeTab === 'PROMO' ? 'font-bold' : ''}`}
            style={{ color: activeTab === 'PROMO' ? theme.primary : theme.textSecondary }}
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

      {/* Floating Action Button (FAB) to Add Voucher/Promo */}
      <Pressable
        onPress={() => {
          setFormType(activeTab);
          setIsModalOpen(true);
        }}
        className="absolute w-14 h-14 rounded-full items-center justify-center right-4"
        style={{
          backgroundColor: theme.primary,
          bottom: 68 + insets.bottom,
          elevation: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
        }}
      >
        <Plus size={24} color="#FFFFFF" />
      </Pressable>

      {/* Creation Modal Form */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <ThemedView className="rounded-t-3xl max-h-[85%] p-4" style={{ backgroundColor: theme.background }}>
            <View className="flex-row justify-between items-center border-b-[1.5px] border-black/5 dark:border-white/5 pb-3 mb-3">
              <ThemedText type="smallBold" className="text-[16px]">
                Tambah {formType === 'VOUCHER' ? 'Voucher Belanja' : 'Promo Aplikasi'} Baru
              </ThemedText>
              <Pressable onPress={() => setIsModalOpen(false)} className="p-1">
                <ThemedText className="font-bold" themeColor="textSecondary">Tutup</ThemedText>
              </Pressable>
            </View>

            <ScrollView contentContainerClassName="pb-5">
              {/* Form Input fields */}
              <Input
                label="Kode Kupon Diskon"
                placeholder="CONTOH: SEAVOUCHER20"
                value={code}
                onChangeText={setCode}
                error={formErrors.code}
                autoCapitalize="characters"
              />

              {/* Type Switcher */}
              <ThemedText type="smallBold" className="text-[12px] mb-1" themeColor="textSecondary">
                Tipe Potongan Harga
              </ThemedText>
              <View className="flex-row gap-2 mb-3">
                <Pressable
                  onPress={() => setDiscountType('PERCENTAGE')}
                  className="flex-1 h-11 rounded-lg border-[1.5px] items-center justify-center"
                  style={[
                    { borderColor: 'rgba(0,0,0,0.15)' },
                    discountType === 'PERCENTAGE' && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                >
                  <ThemedText className={`text-[13px] font-bold ${discountType === 'PERCENTAGE' ? 'text-white' : ''}`}>
                    Persentase (%)
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => setDiscountType('FIXED')}
                  className="flex-1 h-11 rounded-lg border-[1.5px] items-center justify-center"
                  style={[
                    { borderColor: 'rgba(0,0,0,0.15)' },
                    discountType === 'FIXED' && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                >
                  <ThemedText className={`text-[13px] font-bold ${discountType === 'FIXED' ? 'text-white' : ''}`}>
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
                className="mt-4 h-[52px]"
              />
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}
