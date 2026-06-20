import React, { useRef } from 'react';
import {
  View,
  Modal,
  Pressable,
  Alert,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
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
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onPress: () => void;
  danger?: boolean;
}

export function ProfileDropdown({ visible, onClose, role: roleProp }: ProfileDropdownProps) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { roles, clearAuth, activeRole } = useAuthStore();

  const role = roleProp ?? activeRole ?? 'BUYER';

  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

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
      icon: <LayoutDashboard size={20} color={theme.primary} />,
      label: 'Dasbor',
      sublabel: 'Ringkasan akun & dompet',
      onPress: () => navigate('/(buyer)/(tabs)/dashboard'),
    },
    {
      icon: <ShoppingBag size={20} color={theme.primary} />,
      label: 'Pesanan',
      sublabel: 'Lacak pesanan Anda',
      onPress: () => navigate('/(buyer)/(tabs)/orders'),
    },
    {
      icon: <MapPin size={20} color={theme.primary} />,
      label: 'Alamat',
      sublabel: 'Kelola alamat pengiriman',
      onPress: () => navigate('/(buyer)/(tabs)/addresses'),
    },
    {
      icon: <BarChart3 size={20} color={theme.primary} />,
      label: 'Laporan',
      sublabel: 'Riwayat pembelian',
      onPress: () => navigate('/(buyer)/(tabs)/reports'),
    },
  ];

  const sellerMenuItems: MenuItem[] = [
    {
      icon: <Store size={20} color={theme.primary} />,
      label: 'Dasbor Toko',
      sublabel: 'Ringkasan toko Anda',
      onPress: () => navigate('/(seller)/(tabs)/dashboard'),
    },
    {
      icon: <ShoppingBag size={20} color={theme.primary} />,
      label: 'Produk',
      sublabel: 'Kelola daftar produk',
      onPress: () => navigate('/(seller)/(tabs)/products'),
    },
    {
      icon: <ClipboardList size={20} color={theme.primary} />,
      label: 'Order Masuk',
      sublabel: 'Pesanan dari pembeli',
      onPress: () => navigate('/(seller)/(tabs)/orders'),
    },
    {
      icon: <BarChart3 size={20} color={theme.primary} />,
      label: 'Laporan',
      sublabel: 'Laporan penjualan',
      onPress: () => navigate('/(seller)/(tabs)/reports'),
    },
  ];

  const driverMenuItems: MenuItem[] = [
    {
      icon: <Truck size={20} color={theme.primary} />,
      label: 'Dasbor Kurir',
      sublabel: 'Status & tugas aktif',
      onPress: () => navigate('/(driver)/(tabs)/dashboard'),
    },
    {
      icon: <ClipboardList size={20} color={theme.primary} />,
      label: 'Cari Lowongan',
      sublabel: 'Ambil pekerjaan tersedia',
      onPress: () => navigate('/(driver)/(tabs)/jobs'),
    },
    {
      icon: <Wallet size={20} color={theme.primary} />,
      label: 'Pendapatan',
      sublabel: 'Riwayat penghasilan',
      onPress: () => navigate('/(driver)/(tabs)/earnings'),
    },
  ];

  const adminMenuItems: MenuItem[] = [
    {
      icon: <BarChart3 size={20} color={theme.primary} />,
      label: 'Dasbor Admin',
      sublabel: 'Pantau ringkasan platform',
      onPress: () => navigate('/(admin)/(tabs)/dashboard'),
    },
    {
      icon: <Percent size={20} color={theme.primary} />,
      label: 'Voucher',
      sublabel: 'Kelola kode diskon',
      onPress: () => navigate('/(admin)/(tabs)/discount'),
    },
    {
      icon: <Settings size={20} color={theme.primary} />,
      label: 'Sistem & Simulasi',
      sublabel: 'Pengaturan & simulasi waktu',
      onPress: () => navigate('/(admin)/(tabs)/system'),
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
          icon: <RefreshCcw size={20} color={theme.textSecondary} />,
          label: 'Pindah Peran',
          sublabel: 'Ganti mode akun',
          onPress: () => navigate('/(public)/select-role'),
        },
      ]
      : []),
    {
      icon: <LogOut size={20} color="#EF4444" />,
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
        <View className="flex-1 bg-black/35">
          <TouchableWithoutFeedback>
            <Animated.View
              className="absolute rounded-t-[18px] border-t border-l border-r overflow-hidden py-2"
              style={{
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                bottom: 60 + insets.bottom,
                left: 0,
                right: 0,
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
                elevation: 16,
              }}
            >
              {menuItems.map((item, index) => (
                <React.Fragment key={index}>
                  <Pressable
                    onPress={item.onPress}
                    className={`flex-row items-center px-5 py-[11px] active:opacity-70 ${index !== menuItems.length - 1 ? 'my-2' : ''
                      }`}
                  >
                    {/* Icon Wrap */}
                    <View
                      className="w-9 h-9 rounded-[10px] items-center justify-center"
                      style={{
                        backgroundColor: item.danger
                          ? '#EF444415'
                          : `${theme.primary}12`,
                      }}
                    >
                      {item.icon}
                    </View>

                    {/* Text */}
                    <View className="ml-3 flex-1">
                      <ThemedText
                        className="text-[14px] font-bold"
                        style={{ color: item.danger ? '#EF4444' : theme.text }}
                      >
                        {item.label}
                      </ThemedText>
                      {item.sublabel && (
                        <ThemedText
                          className="text-[11px] mt-[1px]"
                          themeColor="textSecondary"
                        >
                          {item.sublabel}
                        </ThemedText>
                      )}
                    </View>
                  </Pressable>
                </React.Fragment>
              ))}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
