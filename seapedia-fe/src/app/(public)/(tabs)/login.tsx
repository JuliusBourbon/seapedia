import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, User as UserIcon, LogIn } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';

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
          // Multi-role user, requires select-role
          setPreAuth(preAuthToken, roles);
          router.replace('/(public)/select-role');
        } else {
          // Single-role or admin user, direct login
          setAuth(token, activeRole, roles);
          
          // Fetch profile details
          try {
            const profileResponse = await api.get('/auth/me');
            if (profileResponse.data?.success) {
              setUser(profileResponse.data.data);
            }
          } catch (profileErr) {
            // Profile fetch failed but authentication is valid
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
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerContainer}>
            <View style={[styles.iconContainer, { backgroundColor: `${theme.primary}15` }]}>
              <LogIn size={40} color={theme.primary} />
            </View>
            <ThemedText type="subtitle" style={styles.title}>
              Selamat Datang
            </ThemedText>
            <ThemedText style={styles.subtitle} themeColor="textSecondary">
              Silakan masuk untuk mulai bertransaksi di SEAPEDIA
            </ThemedText>
          </View>

          <View style={styles.formContainer}>
            <Input
              label="Username"
              placeholder="Masukkan username Anda"
              value={username}
              onChangeText={setUsername}
              leftIcon={<UserIcon size={20} color={theme.textSecondary} />}
              error={errors.username}
              autoCapitalize="none"
            />

            <Input
              label="Password"
              placeholder="Masukkan password Anda"
              value={password}
              onChangeText={setPassword}
              leftIcon={<Lock size={20} color={theme.textSecondary} />}
              error={errors.password}
              secureTextEntry
              autoCapitalize="none"
            />

            <Button
              label="Masuk Sekarang"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />

            <View style={styles.registerLinkContainer}>
              <ThemedText style={{ color: theme.textSecondary }}>
                Belum punya akun?{' '}
              </ThemedText>
              <Pressable onPress={() => router.push('/(public)/register')}>
                <ThemedText style={{ color: theme.primary, fontWeight: '700' }}>
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
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  formContainer: {
    width: '100%',
  },
  loginButton: {
    marginTop: Spacing.three,
    height: 52,
  },
  registerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.four,
  },
});
