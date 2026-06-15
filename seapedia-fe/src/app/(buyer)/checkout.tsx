import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Truck, Ticket, Wallet, CheckCircle2, ChevronRight, AlertTriangle, X } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spacing } from '@/constants/theme';
import api from '@/services/api';

interface Address {
  id: string;
  label: string;
  recipientName: string;
  phoneNumber: string;
  fullAddress: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
}

interface PreviewSummary {
  subtotal: number;
  discount: {
    amount: number;
    source: 'VOUCHER' | 'PROMO' | null;
    code: string | null;
    type: 'PERCENTAGE' | 'FIXED' | null;
    value: number | null;
  };
  deliveryFee: number;
  ppn: number;
  discountedSubtotal: number;
  total: number;
}

type DeliveryMethod = 'INSTANT' | 'NEXT_DAY' | 'REGULAR';

export default function CheckoutScreen() {
  const theme = useTheme();
  const router = useRouter();

  // Data States
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('REGULAR');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  
  // Preview State
  const [preview, setPreview] = useState<PreviewSummary | null>(null);
  
  // Loading States
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);

  const fetchData = async () => {
    try {
      const [addrRes, walletRes] = await Promise.all([
        api.get('/buyer/addresses'),
        api.get('/buyer/wallet'),
      ]);

      if (addrRes.data?.success) {
        const addrList = addrRes.data.data;
        setAddresses(addrList);
        // Set default address as initial selection
        const defAddr = addrList.find((a: Address) => a.isDefault) || addrList[0] || null;
        setSelectedAddress(defAddr);
      }
      
      if (walletRes.data?.success) {
        setWalletBalance(Number(walletRes.data.data.balance));
      }
    } catch (err: any) {
      Alert.alert('Gagal', err.response?.data?.message || 'Gagal memuat informasi checkout.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update preview when delivery method or applied discount code changes
  useEffect(() => {
    const fetchPreview = async () => {
      setCalculating(true);
      try {
        const response = await api.post('/buyer/checkout/preview', {
          deliveryMethod,
          discountCode: appliedCode || undefined,
        });

        if (response.data?.success) {
          setPreview(response.data.data);
        }
      } catch (err: any) {
        // If discount code validation fails, strip it
        if (appliedCode) {
          Alert.alert('Voucher/Promo Ditolak', err.response?.data?.message || 'Kode diskon tidak valid.');
          setAppliedCode(null);
          setDiscountCode('');
        }
      } finally {
        setCalculating(false);
      }
    };

    if (!loading) {
      fetchPreview();
    }
  }, [deliveryMethod, appliedCode, loading]);

  const handleApplyDiscount = () => {
    if (!discountCode.trim()) {
      setAppliedCode(null);
      return;
    }
    // Set appliedCode which triggers the useEffect preview recalculation
    setAppliedCode(discountCode.trim().toUpperCase());
  };

  const handleRemoveDiscount = () => {
    setAppliedCode(null);
    setDiscountCode('');
  };

  const handleCheckout = async () => {
    if (!selectedAddress) {
      Alert.alert('Peringatan', 'Silakan pilih alamat pengiriman terlebih dahulu.');
      return;
    }
    if (!preview) return;

    if (walletBalance < preview.total) {
      Alert.alert('Saldo Kurang', 'Saldo dompet Anda tidak cukup untuk membayar checkout ini.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/buyer/checkout', {
        addressId: selectedAddress.id,
        deliveryMethod,
        discountCode: appliedCode || undefined,
      });

      if (response.data?.success) {
        Alert.alert(
          'Checkout Sukses',
          'Pesanan Anda berhasil dibuat dan pembayaran telah diproses.',
          [
            {
              text: 'Lihat Pesanan',
              onPress: () => {
                // Redirect to Buyer orders page
                router.replace('/(buyer)/(tabs)/orders' as any);
              },
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert('Checkout Gagal', err.response?.data?.message || 'Gagal memproses checkout.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={{ marginTop: Spacing.three, color: theme.textSecondary }}>
          Mempersiapkan kalkulasi checkout...
        </ThemedText>
      </ThemedView>
    );
  }

  const isWalletInsufficient = preview && walletBalance < preview.total;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Shipping Address Selection Card */}
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Alamat Pengiriman
        </ThemedText>
        <Card style={styles.addressCard}>
          {selectedAddress ? (
            <View>
              <View style={styles.addressHeaderRow}>
                <View style={styles.addressLabelContainer}>
                  <MapPin size={18} color={theme.primary} />
                  <ThemedText type="smallBold" style={styles.addressLabel}>
                    {selectedAddress.label}
                  </ThemedText>
                  {selectedAddress.isDefault && <Badge label="Default" variant="primary" />}
                </View>
                <Pressable onPress={() => setAddressModalVisible(true)} style={styles.changeAddressBtn}>
                  <ThemedText style={{ color: theme.primary, fontSize: 13, fontWeight: '700' }}>
                    Ganti
                  </ThemedText>
                  <ChevronRight size={16} color={theme.primary} />
                </Pressable>
              </View>
              <View style={styles.addressDetails}>
                <ThemedText type="smallBold" style={{ fontSize: 14 }}>
                  {selectedAddress.recipientName}
                </ThemedText>
                <ThemedText style={{ fontSize: 13 }} themeColor="textSecondary">
                  {selectedAddress.phoneNumber}
                </ThemedText>
                <ThemedText style={styles.fullAddressText}>
                  {selectedAddress.fullAddress}, {selectedAddress.city}, {selectedAddress.postalCode}
                </ThemedText>
              </View>
            </View>
          ) : (
            <View style={styles.noAddressContainer}>
              <AlertTriangle size={32} color={theme.danger} />
              <ThemedText style={styles.noAddressText} themeColor="textSecondary">
                Anda belum menentukan alamat pengiriman.
              </ThemedText>
              <Button
                label="Tambah Alamat Baru"
                size="small"
                onPress={() => router.push('/(buyer)/(tabs)/addresses')}
              />
            </View>
          )}
        </Card>

        {/* Shipping Method Selection */}
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Pilih Metode Pengiriman
        </ThemedText>
        <View style={styles.deliveryRow}>
          <Pressable
            onPress={() => setDeliveryMethod('REGULAR')}
            style={[
              styles.deliveryBox,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: deliveryMethod === 'REGULAR' ? theme.primary : theme.border,
              },
            ]}
          >
            <Truck size={20} color={deliveryMethod === 'REGULAR' ? theme.primary : theme.textSecondary} />
            <ThemedText type="smallBold" style={styles.deliveryLabel}>
              Regular
            </ThemedText>
            <ThemedText style={styles.deliveryFeeText} themeColor="primary">
              {formatCurrency(10000)}
            </ThemedText>
            <ThemedText style={{ fontSize: 10, marginTop: 2 }} themeColor="textSecondary">
              SLA 72 Jam
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => setDeliveryMethod('NEXT_DAY')}
            style={[
              styles.deliveryBox,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: deliveryMethod === 'NEXT_DAY' ? theme.primary : theme.border,
              },
            ]}
          >
            <Truck size={20} color={deliveryMethod === 'NEXT_DAY' ? theme.primary : theme.textSecondary} />
            <ThemedText type="smallBold" style={styles.deliveryLabel}>
              Next Day
            </ThemedText>
            <ThemedText style={styles.deliveryFeeText} themeColor="primary">
              {formatCurrency(15000)}
            </ThemedText>
            <ThemedText style={{ fontSize: 10, marginTop: 2 }} themeColor="textSecondary">
              SLA 24 Jam
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => setDeliveryMethod('INSTANT')}
            style={[
              styles.deliveryBox,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: deliveryMethod === 'INSTANT' ? theme.primary : theme.border,
              },
            ]}
          >
            <Truck size={20} color={deliveryMethod === 'INSTANT' ? theme.primary : theme.textSecondary} />
            <ThemedText type="smallBold" style={styles.deliveryLabel}>
              Instant
            </ThemedText>
            <ThemedText style={styles.deliveryFeeText} themeColor="primary">
              {formatCurrency(25000)}
            </ThemedText>
            <ThemedText style={{ fontSize: 10, marginTop: 2 }} themeColor="textSecondary">
              SLA 3 Jam
            </ThemedText>
          </Pressable>
        </View>

        {/* Voucher & Promo Code Section */}
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Voucher & Promo Diskon
        </ThemedText>
        <Card style={styles.discountCard}>
          {appliedCode ? (
            <View style={styles.appliedCodeRow}>
              <View style={styles.appliedCodeLeft}>
                <Ticket size={20} color={theme.success} />
                <View style={{ marginLeft: Spacing.two }}>
                  <ThemedText type="smallBold" style={{ textTransform: 'uppercase' }}>
                    {appliedCode}
                  </ThemedText>
                  {preview && preview.discount.amount > 0 && (
                    <ThemedText style={{ fontSize: 12 }} themeColor="success">
                      Hemat {formatCurrency(preview.discount.amount)} ({preview.discount.source})
                    </ThemedText>
                  )}
                </View>
              </View>
              <Pressable onPress={handleRemoveDiscount} style={styles.removeDiscountBtn}>
                <ThemedText style={{ color: theme.danger, fontWeight: '700', fontSize: 13 }}>
                  Hapus
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.inputDiscountRow}>
              <Input
                placeholder="Masukkan kode voucher / promo"
                value={discountCode}
                onChangeText={setDiscountCode}
                leftIcon={<Ticket size={18} color={theme.textSecondary} />}
                containerStyle={styles.discountInput}
                autoCapitalize="characters"
              />
              <Button
                label="Gunakan"
                onPress={handleApplyDiscount}
                disabled={!discountCode.trim()}
                style={styles.applyBtn}
              />
            </View>
          )}
        </Card>

        {/* Wallet Balance Display Card */}
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Metode Pembayaran
        </ThemedText>
        <Card style={[styles.paymentCard, isWalletInsufficient && { borderColor: theme.danger, borderWidth: 1 }]}>
          <View style={styles.walletRow}>
            <View style={styles.walletLeft}>
              <Wallet size={22} color={isWalletInsufficient ? theme.danger : theme.primary} />
              <ThemedText type="smallBold" style={{ marginLeft: Spacing.two }}>
                Saldo Dompet SEAPEDIA
              </ThemedText>
            </View>
            <ThemedText style={styles.walletBalanceText}>
              {formatCurrency(walletBalance)}
            </ThemedText>
          </View>
          {isWalletInsufficient && (
            <View style={[styles.warningBanner, { backgroundColor: `${theme.danger}15` }]}>
              <AlertTriangle size={18} color={theme.danger} />
              <ThemedText style={styles.warningText} themeColor="danger">
                Saldo Anda kurang {formatCurrency(preview!.total - walletBalance)}. Silakan top-up.
              </ThemedText>
              <Pressable onPress={() => router.push('/(buyer)/wallet-history')} style={styles.topupLink}>
                <ThemedText style={{ color: theme.primary, fontWeight: '700', fontSize: 13 }}>
                  Top Up
                </ThemedText>
              </Pressable>
            </View>
          )}
        </Card>

        {/* Billing / Cost Details Box */}
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Rincian Pembayaran
        </ThemedText>
        <Card style={styles.previewCard}>
          {calculating ? (
            <View style={styles.calcLoader}>
              <ActivityIndicator size="small" color={theme.primary} />
              <ThemedText style={{ marginLeft: Spacing.two }} themeColor="textSecondary">
                Mengalkulasi ulang rincian...
              </ThemedText>
            </View>
          ) : preview ? (
            <View style={styles.billingContainer}>
              <View style={styles.billingRow}>
                <ThemedText style={{ color: theme.textSecondary }}>Subtotal Barang</ThemedText>
                <ThemedText style={styles.billingVal}>{formatCurrency(preview.subtotal)}</ThemedText>
              </View>

              {preview.discount.amount > 0 && (
                <View style={styles.billingRow}>
                  <ThemedText style={{ color: theme.success }}>
                    Diskon ({preview.discount.code})
                  </ThemedText>
                  <ThemedText style={[styles.billingVal, { color: theme.success }]}>
                    -{formatCurrency(preview.discount.amount)}
                  </ThemedText>
                </View>
              )}

              <View style={styles.billingRow}>
                <ThemedText style={{ color: theme.textSecondary }}>Ongkos Kirim</ThemedText>
                <ThemedText style={styles.billingVal}>{formatCurrency(preview.deliveryFee)}</ThemedText>
              </View>

              <View style={styles.billingRow}>
                <ThemedText style={{ color: theme.textSecondary }}>PPN (12%)</ThemedText>
                <ThemedText style={styles.billingVal}>{formatCurrency(preview.ppn)}</ThemedText>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <View style={styles.billingTotalRow}>
                <ThemedText type="smallBold">Total Bayar</ThemedText>
                <ThemedText style={styles.totalAmountText} themeColor="primary">
                  {formatCurrency(preview.total)}
                </ThemedText>
              </View>
            </View>
          ) : (
            <ThemedText style={{ color: theme.textSecondary, textAlign: 'center' }}>
              Pilih metode pengiriman untuk menampilkan rincian biaya.
            </ThemedText>
          )}
        </Card>

        {/* Action Button */}
        <Button
          label={isWalletInsufficient ? 'Saldo Tidak Cukup' : 'Buat Pesanan Sekarang'}
          rightIcon={!isWalletInsufficient && <CheckCircle2 size={20} color="#FFFFFF" />}
          onPress={handleCheckout}
          loading={submitting}
          disabled={!selectedAddress || isWalletInsufficient || calculating}
          style={styles.submitBtn}
        />
      </ScrollView>

      {/* Address Selection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={addressModalVisible}
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView type="backgroundElement" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="smallBold" style={{ fontSize: 18 }}>
                Pilih Alamat Pengiriman
              </ThemedText>
              <Pressable onPress={() => setAddressModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={theme.text} />
              </Pressable>
            </View>

            <FlatList
              data={addresses}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.addressListContent}
              renderItem={({ item }) => {
                const isSelected = selectedAddress?.id === item.id;
                return (
                  <Pressable
                    onPress={() => {
                      setSelectedAddress(item);
                      setAddressModalVisible(false);
                    }}
                  >
                    <Card style={[styles.modalAddressCard, isSelected && { borderColor: theme.primary, borderWidth: 1.5 }]}>
                      <View style={styles.addressHeaderRow}>
                        <ThemedText type="smallBold">{item.label}</ThemedText>
                        {item.isDefault && <Badge label="Default" variant="primary" />}
                      </View>
                      <ThemedText style={{ fontSize: 13, fontWeight: '700', marginTop: 4 }}>
                        {item.recipientName} ({item.phoneNumber})
                      </ThemedText>
                      <ThemedText style={{ fontSize: 12, marginTop: 2 }} themeColor="textSecondary">
                        {item.fullAddress}, {item.city}, {item.postalCode}
                      </ThemedText>
                    </Card>
                  </Pressable>
                );
              }}
            />
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
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  sectionTitle: {
    fontSize: 14,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: Spacing.two,
    marginTop: Spacing.three,
  },
  addressCard: {
    padding: Spacing.four,
    borderRadius: 14,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one * 1.5,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  changeAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.one,
  },
  addressDetails: {
    marginTop: Spacing.three,
    gap: Spacing.one / 2,
  },
  fullAddressText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  noAddressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  noAddressText: {
    fontSize: 13,
    textAlign: 'center',
  },
  deliveryRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  deliveryBox: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryLabel: {
    fontSize: 13,
    marginTop: Spacing.one,
  },
  deliveryFeeText: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: Spacing.one / 2,
  },
  discountCard: {
    padding: Spacing.three,
  },
  inputDiscountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  discountInput: {
    flex: 1,
    marginBottom: 0,
  },
  applyBtn: {
    height: 52,
    width: 90,
  },
  appliedCodeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  appliedCodeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeDiscountBtn: {
    padding: Spacing.two,
  },
  paymentCard: {
    padding: Spacing.four,
  },
  walletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletBalanceText: {
    fontSize: 16,
    fontWeight: '800',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.three,
    padding: Spacing.two,
    borderRadius: 8,
    gap: Spacing.two,
  },
  warningText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  topupLink: {
    padding: Spacing.one,
  },
  previewCard: {
    padding: Spacing.four,
  },
  calcLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  billingContainer: {
    gap: Spacing.two,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billingVal: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.two,
  },
  billingTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalAmountText: {
    fontSize: 18,
    fontWeight: '900',
  },
  submitBtn: {
    marginTop: Spacing.five,
    height: 52,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: Spacing.five,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.four,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  closeBtn: {
    padding: Spacing.one,
  },
  addressListContent: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  modalAddressCard: {
    padding: Spacing.three,
    borderWidth: 1,
  },
});
