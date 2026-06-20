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
  Switch,
} from 'react-native';
import { MapPin, Plus, Edit2, Trash2, X, Check, ChevronDown } from 'lucide-react-native';
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

export default function AddressManagementScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal & Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [label, setLabel] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isLabelDropdownOpen, setIsLabelDropdownOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/buyer/addresses');
      if (response.data?.success) {
        setAddresses(response.data.data);
      }
    } catch (err: any) {
      Alert.alert('Gagal', err.response?.data?.message || 'Gagal memuat daftar alamat.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAddresses();
  };

  const openAddModal = () => {
    setEditingAddress(null);
    setLabel('');
    setRecipientName('');
    setPhoneNumber('');
    setFullAddress('');
    setCity('');
    setPostalCode('');
    setIsDefault(addresses.length === 0);
    setIsLabelDropdownOpen(false);
    setErrors({});
    setModalVisible(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingAddress(addr);
    setLabel(addr.label);
    setRecipientName(addr.recipientName);
    setPhoneNumber(addr.phoneNumber);
    setFullAddress(addr.fullAddress);
    setCity(addr.city);
    setPostalCode(addr.postalCode);
    setIsDefault(addr.isDefault);
    setIsLabelDropdownOpen(false);
    setErrors({});
    setModalVisible(true);
  };

  const validateForm = (lbl: string, rec: string, phone: string, addr: string, cty: string, post: string) => {
    const tempErrors: Record<string, string> = {};
    if (!lbl) tempErrors.label = 'Label alamat wajib diisi (misal: Rumah)';
    if (!rec) tempErrors.recipientName = 'Nama penerima wajib diisi';

    if (!phone) {
      tempErrors.phoneNumber = 'No telepon wajib diisi';
    } else if (phone.length < 9 || phone.length > 15) {
      tempErrors.phoneNumber = 'No telepon harus antara 9 - 15 digit';
    }

    if (!addr) tempErrors.fullAddress = 'Alamat lengkap wajib diisi';
    if (!cty) tempErrors.city = 'Kota wajib diisi';
    if (!post) tempErrors.postalCode = 'Kode pos wajib diisi';

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSaveAddress = async () => {
    // Sanitasi input sisi klien
    const cleanLabel = label.trim().slice(0, 30);
    const cleanRecipientName = recipientName.trim().slice(0, 50);
    const cleanPhoneNumber = phoneNumber.trim().replace(/\D/g, '').slice(0, 15);
    const cleanFullAddress = fullAddress.trim().slice(0, 250);
    const cleanCity = city.trim().slice(0, 50);
    const cleanPostalCode = postalCode.trim().replace(/\D/g, '').slice(0, 6);

    // Sinkronisasi state agar sinkron di input form UI
    setLabel(cleanLabel);
    setRecipientName(cleanRecipientName);
    setPhoneNumber(cleanPhoneNumber);
    setFullAddress(cleanFullAddress);
    setCity(cleanCity);
    setPostalCode(cleanPostalCode);

    if (!validateForm(cleanLabel, cleanRecipientName, cleanPhoneNumber, cleanFullAddress, cleanCity, cleanPostalCode)) return;

    setSubmitting(true);
    try {
      const payload = {
        label: cleanLabel,
        recipientName: cleanRecipientName,
        phoneNumber: cleanPhoneNumber,
        fullAddress: cleanFullAddress,
        city: cleanCity,
        postalCode: cleanPostalCode,
        isDefault,
      };

      let response;
      if (editingAddress) {
        // Edit Address
        response = await api.put(`/buyer/addresses/${editingAddress.id}`, payload);
      } else {
        // Add Address
        response = await api.post('/buyer/addresses', payload);
      }

      if (response.data?.success) {
        Alert.alert(
          'Sukses',
          editingAddress ? 'Alamat berhasil diupdate' : 'Alamat baru berhasil ditambahkan'
        );
        setModalVisible(false);
        fetchAddresses();
      }
    } catch (err: any) {
      if (err.response?.data?.errors) {
        // Map backend validation errors
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
        Alert.alert('Gagal', err.response?.data?.message || 'Gagal menyimpan alamat.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAddress = (id: string, isAddrDefault: boolean) => {
    if (isAddrDefault && addresses.length > 1) {
      Alert.alert(
        'Gagal Hapus',
        'Alamat default tidak bisa dihapus secara langsung. Silakan jadikan alamat lain sebagai default terlebih dahulu.'
      );
      return;
    }

    Alert.alert('Hapus Alamat', 'Apakah Anda yakin ingin menghapus alamat ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await api.delete(`/buyer/addresses/${id}`);
            if (response.data?.success) {
              Alert.alert('Sukses', 'Alamat berhasil dihapus.');
              fetchAddresses();
            }
          } catch (err: any) {
            Alert.alert('Gagal', err.response?.data?.message || 'Gagal menghapus alamat.');
          }
        },
      },
    ]);
  };

  const renderAddressCard = ({ item }: { item: Address }) => {
    return (
      <Card className={`mb-3 p-4 border-[1.5px] ${item.isDefault ? 'border-primary' : 'border-transparent'}`}>
        <View className="flex-row justify-between items-center border-b border-black/5 dark:border-white/5 pb-2 mb-2">
          <View className="flex-row items-center flex-1">
            <MapPin size={18} color={item.isDefault ? theme.primary : theme.textSecondary} />
            <ThemedText type="smallBold" className="text-[15px] font-extrabold ml-2">
              {item.label}
            </ThemedText>
            {item.isDefault && <Badge label="Default" variant="primary" className="ml-2" />}
          </View>
          <View className="flex-row gap-3">
            <Pressable onPress={() => openEditModal(item)} className="p-1">
              <Edit2 size={16} color={theme.text} />
            </Pressable>
            <Pressable
              onPress={() => handleDeleteAddress(item.id, item.isDefault)}
              className="p-1"
            >
              <Trash2 size={16} color={theme.danger} />
            </Pressable>
          </View>
        </View>

        <View className="gap-1">
          <ThemedText type="smallBold" className="text-sm font-bold">
            {item.recipientName}
          </ThemedText>
          <ThemedText className="text-[13px]" themeColor="textSecondary">
            {item.phoneNumber}
          </ThemedText>
          <ThemedText className="text-sm leading-5 mt-1">
            {item.fullAddress}, {item.city}, {item.postalCode}
          </ThemedText>
        </View>
      </Card>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View className="items-center justify-center py-6 px-5">
        <MapPin size={48} color={theme.placeholder} />
        <ThemedText className="text-center mt-3" themeColor="textSecondary">
          Belum ada alamat pengiriman. Silakan tambah alamat untuk memudahkan checkout.
        </ThemedText>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText className="mt-3" themeColor="textSecondary">
          Mengambil daftar alamat Anda...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <FlatList
        data={addresses}
        renderItem={renderAddressCard}
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
          label="Tambah Alamat Baru"
          leftIcon={<Plus size={20} color="#FFFFFF" />}
          onPress={openAddModal}
          className="rounded-full h-[52px] shadow-sm elevation-5"
        />
      </View>

      {/* Address Form Modal */}
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
            <ThemedView type="backgroundElement" className="rounded-t-[24px]">
              <View className="flex-row justify-between items-center p-4 border-b border-black/5 dark:border-white/5">
                <ThemedText type="smallBold" className="text-[18px]">
                  {editingAddress ? 'Ubah Alamat' : 'Tambah Alamat Baru'}
                </ThemedText>
                <Pressable onPress={() => setModalVisible(false)} className="p-1">
                  <X size={20} color={theme.text} />
                </Pressable>
              </View>

              <ScrollView contentContainerClassName="p-4 pb-6">
                <View className="mb-4">
                  <ThemedText className="text-[13px] font-semibold mb-[6px]">Label Alamat</ThemedText>
                  <Pressable
                    onPress={() => setIsLabelDropdownOpen(!isLabelDropdownOpen)}
                    className="flex-row items-center justify-between px-4 rounded-xl border border-black/10 dark:border-white/10"
                    style={{ backgroundColor: `${theme.text}05`, height: 48 }}
                  >
                    <ThemedText style={{ color: label ? theme.text : theme.textSecondary }}>
                      {label || 'Pilih Label Alamat'}
                    </ThemedText>
                    <ChevronDown size={20} color={theme.textSecondary} />
                  </Pressable>
                  {errors.label && (
                    <ThemedText className="text-[12px] mt-1" themeColor="danger">
                      {errors.label}
                    </ThemedText>
                  )}
                  {isLabelDropdownOpen && (
                    <View className="mt-2 rounded-xl border border-black/10 dark:border-white/10 overflow-hidden" style={{ backgroundColor: theme.backgroundElement }}>
                      {['Rumah', 'Kantor', 'Kosan', 'Apartemen', 'Toko'].map((item) => (
                        <Pressable
                          key={item}
                          onPress={() => {
                            setLabel(item);
                            setIsLabelDropdownOpen(false);
                            if (errors.label) setErrors((prev) => ({ ...prev, label: '' }));
                          }}
                          className="px-4 py-3 border-b border-black/5 dark:border-white/5 flex-row justify-between items-center"
                        >
                          <ThemedText>{item}</ThemedText>
                          {label === item && <Check size={16} color={theme.primary} />}
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                <Input
                  label="Nama Penerima"
                  placeholder="Masukkan nama penerima"
                  value={recipientName}
                  onChangeText={setRecipientName}
                  error={errors.recipientName}
                />

                <Input
                  label="Nomor Telepon"
                  placeholder="Contoh: 08123456789"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  error={errors.phoneNumber}
                />

                <Input
                  label="Alamat Lengkap"
                  placeholder="Jalan, Blok, Nomor Rumah, RT/RW, Kecamatan"
                  value={fullAddress}
                  onChangeText={setFullAddress}
                  error={errors.fullAddress}
                  multiline
                  numberOfLines={3}
                />

                <View className="flex-row justify-between">
                  <Input
                    label="Kota/Kabupaten"
                    placeholder="Contoh: Jakarta"
                    value={city}
                    onChangeText={setCity}
                    error={errors.city}
                    containerStyle={{ flex: 1, marginRight: 8 }}
                  />
                  <Input
                    label="Kode Pos"
                    placeholder="Contoh: 12345"
                    value={postalCode}
                    onChangeText={setPostalCode}
                    keyboardType="number-pad"
                    error={errors.postalCode}
                    containerStyle={{ flex: 1 }}
                  />
                </View>

                {/* Switch for Is Default (Lock to true if only address) */}
                {addresses.length > 0 && (!editingAddress || !editingAddress.isDefault) && (
                  <View className="flex-row items-center my-2 py-2 border-t border-b border-black/5 dark:border-white/5">
                    <View className="flex-1">
                      <ThemedText type="smallBold">Jadikan Alamat Utama</ThemedText>
                      <ThemedText className="text-[12px] mt-[2px]" themeColor="textSecondary">
                        Gunakan alamat ini sebagai tujuan utama saat checkout.
                      </ThemedText>
                    </View>
                    <Switch
                      value={isDefault}
                      onValueChange={setIsDefault}
                      trackColor={{ false: theme.border, true: theme.primaryMuted }}
                      thumbColor={isDefault ? theme.primary : '#f4f3f4'}
                    />
                  </View>
                )}

                <Button
                  label={editingAddress ? 'Update Alamat' : 'Simpan Alamat'}
                  onPress={handleSaveAddress}
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
