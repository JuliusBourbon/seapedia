import React, { useRef } from 'react';
import {
  View,
  Modal,
  Pressable,
  Alert,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import {
  LayoutDashboard,
  ShoppingBag,
  MapPin,
  BarChart3,
  LogOut,
  RefreshCcw,
  Store,
  ClipboardList,
  Truck,
  Wallet,
  Percent,
  Settings,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ProfileDropdownProps {
  visible: boolean;
  onClose: () => void;
  role?: 'BUYER' | 'SELLER' | 'DRIVER' | 'ADMIN' | string;
}

interface MenuItem {
  icon: (color: string) => React.ReactNode;
  label: string;
  sublabel?: string;
  onPress: () => void;
  danger?: boolean;
  path?: string;
}

export function ProfileDropdown({ visible, onClose, role: roleProp }: ProfileDropdownProps) {
  const theme = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { roles, clearAuth, activeRole } = useAuthStore();

  const role = roleProp ?? activeRole ?? 'BUYER';

  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // The current raw path matches the layout route (e.g. /(buyer)/(tabs)/dashboard)
  const currentRawPath = '/' + segments.join('/');

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 300,
          friction: 20,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.95);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const navigate = (path: string) => {
    onClose();
    setTimeout(() => router.push(path as any), 150);
  };

  const handleLogout = () => {
    onClose();
    setTimeout(() => {
      Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar dari akun?', [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/auth/logout');
            } catch (_) { }
            clearAuth();
          },
        },
      ]);
    }, 300);
  };

  const buyerMenuItems: MenuItem[] = [
    {
      icon: (color: string) => <LayoutDashboard size={20} color={color} />,
      label: 'Dasbor',
      sublabel: 'Ringkasan akun & dompet',
      onPress: () => navigate('/(buyer)/(tabs)/dashboard'),
      path: '/(buyer)/(tabs)/dashboard',
    },
    {
      icon: (color: string) => <ShoppingBag size={20} color={color} />,
      label: 'Pesanan',
      sublabel: 'Lacak pesanan Anda',
      onPress: () => navigate('/(buyer)/(tabs)/orders'),
      path: '/(buyer)/(tabs)/orders',
    },
    {
      icon: (color: string) => <MapPin size={20} color={color} />,
      label: 'Alamat',
      sublabel: 'Kelola alamat pengiriman',
      onPress: () => navigate('/(buyer)/(tabs)/addresses'),
      path: '/(buyer)/(tabs)/addresses',
    },
    {
      icon: (color: string) => <BarChart3 size={20} color={color} />,
      label: 'Laporan',
      sublabel: 'Riwayat pembelian',
      onPress: () => navigate('/(buyer)/(tabs)/reports'),
      path: '/(buyer)/(tabs)/reports',
    },
  ];

  const sellerMenuItems: MenuItem[] = [
    {
      icon: (color: string) => <Store size={20} color={color} />,
      label: 'Dasbor Toko',
      sublabel: 'Ringkasan toko Anda',
      onPress: () => navigate('/(seller)/(tabs)/dashboard'),
      path: '/(seller)/(tabs)/dashboard',
    },
    {
      icon: (color: string) => <ShoppingBag size={20} color={color} />,
      label: 'Produk',
      sublabel: 'Kelola daftar produk',
      onPress: () => navigate('/(seller)/(tabs)/products'),
      path: '/(seller)/(tabs)/products',
    },
    {
      icon: (color: string) => <ClipboardList size={20} color={color} />,
      label: 'Order Masuk',
      sublabel: 'Pesanan dari pembeli',
      onPress: () => navigate('/(seller)/(tabs)/orders'),
      path: '/(seller)/(tabs)/orders',
    },
    {
      icon: (color: string) => <BarChart3 size={20} color={color} />,
      label: 'Laporan',
      sublabel: 'Laporan penjualan',
      onPress: () => navigate('/(seller)/(tabs)/reports'),
      path: '/(seller)/(tabs)/reports',
    },
  ];

  const driverMenuItems: MenuItem[] = [
    {
      icon: (color: string) => <Truck size={20} color={color} />,
      label: 'Dasbor Kurir',
      sublabel: 'Status & tugas aktif',
      onPress: () => navigate('/(driver)/(tabs)/dashboard'),
      path: '/(driver)/(tabs)/dashboard',
    },
    {
      icon: (color: string) => <ClipboardList size={20} color={color} />,
      label: 'Cari Lowongan',
      sublabel: 'Ambil pekerjaan tersedia',
      onPress: () => navigate('/(driver)/(tabs)/jobs'),
      path: '/(driver)/(tabs)/jobs',
    },
    {
      icon: (color: string) => <Wallet size={20} color={color} />,
      label: 'Pendapatan',
      sublabel: 'Riwayat penghasilan',
      onPress: () => navigate('/(driver)/(tabs)/earnings'),
      path: '/(driver)/(tabs)/earnings',
    },
  ];

  const adminMenuItems: MenuItem[] = [
    {
      icon: (color: string) => <BarChart3 size={20} color={color} />,
      label: 'Dasbor Admin',
      sublabel: 'Pantau ringkasan platform',
      onPress: () => navigate('/(admin)/(tabs)/dashboard'),
      path: '/(admin)/(tabs)/dashboard',
    },
    {
      icon: (color: string) => <Percent size={20} color={color} />,
      label: 'Voucher',
      sublabel: 'Kelola kode diskon',
      onPress: () => navigate('/(admin)/(tabs)/discount'),
      path: '/(admin)/(tabs)/discount',
    },
    {
      icon: (color: string) => <Settings size={20} color={color} />,
      label: 'Sistem & Simulasi',
      sublabel: 'Pengaturan & simulasi waktu',
      onPress: () => navigate('/(admin)/(tabs)/system'),
      path: '/(admin)/(tabs)/system',
    },
  ];

  const roleMenuItems =
    role === 'SELLER' ? sellerMenuItems :
      role === 'DRIVER' ? driverMenuItems :
        role === 'ADMIN' ? adminMenuItems :
          buyerMenuItems;

  const menuItems: MenuItem[] = [
    ...roleMenuItems,
    ...(roles.length > 1
      ? [
        {
          icon: (color: string) => <RefreshCcw size={20} color={color} />,
          label: 'Pindah Peran',
          sublabel: 'Ganti mode akun',
          onPress: () => navigate('/(public)/select-role'),
          path: '/(public)/select-role',
        },
      ]
      : []),
    {
      icon: (color: string) => <LogOut size={20} color={color} />,
      label: 'Keluar',
      sublabel: 'Keluar dari akun ini',
      onPress: handleLogout,
      danger: true,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/40">
          <TouchableWithoutFeedback>
            <Animated.View
              className="absolute rounded-t-[24px] border-t border-l border-r overflow-hidden py-4 shadow-xl"
              style={{
                backgroundColor: theme.neutral[50],
                borderColor: theme.neutral[200],
                bottom: 60 + insets.bottom,
                left: 0,
                right: 0,
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
                elevation: 20,
              }}
            >
              {menuItems.map((item, index) => {
                const isSelected = item.path === currentRawPath;

                let iconColor: string = theme.neutral[500];
                let bgColor: string = theme.neutral[100];

                if (item.danger) {
                  iconColor = theme.danger;
                  bgColor = `${theme.danger}15`;
                } else if (isSelected) {
                  iconColor = theme.neutral[50];
                  bgColor = theme.primary;
                }

                return (
                  <React.Fragment key={index}>
                    <Pressable
                      onPress={item.onPress}
                      className={`flex-row items-center px-6 py-3 active:opacity-60 ${index !== menuItems.length - 1 ? 'mb-1' : ''
                        }`}
                      style={{
                        backgroundColor: isSelected ? `${theme.primary}05` : 'transparent'
                      }}
                    >
                      {/* Icon Wrap */}
                      <View
                        className="w-11 h-11 rounded-full items-center justify-center mr-4"
                        style={{ backgroundColor: bgColor }}
                      >
                        {item.icon(iconColor)}
                      </View>

                      {/* Text */}
                      <View className="flex-1">
                        <ThemedText
                          className="text-[15px] font-bold"
                          style={{ color: item.danger ? theme.danger : isSelected ? theme.primary : theme.neutral[900] }}
                        >
                          {item.label}
                        </ThemedText>
                        {item.sublabel && (
                          <ThemedText
                            className="text-xs mt-[2px]"
                            style={{ color: isSelected ? theme.primary : theme.neutral[500] }}
                          >
                            {item.sublabel}
                          </ThemedText>
                        )}
                      </View>
                    </Pressable>
                  </React.Fragment>
                );
              })}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
