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
import { Lock, User as UserIcon, Mail, Smile, CheckSquare, Square } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
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

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!username.trim()) tempErrors.username = 'Username wajib diisi';
    else if (username.length < 3) tempErrors.username = 'Username minimal 3 karakter';
    
    if (!email.trim()) tempErrors.email = 'Email wajib diisi';
    else if (!/\S+@\S+\.\S+/.test(email)) tempErrors.email = 'Format email tidak valid';

    if (!password.trim()) tempErrors.password = 'Password wajib diisi';
    else if (password.length < 6) tempErrors.password = 'Password minimal 6 karakter';

    if (!name.trim()) tempErrors.name = 'Nama lengkap wajib diisi';

    if (selectedRoles.length === 0) {
      tempErrors.roles = 'Pilih minimal satu peran';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        username,
        email,
        password,
        name,
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
        // Map backend errors (e.g. zod validation object)
        const beErrors: Record<string, string> = {};
        const errorsData = err.response.data.errors;
        
        // Zod validation errors
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
        style={[
          styles.checkboxItem,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: isSelected ? theme.primary : theme.border,
          },
        ]}
      >
        {isSelected ? (
          <CheckSquare size={24} color={theme.primary} />
        ) : (
          <Square size={24} color={theme.textSecondary} />
        )}
        <View style={styles.checkboxTextContainer}>
          <ThemedText type="smallBold" style={styles.checkboxLabel}>
            {label}
          </ThemedText>
          <ThemedText style={styles.checkboxDescription} themeColor="textSecondary">
            {description}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerContainer}>
            <ThemedText type="subtitle" style={styles.title}>
              Daftar Akun Baru
            </ThemedText>
            <ThemedText style={styles.subtitle} themeColor="textSecondary">
              Bergabunglah dengan SEAPEDIA dan pilih peran Anda
            </ThemedText>
          </View>

          <View style={styles.formContainer}>
            <Input
              label="Username"
              placeholder="Minimal 3 karakter"
              value={username}
              onChangeText={setUsername}
              leftIcon={<UserIcon size={20} color={theme.textSecondary} />}
              error={errors.username}
              autoCapitalize="none"
            />

            <Input
              label="Nama Lengkap"
              placeholder="Masukkan nama lengkap Anda"
              value={name}
              onChangeText={setName}
              leftIcon={<Smile size={20} color={theme.textSecondary} />}
              error={errors.name}
            />

            <Input
              label="Email"
              placeholder="contoh@domain.com"
              value={email}
              onChangeText={setEmail}
              leftIcon={<Mail size={20} color={theme.textSecondary} />}
              error={errors.email}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Input
              label="Password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChangeText={setPassword}
              leftIcon={<Lock size={20} color={theme.textSecondary} />}
              error={errors.password}
              secureTextEntry
              autoCapitalize="none"
            />

            <View style={styles.roleSelectionSection}>
              <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                Pilih Peran Akun (Dapat memilih lebih dari satu)
              </ThemedText>
              
              {renderRoleCheckbox(
                'BUYER',
                'Pembeli (Buyer)',
                'Membeli hasil laut segar langsung dari nelayan/toko.'
              )}
              {renderRoleCheckbox(
                'SELLER',
                'Penjual (Seller)',
                'Buka toko dan pasarkan hasil tangkapan laut Anda.'
              )}
              {renderRoleCheckbox(
                'DRIVER',
                'Pengirim (Driver)',
                'Antar pesanan ke pembeli dan peroleh penghasilan.'
              )}
              {errors.roles && (
                <ThemedText style={{ color: theme.danger, fontSize: 12, marginTop: Spacing.one, fontWeight: '600' }}>
                  {errors.roles}
                </ThemedText>
              )}
            </View>

            <Button
              label="Daftar Sekarang"
              onPress={handleRegister}
              loading={loading}
              style={styles.registerButton}
            />

            <View style={styles.loginLinkContainer}>
              <ThemedText style={{ color: theme.textSecondary }}>
                Sudah memiliki akun?{' '}
              </ThemedText>
              <Pressable onPress={() => router.replace('/(public)/(tabs)/login')}>
                <ThemedText style={{ color: theme.primary, fontWeight: '700' }}>
                  Masuk di sini
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
    paddingVertical: Spacing.four,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: Spacing.four,
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
  },
  formContainer: {
    width: '100%',
  },
  roleSelectionSection: {
    marginVertical: Spacing.two,
  },
  sectionTitle: {
    marginBottom: Spacing.two,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  checkboxTextContainer: {
    marginLeft: Spacing.three,
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  registerButton: {
    marginTop: Spacing.four,
    height: 52,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.four,
    marginBottom: Spacing.five,
  },
});
