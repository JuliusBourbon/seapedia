import React, { useEffect, useState } from 'react';
import {
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
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText className="mt-4 text-textSecondary">
          Mempersiapkan kalkulasi checkout...
        </ThemedText>
      </ThemedView>
    );
  }

  const isWalletInsufficient = preview && walletBalance < preview.total;

  return (
    <ThemedView className="flex-1">
      <ScrollView contentContainerClassName="p-4 pb-8">

        {/* Shipping Address Selection Card */}
        <ThemedText type="smallBold" className="text-sm uppercase font-bold tracking-wider mb-2 mt-3">
          Alamat Pengiriman
        </ThemedText>
        <Card className="p-4 rounded-[14px]">
          {selectedAddress ? (
            <View>
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-[6px]">
                  <MapPin size={18} color={theme.primary} />
                  <ThemedText type="smallBold" className="text-sm font-extrabold">
                    {selectedAddress.label}
                  </ThemedText>
                  {selectedAddress.isDefault && <Badge label="Default" variant="primary" />}
                </View>
                <Pressable onPress={() => setAddressModalVisible(true)} className="flex-row items-center p-1">
                  <ThemedText className="text-[13px] font-bold" themeColor="primary">
                    Ganti
                  </ThemedText>
                  <ChevronRight size={16} color={theme.primary} />
                </Pressable>
              </View>
              <View className="mt-3 gap-[2px]">
                <ThemedText type="smallBold" className="text-sm">
                  {selectedAddress.recipientName}
                </ThemedText>
                <ThemedText className="text-[13px]" themeColor="textSecondary">
                  {selectedAddress.phoneNumber}
                </ThemedText>
                <ThemedText className="text-[13px] leading-[18px] mt-[2px]">
                  {selectedAddress.fullAddress}, {selectedAddress.city}, {selectedAddress.postalCode}
                </ThemedText>
              </View>
            </View>
          ) : (
            <View className="items-center justify-center py-3 gap-2">
              <AlertTriangle size={32} color={theme.danger} />
              <ThemedText className="text-[13px] text-center" themeColor="textSecondary">
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
        <ThemedText type="smallBold" className="text-sm uppercase font-bold tracking-wider mb-2 mt-3">
          Pilih Metode Pengiriman
        </ThemedText>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setDeliveryMethod('REGULAR')}
            className={`flex-1 border-[1.5px] rounded-xl p-3 items-center justify-center ${deliveryMethod === 'REGULAR' ? 'border-primary' : 'border-white/20'}`}
            style={{ backgroundColor: theme.backgroundElement }}
          >
            <Truck size={20} color={deliveryMethod === 'REGULAR' ? theme.primary : theme.textSecondary} />
            <ThemedText type="smallBold" className="text-[13px] mt-1">
              Regular
            </ThemedText>
            <ThemedText className="text-[13px] font-extrabold mt-[2px]" themeColor="primary">
              {formatCurrency(10000)}
            </ThemedText>
            <ThemedText className="text-[10px] mt-[2px]" themeColor="textSecondary">
              SLA 72 Jam
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => setDeliveryMethod('NEXT_DAY')}
            className={`flex-1 border-[1.5px] rounded-xl p-3 items-center justify-center ${deliveryMethod === 'NEXT_DAY' ? 'border-primary' : 'border-white/20'}`}
            style={{ backgroundColor: theme.backgroundElement }}
          >
            <Truck size={20} color={deliveryMethod === 'NEXT_DAY' ? theme.primary : theme.textSecondary} />
            <ThemedText type="smallBold" className="text-[13px] mt-1">
              Next Day
            </ThemedText>
            <ThemedText className="text-[13px] font-extrabold mt-[2px]" themeColor="primary">
              {formatCurrency(15000)}
            </ThemedText>
            <ThemedText className="text-[10px] mt-[2px]" themeColor="textSecondary">
              SLA 24 Jam
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => setDeliveryMethod('INSTANT')}
            className={`flex-1 border-[1.5px] rounded-xl p-3 items-center justify-center ${deliveryMethod === 'INSTANT' ? 'border-primary' : 'border-white/20'}`}
            style={{ backgroundColor: theme.backgroundElement }}
          >
            <Truck size={20} color={deliveryMethod === 'INSTANT' ? theme.primary : theme.textSecondary} />
            <ThemedText type="smallBold" className="text-[13px] mt-1">
              Instant
            </ThemedText>
            <ThemedText className="text-[13px] font-extrabold mt-[2px]" themeColor="primary">
              {formatCurrency(25000)}
            </ThemedText>
            <ThemedText className="text-[10px] mt-[2px]" themeColor="textSecondary">
              SLA 3 Jam
            </ThemedText>
          </Pressable>
        </View>

        {/* Voucher & Promo Code Section */}
        <ThemedText type="smallBold" className="text-sm uppercase font-bold tracking-wider mb-2 mt-3">
          Voucher & Promo Diskon
        </ThemedText>
        <Card className="p-3">
          {appliedCode ? (
            <View className="flex-row justify-between items-center py-1">
              <View className="flex-row items-center">
                <Ticket size={20} color={theme.success} />
                <View className="ml-2">
                  <ThemedText type="smallBold" className="uppercase">
                    {appliedCode}
                  </ThemedText>
                  {preview && preview.discount.amount > 0 && (
                    <ThemedText className="text-xs" themeColor="success">
                      Hemat {formatCurrency(preview.discount.amount)} ({preview.discount.source})
                    </ThemedText>
                  )}
                </View>
              </View>
              <Pressable onPress={handleRemoveDiscount} className="p-2">
                <ThemedText className="font-bold text-[13px]" themeColor="danger">
                  Hapus
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            <View className="flex-row items-center gap-2">
              <Input
                placeholder="Masukkan kode voucher / promo"
                value={discountCode}
                onChangeText={setDiscountCode}
                leftIcon={<Ticket size={18} color={theme.textSecondary} />}
                containerStyle={{ flex: 1, marginBottom: 0 }}
                autoCapitalize="characters"
              />
              <Button
                label="Gunakan"
                onPress={handleApplyDiscount}
                disabled={!discountCode.trim()}
              />
            </View>
          )}
        </Card>

        {/* Wallet Balance Display Card */}
        <ThemedText type="smallBold" className="text-sm uppercase font-bold tracking-wider mb-2 mt-3">
          Metode Pembayaran
        </ThemedText>
        <Card className={`p-4 ${isWalletInsufficient ? 'border border-danger' : ''}`}>
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Wallet size={22} color={isWalletInsufficient ? theme.danger : theme.primary} />
              <ThemedText type="smallBold" className="ml-2">
                Saldo Dompet SEAPEDIA
              </ThemedText>
            </View>
            <ThemedText className="text-base font-extrabold">
              {formatCurrency(walletBalance)}
            </ThemedText>
          </View>
          {isWalletInsufficient && (
            <View className="flex-row mt-3 p-2 rounded-lg gap-2" style={{ backgroundColor: `${theme.danger}15` }}>
              <AlertTriangle size={18} color={theme.danger} />
              <ThemedText className="text-[11px] font-semibold flex-1">
                Saldo Anda kurang {formatCurrency(preview!.total - walletBalance)}. Silakan top-up.
              </ThemedText>
              <Pressable onPress={() => router.push('/(buyer)/wallet-history')} className="p-1">
                <ThemedText className="font-bold text-[13px]" themeColor="primary">
                  Top Up
                </ThemedText>
              </Pressable>
            </View>
          )}
        </Card>

        {/* Billing / Cost Details Box */}
        <ThemedText type="smallBold" className="text-sm uppercase font-bold tracking-wider mb-2 mt-3">
          Rincian Pembayaran
        </ThemedText>
        <Card className="p-4">
          {calculating ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color={theme.primary} />
              <ThemedText className="ml-2" themeColor="textSecondary">
                Mengalkulasi ulang rincian...
              </ThemedText>
            </View>
          ) : preview ? (
            <View className="gap-2">
              <View className="flex-row justify-between items-center">
                <ThemedText themeColor="textSecondary">Subtotal Barang</ThemedText>
                <ThemedText className="text-[14px] font-semibold">{formatCurrency(preview.subtotal)}</ThemedText>
              </View>

              {preview.discount.amount > 0 && (
                <View className="flex-row justify-between items-center">
                  <ThemedText themeColor="success">
                    Diskon ({preview.discount.code})
                  </ThemedText>
                  <ThemedText className="text-[14px] font-semibold" themeColor="success">
                    -{formatCurrency(preview.discount.amount)}
                  </ThemedText>
                </View>
              )}

              <View className="flex-row justify-between items-center">
                <ThemedText themeColor="textSecondary">Ongkos Kirim</ThemedText>
                <ThemedText className="text-[14px] font-semibold">{formatCurrency(preview.deliveryFee)}</ThemedText>
              </View>

              <View className="flex-row justify-between items-center">
                <ThemedText themeColor="textSecondary">PPN (12%)</ThemedText>
                <ThemedText className="text-[14px] font-semibold">{formatCurrency(preview.ppn)}</ThemedText>
              </View>

              <View className="h-[1px] my-2 bg-white/20" />

              <View className="flex-row justify-between items-center">
                <ThemedText type="smallBold">Total Bayar</ThemedText>
                <ThemedText className="text-lg font-black" themeColor="primary">
                  {formatCurrency(preview.total)}
                </ThemedText>
              </View>
            </View>
          ) : (
            <ThemedText className="text-center" themeColor="textSecondary">
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
          className="mt-5 h-[52px]"
        />
      </ScrollView>

      {/* Address Selection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={addressModalVisible}
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <ThemedView type="backgroundElement" className="rounded-t-[24px] max-h-[70%] pb-5">
            <View className="flex-row justify-between items-center p-4 border-b border-black/5 dark:border-white/5">
              <ThemedText type="smallBold" className="text-[18px]">
                Pilih Alamat Pengiriman
              </ThemedText>
              <Pressable onPress={() => setAddressModalVisible(false)} className="p-1">
                <X size={20} color={theme.text} />
              </Pressable>
            </View>

            <FlatList
              data={addresses}
              keyExtractor={(item) => item.id}
              contentContainerClassName="p-4 gap-2"
              renderItem={({ item }) => {
                const isSelected = selectedAddress?.id === item.id;
                return (
                  <Pressable
                    onPress={() => {
                      setSelectedAddress(item);
                      setAddressModalVisible(false);
                    }}
                  >
                    <Card className={`p-3 border ${isSelected ? 'border-primary border-[1.5px]' : 'border-white/20'}`}>
                      <View className="flex-row justify-between items-center">
                        <ThemedText type="smallBold">{item.label}</ThemedText>
                        {item.isDefault && <Badge label="Default" variant="primary" />}
                      </View>
                      <ThemedText className="text-[13px] font-bold mt-1">
                        {item.recipientName} ({item.phoneNumber})
                      </ThemedText>
                      <ThemedText className="text-[12px] mt-[2px]" themeColor="textSecondary">
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
