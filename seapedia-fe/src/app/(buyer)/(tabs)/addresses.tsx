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
import { MapPin, Plus, Edit2, Trash2, X, Check } from 'lucide-react-native';
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
    setIsDefault(addresses.length === 0); // Force true if first address
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
      <Card style={[styles.addressCard, item.isDefault && { borderColor: theme.primary, borderWidth: 1.5 }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <MapPin size={18} color={item.isDefault ? theme.primary : theme.textSecondary} />
            <ThemedText type="smallBold" style={styles.addressLabel}>
              {item.label}
            </ThemedText>
            {item.isDefault && <Badge label="Default" variant="primary" style={styles.defaultBadge} />}
          </View>
          <View style={styles.actionIcons}>
            <Pressable onPress={() => openEditModal(item)} style={styles.iconButton}>
              <Edit2 size={16} color={theme.text} />
            </Pressable>
            <Pressable
              onPress={() => handleDeleteAddress(item.id, item.isDefault)}
              style={styles.iconButton}
            >
              <Trash2 size={16} color={theme.danger} />
            </Pressable>
          </View>
        </View>

        <View style={styles.cardBody}>
          <ThemedText type="smallBold" style={styles.recipientName}>
            {item.recipientName}
          </ThemedText>
          <ThemedText style={styles.phoneNumber} themeColor="textSecondary">
            {item.phoneNumber}
          </ThemedText>
          <ThemedText style={styles.fullAddress}>
            {item.fullAddress}, {item.city}, {item.postalCode}
          </ThemedText>
        </View>
      </Card>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <MapPin size={48} color={theme.placeholder} />
        <ThemedText style={{ color: theme.textSecondary, marginTop: Spacing.three, textAlign: 'center' }}>
          Belum ada alamat pengiriman. Silakan tambah alamat untuk memudahkan checkout.
        </ThemedText>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={{ marginTop: Spacing.three, color: theme.textSecondary }}>
          Mengambil daftar alamat Anda...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={addresses}
        renderItem={renderAddressCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 136 + insets.bottom }]}
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

      <View style={[styles.fabContainer, { bottom: 68 + insets.bottom }]}>
        <Button
          label="Tambah Alamat Baru"
          leftIcon={<Plus size={20} color="#FFFFFF" />}
          onPress={openAddModal}
          style={styles.fabButton}
        />
      </View>

      {/* Address Form Modal */}
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
                  {editingAddress ? 'Ubah Alamat' : 'Tambah Alamat Baru'}
                </ThemedText>
                <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
                  <X size={20} color={theme.text} />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.formScroll}>
                <Input
                  label="Label Alamat"
                  placeholder="Contoh: Rumah, Kantor, Kosan"
                  value={label}
                  onChangeText={setLabel}
                  error={errors.label}
                />

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
                  inputStyle={{ height: 80, textAlignVertical: 'top', paddingTop: Spacing.two }}
                />

                <View style={styles.rowInputs}>
                  <Input
                    label="Kota/Kabupaten"
                    placeholder="Contoh: Jakarta"
                    value={city}
                    onChangeText={setCity}
                    error={errors.city}
                    containerStyle={{ flex: 1, marginRight: Spacing.two }}
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
                  <View style={styles.switchRow}>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="smallBold">Jadikan Alamat Default</ThemedText>
                      <ThemedText style={{ fontSize: 12, marginTop: 2 }} themeColor="textSecondary">
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
  addressCard: {
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressLabel: {
    fontSize: 15,
    fontWeight: '800',
    marginLeft: Spacing.two,
  },
  defaultBadge: {
    marginLeft: Spacing.two,
  },
  actionIcons: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  iconButton: {
    padding: Spacing.one,
  },
  cardBody: {
    gap: Spacing.one,
  },
  recipientName: {
    fontSize: 14,
    fontWeight: '700',
  },
  phoneNumber: {
    fontSize: 13,
  },
  fullAddress: {
    fontSize: 14,
    lineHeight: 20,
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.two,
    paddingVertical: Spacing.two,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
});
