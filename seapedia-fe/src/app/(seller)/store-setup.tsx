import React, { useState } from 'react';
import {
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView, Image,
  Pressable
} from 'react-native';
import { useRouter } from 'expo-router';
import { Store, Anchor, LogOut } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';
import logo from '@/assets/images/icon.png';

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
            <Image
              source={logo}
              className="w-40 h-40"
              resizeMode="contain"
            />
            <ThemedText type="subtitle" className="text-center">
              Buka Toko Seapedia
            </ThemedText>
            <ThemedText className="text-center mt-1 px-4 text-neutral-800">
              Mulai jual produkmu di Seapedia
            </ThemedText>
          </View>

          <View className="w-full">
            <Input
              label="Nama Toko"
              placeholder="Contoh: Toko Jaya Abadi"
              value={name}
              onChangeText={setName}
              leftIcon={<Store size={20} color={theme.neutral[500]} />}
              error={errors.name}
            />

            <Input
              label="Deskripsi Toko (Opsional)"
              placeholder="Jelaskan produk yang toko anda tawarkan"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            <Button
              label="Buka Toko Sekarang"
              onPress={handleCreateStore}
              loading={loading}
              className="mt-3 h-[52px]"
            />

            <Pressable onPress={handleCancel} className="mt-3 h-[52px] border border-danger rounded-lg flex-row items-center justify-center gap-3">
              <LogOut size={16} color={theme.danger} />
              <ThemedText className="text-danger font-semibold">Batal & Keluar</ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}
