import React, { useState } from 'react';
import {
  View,
  Alert,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, User as UserIcon, Mail, Smile, CheckSquare, Square } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import api from '@/services/api';

type SignupRole = 'BUYER' | 'SELLER' | 'DRIVER';

export default function RegisterScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<SignupRole[]>(['BUYER']);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleRole = (role: SignupRole) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length === 1) {
        Alert.alert('Perhatian', 'Pilih minimal satu peran (role).');
        return;
      }
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const validate = (u: string, n: string, e: string, p: string) => {
    const tempErrors: Record<string, string> = {};
    if (!u) tempErrors.username = 'Username wajib diisi';
    else if (u.length < 3) tempErrors.username = 'Username minimal 3 karakter';

    if (!e) tempErrors.email = 'Email wajib diisi';
    else if (!/\S+@\S+\.\S+/.test(e)) tempErrors.email = 'Format email tidak valid';

    if (!p) tempErrors.password = 'Password wajib diisi';
    else if (p.length < 6) tempErrors.password = 'Password minimal 6 karakter';

    if (!n) tempErrors.name = 'Nama lengkap wajib diisi';

    if (selectedRoles.length === 0) {
      tempErrors.roles = 'Pilih minimal satu peran';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleRegister = async () => {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
    const cleanName = name.trim().slice(0, 50);
    const cleanEmail = email.trim().slice(0, 100);
    const cleanPassword = password.trim().slice(0, 50);

    setUsername(cleanUsername);
    setName(cleanName);
    setEmail(cleanEmail);
    setPassword(cleanPassword);

    if (!validate(cleanUsername, cleanName, cleanEmail, cleanPassword)) return;

    setLoading(true);
    try {
      const payload = {
        username: cleanUsername,
        email: cleanEmail,
        password: cleanPassword,
        name: cleanName,
        roles: selectedRoles,
      };

      const response = await api.post('/auth/register', payload);

      if (response.data?.success) {
        Alert.alert(
          'Registrasi Berhasil',
          'Akun Anda berhasil didaftarkan! Silakan masuk.',
          [{ text: 'OK', onPress: () => router.replace('/(public)/(tabs)/login') }]
        );
      }
    } catch (err: any) {
      if (err.response?.data?.errors) {
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
        Alert.alert(
          'Registrasi Gagal',
          err.response?.data?.message || 'Gagal mendaftarkan akun. Silakan coba lagi.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const renderRoleCheckbox = (role: SignupRole, label: string, description: string) => {
    const isSelected = selectedRoles.includes(role);
    return (
      <Pressable
        onPress={() => toggleRole(role)}
        className="flex-row items-center border-[1.5px] rounded-xl p-4 mb-2"
        style={{ borderColor: isSelected ? theme.primary : theme.neutral[300] }}
      >
        {isSelected ? (
          <CheckSquare size={24} color={theme.primary} />
        ) : (
          <Square size={24} color={theme.neutral[400]} />
        )}
        <View className="ml-4 flex-1">
          <ThemedText type="smallBold" className={`text-sm font-bold ${isSelected ? 'text-primary' : ''}`}>
            {label}
          </ThemedText>
          <ThemedText className={`text-xs mt-[2px] ${isSelected ? 'text-primary' : ''}`}>
            {description}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  return (
    <ThemedView className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerClassName="flex-grow px-8 pb-12"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 justify-center mt-12">
            <View className="items-center mb-6">
              <ThemedText type="subtitle" className="text-[26px] font-extrabold text-center text-primary">
                Daftar Akun Baru
              </ThemedText>
              <ThemedText className="text-center mt-1" style={{ color: theme.neutral[600] }}>
                Bergabunglah dengan aplikasi ini
              </ThemedText>
              <Image
                source={require('../../../assets/images/icon.png')}
                className="w-40 h-40"
                resizeMode="contain"
              />
            </View>

            <View className="w-full">
              <Input
                label="Username"
                placeholder="Minimal 3 karakter"
                value={username}
                onChangeText={setUsername}
                leftIcon={<UserIcon size={20} color={theme.neutral[500]} />}
                error={errors.username}
                autoCapitalize="none"
              />

              <Input
                label="Nama Lengkap"
                placeholder="Masukkan nama lengkap Anda"
                value={name}
                onChangeText={setName}
                leftIcon={<Smile size={20} color={theme.neutral[500]} />}
                error={errors.name}
              />

              <Input
                label="Email"
                placeholder="contoh@domain.com"
                value={email}
                onChangeText={setEmail}
                leftIcon={<Mail size={20} color={theme.neutral[500]} />}
                error={errors.email}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Input
                label="Password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChangeText={setPassword}
                leftIcon={<Lock size={20} color={theme.neutral[500]} />}
                error={errors.password}
                secureTextEntry
                autoCapitalize="none"
              />

              <View className="my-2">
                <ThemedText type="smallBold" className="mb-2" style={{ color: theme.neutral[600] }}>
                  Pilih Peran Akun (Dapat memilih lebih dari satu)
                </ThemedText>

                {renderRoleCheckbox(
                  'BUYER',
                  'Pembeli (Buyer)',
                  'Membeli produk dari berbagai toko terpercaya.'
                )}
                {renderRoleCheckbox(
                  'SELLER',
                  'Penjual (Seller)',
                  'Buka toko dan pasarkan produk Anda.'
                )}
                {renderRoleCheckbox(
                  'DRIVER',
                  'Pengirim (Driver)',
                  'Antar pesanan ke pembeli dan peroleh penghasilan.'
                )}
                {errors.roles && (
                  <ThemedText className="text-danger text-xs mt-1 font-semibold">
                    {errors.roles}
                  </ThemedText>
                )}
              </View>

              <Button
                label="Daftar Sekarang"
                onPress={handleRegister}
                loading={loading}
                className="mt-6 h-[52px]"
              />

              <View className="flex-row justify-center items-center mt-6 mb-8">
                <ThemedText style={{ color: theme.neutral[500] }}>
                  Sudah memiliki akun?{' '}
                </ThemedText>
                <Pressable onPress={() => router.replace('/(public)/(tabs)/login')}>
                  <ThemedText className="font-bold text-primary underline">
                    Masuk di sini
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}
