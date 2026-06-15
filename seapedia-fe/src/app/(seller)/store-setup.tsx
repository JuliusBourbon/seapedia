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
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerContainer}>
            <View style={[styles.iconContainer, { backgroundColor: `${theme.primary}15` }]}>
              <Anchor size={40} color={theme.primary} />
            </View>
            <ThemedText type="subtitle" style={styles.title}>
              Buka Toko Seapedia
            </ThemedText>
            <ThemedText style={styles.subtitle} themeColor="textSecondary">
              Mulai jual hasil tangkapan laut segar Anda langsung ke pembeli maritim.
            </ThemedText>
          </View>

          <View style={styles.formContainer}>
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
              inputStyle={{ height: 100, textAlignVertical: 'top', paddingTop: Spacing.two }}
            />

            <Button
              label="Buka Toko Sekarang"
              onPress={handleCreateStore}
              loading={loading}
              style={styles.submitButton}
            />

            <Button
              label="Batal & Keluar"
              variant="outline"
              leftIcon={<LogOut size={16} color={theme.primary} />}
              onPress={handleCancel}
              style={styles.cancelButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.five,
    justifyContent: 'center',
    paddingVertical: Spacing.five,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: Spacing.five,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.four,
  },
  formContainer: {
    width: '100%',
  },
  submitButton: {
    marginTop: Spacing.three,
    height: 52,
  },
  cancelButton: {
    marginTop: Spacing.two,
    height: 52,
  },
});
