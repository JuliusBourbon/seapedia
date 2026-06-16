import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Store, Anchor, LogOut } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';

export default function StoreSetupScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { clearAuth } = useAuthStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!name.trim()) tempErrors.name = 'Nama toko wajib diisi';
    else if (name.length < 3) tempErrors.name = 'Nama toko minimal 3 karakter';
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleCreateStore = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await api.post('/seller/store', { name, description });
      
      if (response.data?.success) {
        Alert.alert(
          'Toko Dibuka',
          `Selamat! Toko "${name}" Anda berhasil dibuka di SEAPEDIA.`,
          [
            {
              text: 'Buka Dasbor',
              onPress: () => {
                router.replace('/(seller)/(tabs)/dashboard' as any);
              },
            },
          ]
        );
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        setErrors({ name: 'Nama toko sudah digunakan atau Anda sudah memiliki toko.' });
      } else {
        Alert.alert(
          'Gagal Membuka Toko',
          err.response?.data?.message || 'Terjadi kesalahan sistem. Silakan coba lagi.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert('Batal', 'Keluar dan kembali ke halaman login?', [
      { text: 'Tidak', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: () => {
          clearAuth();
          router.replace('/(public)/(tabs)/login');
        },
      },
    ]);
  };

  return (
    <ThemedView className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerClassName="flex-grow justify-center px-5 py-5">
          <View className="items-center mb-5">
            <View className="w-20 h-20 rounded-[40px] items-center justify-center mb-3" style={{ backgroundColor: `${theme.primary}15` }}>
              <Anchor size={40} color={theme.primary} />
            </View>
            <ThemedText type="subtitle" className="text-[26px] font-extrabold text-center">
              Buka Toko Seapedia
            </ThemedText>
            <ThemedText className="text-sm text-center mt-1 px-4" themeColor="textSecondary">
              Mulai jual hasil tangkapan laut segar Anda langsung ke pembeli maritim.
            </ThemedText>
          </View>

          <View className="w-full">
            <Input
              label="Nama Toko"
              placeholder="Contoh: Toko Nelayan Bahari"
              value={name}
              onChangeText={setName}
              leftIcon={<Store size={20} color={theme.textSecondary} />}
              error={errors.name}
            />

            <Input
              label="Deskripsi Toko (Opsional)"
              placeholder="Jelaskan jenis hasil laut yang Anda pasarkan..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              inputStyle={{ height: 100, textAlignVertical: 'top', paddingTop: 8 }}
            />

            <Button
              label="Buka Toko Sekarang"
              onPress={handleCreateStore}
              loading={loading}
              className="mt-3 h-[52px]"
            />

            <Button
              label="Batal & Keluar"
              variant="outline"
              leftIcon={<LogOut size={16} color={theme.primary} />}
              onPress={handleCancel}
              className="mt-2 h-[52px]"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}
