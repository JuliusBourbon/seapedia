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
import api from '@/services/api';

interface DiscountItem {
  code: string;
  type: 'PERCENTAGE' | 'FLAT';
  value: number;
  expiryDate: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount?: number;
}

type ModeTab = 'VOUCHER' | 'PROMO';

export default function AdminDiscountScreen() {
  const theme = useTheme();

  const [vouchers, setVouchers] = useState<DiscountItem[]>([]);
  const [promos, setPromos] = useState<DiscountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ModeTab>('VOUCHER');

  // Modal creation states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formType, setFormType] = useState<ModeTab>('VOUCHER');
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
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

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!code || code.trim().length < 3) {
      errors.code = 'Kode minimal 3 karakter.';
    }
    if (!value || isNaN(Number(value)) || Number(value) <= 0) {
      errors.value = 'Nilai diskon harus berupa angka positif.';
    } else if (discountType === 'PERCENTAGE' && Number(value) > 100) {
      errors.value = 'Nilai persentase maksimal 100%.';
    }
    
    if (!expiryDate || isNaN(Date.parse(expiryDate))) {
      errors.expiryDate = 'Format tanggal kadaluarsa tidak valid (YYYY-MM-DD).';
    }

    if (formType === 'VOUCHER') {
      if (!usageLimit || isNaN(Number(usageLimit)) || Number(usageLimit) <= 0) {
        errors.usageLimit = 'Batas penggunaan harus berupa angka positif.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateDiscount = async () => {
    if (!validateForm()) return;

    setSubmitLoading(true);
    try {
      const formattedDate = new Date(expiryDate).toISOString();
      const payload: any = {
        code: code.toUpperCase().trim(),
        type: discountType,
        value: Number(value),
        expiryDate: formattedDate,
      };

      if (formType === 'VOUCHER') {
        payload.usageLimit = Number(usageLimit);
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
      <Card style={[styles.discountCard, !item.isActive && { opacity: 0.65 }]}>
        <View style={styles.cardHeader}>
          <View style={styles.codeRow}>
            <Percent size={18} color={theme.primary} />
            <ThemedText type="smallBold" style={styles.codeText}>
              {item.code}
            </ThemedText>
          </View>
          <Badge label={item.isActive ? 'Aktif' : 'Nonaktif'} variant={item.isActive ? 'success' : 'neutral'} />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <ThemedText style={{ fontSize: 13 }} themeColor="textSecondary">
              Potongan Diskon:
            </ThemedText>
            <ThemedText type="smallBold" style={{ fontSize: 14 }}>
              {displayValue} ({item.type})
            </ThemedText>
          </View>

          <View style={styles.infoRow}>
            <Calendar size={14} color={theme.textSecondary} />
            <ThemedText style={styles.infoText} themeColor="textSecondary">
              Kadaluarsa: {formattedDate}
            </ThemedText>
          </View>

          {activeTab === 'VOUCHER' && (
            <View style={styles.infoRow}>
              <UserCheck size={14} color={theme.textSecondary} />
              <ThemedText style={styles.infoText} themeColor="textSecondary">
                Pemakaian: {item.usedCount ?? 0} / {item.usageLimit}
              </ThemedText>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Pressable
            onPress={() => handleToggleStatus(item)}
            style={styles.toggleContainer}
          >
            <ThemedText style={styles.toggleLabel}>
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
      <View style={styles.emptyContainer}>
        <Percent size={52} color={theme.placeholder} />
        <ThemedText style={{ color: theme.textSecondary, marginTop: Spacing.three, textAlign: 'center' }}>
          Belum ada {activeTab === 'VOUCHER' ? 'voucher belanja' : 'promo global aplikasi'} yang terdaftar.
        </ThemedText>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={{ marginTop: Spacing.three, color: theme.textSecondary }}>
          Mengambil data potongan diskon...
        </ThemedText>
      </ThemedView>
    );
  }

  const activeData = activeTab === 'VOUCHER' ? vouchers : promos;

  return (
    <ThemedView style={styles.container}>
      {/* Tab Vouchers vs Promos */}
      <View style={[styles.tabContainer, { borderBottomColor: theme.border }]}>
        <Pressable
          style={[styles.tabItem, activeTab === 'VOUCHER' && { borderBottomColor: theme.primary }]}
          onPress={() => setActiveTab('VOUCHER')}
        >
          <ThemedText
            style={[
              styles.tabLabel,
              { color: activeTab === 'VOUCHER' ? theme.primary : theme.textSecondary },
              activeTab === 'VOUCHER' && { fontWeight: '700' },
            ]}
          >
            Voucher Belanja
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.tabItem, activeTab === 'PROMO' && { borderBottomColor: theme.primary }]}
          onPress={() => setActiveTab('PROMO')}
        >
          <ThemedText
            style={[
              styles.tabLabel,
              { color: activeTab === 'PROMO' ? theme.primary : theme.textSecondary },
              activeTab === 'PROMO' && { fontWeight: '700' },
            ]}
          >
            Promo Aplikasi
          </ThemedText>
        </Pressable>
      </View>

      <FlatList
        data={activeData}
        renderItem={renderDiscountItem}
        keyExtractor={(item) => item.code}
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

      {/* Floating Action Button (FAB) to Add Voucher/Promo */}
      <Pressable
        onPress={() => {
          setFormType(activeTab);
          setIsModalOpen(true);
        }}
        style={[styles.fab, { backgroundColor: theme.primary }]}
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
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="smallBold" style={{ fontSize: 16 }}>
                Tambah {formType === 'VOUCHER' ? 'Voucher Belanja' : 'Promo Aplikasi'} Baru
              </ThemedText>
              <Pressable onPress={() => setIsModalOpen(false)} style={styles.closeModalBtn}>
                <ThemedText style={{ color: theme.textSecondary, fontWeight: '700' }}>Tutup</ThemedText>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalFormScroll}>
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
              <ThemedText type="smallBold" style={styles.fieldLabel} themeColor="textSecondary">
                Tipe Potongan Harga
              </ThemedText>
              <View style={styles.toggleRow}>
                <Pressable
                  onPress={() => setDiscountType('PERCENTAGE')}
                  style={[
                    styles.toggleButton,
                    discountType === 'PERCENTAGE' && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                >
                  <ThemedText style={[styles.toggleText, discountType === 'PERCENTAGE' && { color: '#FFFFFF' }]}>
                    Persentase (%)
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => setDiscountType('FLAT')}
                  style={[
                    styles.toggleButton,
                    discountType === 'FLAT' && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                >
                  <ThemedText style={[styles.toggleText, discountType === 'FLAT' && { color: '#FFFFFF' }]}>
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
                style={styles.submitBtn}
              />
            </ScrollView>
          </ThemedView>
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    height: 48,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabLabel: {
    fontSize: 13.5,
    fontWeight: '500',
  },
  listContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.five,
  },
  discountCard: {
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
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  codeText: {
    fontSize: 15,
  },
  cardBody: {
    gap: Spacing.two,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.one,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.half,
  },
  toggleLabel: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.five,
  },
  fab: {
    position: 'absolute',
    right: Spacing.four,
    bottom: Spacing.four,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
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
    padding: Spacing.four,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: Spacing.three,
    marginBottom: Spacing.three,
  },
  closeModalBtn: {
    padding: Spacing.one,
  },
  modalFormScroll: {
    paddingBottom: Spacing.five,
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: Spacing.one,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  toggleButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: Spacing.four,
    height: 52,
  },
});
