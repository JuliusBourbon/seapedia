import React, { useState } from 'react';
import {
  View,
  Alert,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, User as UserIcon, LogIn } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';
import logo from '@/assets/images/icon.png';

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { setAuth, setPreAuth, setUser } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!username.trim()) tempErrors.username = 'Username wajib diisi';
    if (!password.trim()) tempErrors.password = 'Password wajib diisi';
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });

      if (response.data?.success) {
        const { requiresRoleSelection, token, preAuthToken, roles, activeRole } = response.data.data;

        if (requiresRoleSelection) {
          setPreAuth(preAuthToken, roles);
          router.replace('/(public)/select-role');
        } else {
          setAuth(token, activeRole, roles);

          try {
            const profileResponse = await api.get('/auth/me');
            if (profileResponse.data?.success) {
              setUser(profileResponse.data.data);
            }
          } catch (profileErr) {
          }
        }
      }
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        Alert.alert(
          'Login Gagal',
          err.response?.data?.message || 'Username atau password salah.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerClassName="flex-grow px-8 justify-center py-12">
          <View className="items-center mb-6">
            <ThemedText type="subtitle" className="text-[26px] font-extrabold text-center text-primary">
              Selamat Datang
            </ThemedText>
            <ThemedText className="text-center mt-1" style={{ color: theme.neutral[600] }}>
              Masuk dan mulai perjalanan Anda!
            </ThemedText>
            <Image
              source={logo}
              className="w-40 h-40"
              resizeMode="contain"
            />
          </View>

          <View className="w-full">
            <Input
              label="Username"
              placeholder="Masukkan username Anda"
              value={username}
              onChangeText={setUsername}
              leftIcon={<UserIcon size={20} color={theme.neutral[500]} />}
              error={errors.username}
              autoCapitalize="none"
            />

            <Input
              label="Password"
              placeholder="Masukkan password Anda"
              value={password}
              onChangeText={setPassword}
              leftIcon={<Lock size={20} color={theme.neutral[500]} />}
              error={errors.password}
              secureTextEntry
              autoCapitalize="none"
            />

            <Button
              label="Masuk Sekarang"
              onPress={handleLogin}
              loading={loading}
              className="mt-6 h-[52px]"
            />

            <View className="flex-row justify-center items-center mt-6 mb-8">
              <ThemedText style={{ color: theme.neutral[500] }}>
                Belum punya akun?{' '}
              </ThemedText>
              <Pressable onPress={() => router.push('/(public)/register')}>
                <ThemedText className="font-bold text-primary underline">
                  Daftar di sini
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}
