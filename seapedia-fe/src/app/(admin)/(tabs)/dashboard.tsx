import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  FlatList,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Users, Store, Package, ClipboardList, RefreshCcw, LogOut, Info, ShieldCheck, Mail, Calendar, Truck } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLE_LABELS } from '@/constants/config';
import api from '@/services/api';

interface SummaryData {
  totalUsers: number;
  totalStores: number;
  totalProducts: number;
  totalOrders: number;
  totalVouchers: number;
  totalPromos: number;
  totalDeliveries: number;
  currentSimulatedTime: string;
  overdueCount: number;
  returnedOrdersCount: number;
}

interface MonitorUser {
  id: string;
  username: string;
  email: string;
  name: string;
  roles: string[];
  createdAt: string;
}

interface MonitorStore {
  id: string;
  name: string;
  description: string;
  seller: {
    id: string;
    username: string;
    name: string;
  };
  totalProducts: number;
  createdAt: string;
}

type SubTab = 'OVERVIEW' | 'USERS' | 'STORES';

export default function AdminDashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, clearAuth, roles } = useAuthStore();

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [usersList, setUsersList] = useState<MonitorUser[]>([]);
  const [storesList, setStoresList] = useState<MonitorStore[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SubTab>('OVERVIEW');
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchSummary = async () => {
    try {
      setError(null);
      const res = await api.get('/admin/summary');
      if (res.data?.success) {
        setSummary(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat ringkasan admin.');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      if (res.data?.success) {
        setUsersList(res.data.data);
      }
    } catch (err) {
      console.log('Error fetching users:', err);
    }
  };

  const fetchStores = async () => {
    try {
      const res = await api.get('/admin/stores');
      if (res.data?.success) {
        setStoresList(res.data.data);
      }
    } catch (err) {
      console.log('Error fetching stores:', err);
    }
  };

  const initData = async () => {
    setLoading(true);
    await fetchSummary();
    if (activeTab === 'USERS') await fetchUsers();
    if (activeTab === 'STORES') await fetchStores();
    setLoading(false);
  };

  useEffect(() => {
    initData();
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSummary();
    if (activeTab === 'USERS') await fetchUsers();
    if (activeTab === 'STORES') await fetchStores();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar dari akun?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await api.post('/auth/logout');
          } catch (err) {
            // Local clear
          } finally {
            clearAuth();
            setLoggingOut(false);
            router.replace('/(public)/(tabs)/login');
          }
        },
      },
    ]);
  };

  const getRoleBadge = (role: string) => {
    const label = ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role;
    switch (role) {
      case 'ADMIN':
        return <Badge key={role} label={label} variant="danger" className="py-[1px] px-2" />;
      case 'SELLER':
        return <Badge key={role} label={label} variant="primary" className="py-[1px] px-2" />;
      case 'DRIVER':
        return <Badge key={role} label={label} variant="danger" className="py-[1px] px-2" />;
      case 'BUYER':
      default:
        return <Badge key={role} label={label} variant="secondary" className="py-[1px] px-2" />;
    }
  };

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText className="mt-3">
            Memuat data...
          </ThemedText>
        </View>
      );
    }

    if (activeTab === 'OVERVIEW') {
      const stats = [
        { label: 'Total Pengguna', val: summary?.totalUsers ?? 0, icon: <Users size={20} color={theme.primary} />, bg: `${theme.primary}10` },
        { label: 'Total Toko', val: summary?.totalStores ?? 0, icon: <Store size={20} color={theme.secondary} />, bg: `${theme.secondary}10` },
        { label: 'Total Produk', val: summary?.totalProducts ?? 0, icon: <Package size={20} color={theme.tertiary} />, bg: `${theme.tertiary}10` },
        { label: 'Total Pesanan', val: summary?.totalOrders ?? 0, icon: <ClipboardList size={20} color={theme.primary} />, bg: `${theme.primary}10` },
        { label: 'Total Pengiriman', val: summary?.totalDeliveries ?? 0, icon: <Truck size={20} color={theme.primary} />, bg: `${theme.primary}10` },
        { label: 'Overdue Kiriman', val: summary?.returnedOrdersCount ?? 0, icon: <Info size={20} color={theme.danger} />, bg: `${theme.danger}10` },
      ];

      return (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
          }
          contentContainerClassName="p-4 pb-5 gap-3"
        >
          <Card className="p-4 border border-primary rounded-md bg-primary/10">
            <View className="flex-row items-center">
              <View className="w-[54px] h-[54px] rounded-xl items-center justify-center" style={{ backgroundColor: `${theme.tertiary}30` }}>
                <ShieldCheck size={36} color={theme.tertiary} />
              </View>
              <View className="ml-3 flex-1">
                <ThemedText type="smallBold" className="">
                  {user?.name}
                </ThemedText>
                <ThemedText className="">
                  (@{user?.username})
                </ThemedText>
              </View>
            </View>
            {roles.length > 1 && (
              <Button
                label="Pindah Peran Akun"
                variant="outline"
                size="small"
                leftIcon={<RefreshCcw size={16} color={theme.primary} />}
                onPress={() => router.push('/(public)/select-role')}
                className="mt-3"
              />
            )}
          </Card>

          <Card className="p-4 border border-primary rounded-md bg-primary/10">
            <View className="flex-row items-center">
              <Info size={16} color={theme.primary} />
              <ThemedText type="smallBold" className=" ml-1">
                Simulasi Waktu Sistem
              </ThemedText>
            </View>
            <ThemedText className=" font-bold mt-2">
              {summary?.currentSimulatedTime
                ? new Date(summary.currentSimulatedTime).toLocaleString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
                : 'Memuat waktu...'}
            </ThemedText>
            <Pressable onPress={() => setActiveTab('OVERVIEW')} className="mt-1.5">
              <ThemedText style={{ color: theme.primary, fontSize: 12, fontWeight: '700' }}>
                Atur Waktu di Tab Sistem
              </ThemedText>
            </Pressable>
          </Card>

          <View className="flex-row items-center gap-2 my-4">
            <View className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.primary }} />
            <ThemedText className="font-bold" style={{ color: theme.neutral[900] }}>
              Ringkasan Statistik
            </ThemedText>
          </View>
          <View className="flex-row flex-wrap gap-3">
            {stats.map((item, index) => (
              <Card key={index} className="w-[47.5%] p-3 gap-1 border border-neutral-300 rounded-md">
                <View className="w-9 h-9 rounded-lg items-center justify-center mb-1" style={{ backgroundColor: item.bg }}>
                  {item.icon}
                </View>
                <ThemedText className="text-neutral-700">
                  {item.label}
                </ThemedText>
                <ThemedText type="subtitle" className="font-bold">
                  {item.val}
                </ThemedText>
              </Card>
            ))}
          </View>

          <Button
            label="Keluar Dari Akun"
            variant="danger"
            leftIcon={<LogOut size={20} color="#FFFFFF" />}
            onPress={handleLogout}
            loading={loggingOut}
            className="mt-3 h-[50px]"
          />
        </ScrollView>
      );
    }

    if (activeTab === 'USERS') {
      return (
        <FlatList
          data={usersList}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
          }
          contentContainerClassName="p-4 pb-5"
          ListEmptyComponent={
            <ThemedText className="text-center mt-6">
              Tidak ada pengguna terdaftar.
            </ThemedText>
          }
          renderItem={({ item }) => (
            <Card className="mb-3 p-4 gap-2 border border-neutral-300 rounded-md">
              <View className="border-b border-neutral-300 pb-1">
                <ThemedText className="font-semibold">
                  {item.name}
                </ThemedText>
                <ThemedText className="">
                  @{item.username}
                </ThemedText>
              </View>
              <View className="flex-row items-center gap-2">
                <Mail size={14} color={theme.neutral[500]} />
                <ThemedText className="">
                  {item.email}
                </ThemedText>
              </View>
              <View className="flex-row items-center gap-2">
                <Calendar size={14} color={theme.neutral[500]} />
                <ThemedText className="">
                  Daftar: {new Date(item.createdAt).toLocaleDateString('id-ID')}
                </ThemedText>
              </View>
              <View className="flex-row flex-wrap gap-2 mt-1">
                {item.roles.map((r) => getRoleBadge(r))}
              </View>
            </Card>
          )}
        />
      );
    }

    if (activeTab === 'STORES') {
      return (
        <FlatList
          data={storesList}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
          }
          contentContainerClassName="p-4 pb-5"
          ListEmptyComponent={
            <ThemedText className="text-center mt-6">
              Tidak ada toko terdaftar.
            </ThemedText>
          }
          renderItem={({ item }) => (
            <Card className="mb-3 p-4 gap-2 border border-neutral-300 rounded-md">
              <View className="border-b border-neutral-300 pb-1">
                <ThemedText className="font-semibold">
                  {item.name}
                </ThemedText>
                <ThemedText className=" mt-[2px]">
                  {item.description}
                </ThemedText>
              </View>
              <View className="flex-row items-center gap-2">
                <Users size={14} color={theme.neutral[500]} />
                <ThemedText className="">
                  Pemilik: {item.seller.name} (@{item.seller.username})
                </ThemedText>
              </View>
              <View className="flex-row items-center gap-2">
                <Package size={14} color={theme.neutral[500]} />
                <ThemedText className="">
                  Jumlah Produk: {item.totalProducts} Item
                </ThemedText>
              </View>
              <View className="flex-row items-center gap-2">
                <Calendar size={14} color={theme.neutral[500]} />
                <ThemedText className="">
                  Buka: {new Date(item.createdAt).toLocaleDateString('id-ID')}
                </ThemedText>
              </View>
            </Card>
          )}
        />
      );
    }
  };

  return (
    <ThemedView className="flex-1">
      <View className="flex-row border-b h-12" style={{ borderBottomColor: theme.neutral[500] }}>
        <Pressable
          className={`flex-1 items-center justify-center border-b-[2.5px] ${activeTab === 'OVERVIEW' ? '' : 'border-transparent'}`}
          style={activeTab === 'OVERVIEW' ? { borderBottomColor: theme.primary } : {}}
          onPress={() => setActiveTab('OVERVIEW')}
        >
          <ThemedText
            className={`x] font-medium ${activeTab === 'OVERVIEW' ? 'font-bold' : ''}`}
            style={{ color: activeTab === 'OVERVIEW' ? theme.primary : theme.neutral[500] }}
          >
            Dasbor
          </ThemedText>
        </Pressable>

        <Pressable
          className={`flex-1 items-center justify-center border-b-[2.5px] ${activeTab === 'USERS' ? '' : 'border-transparent'}`}
          style={activeTab === 'USERS' ? { borderBottomColor: theme.primary } : {}}
          onPress={() => setActiveTab('USERS')}
        >
          <ThemedText
            className={`x] font-medium ${activeTab === 'USERS' ? 'font-bold' : ''}`}
            style={{ color: activeTab === 'USERS' ? theme.primary : theme.neutral[500] }}
          >
            Pengguna
          </ThemedText>
        </Pressable>

        <Pressable
          className={`flex-1 items-center justify-center border-b-[2.5px] ${activeTab === 'STORES' ? '' : 'border-transparent'}`}
          style={activeTab === 'STORES' ? { borderBottomColor: theme.primary } : {}}
          onPress={() => setActiveTab('STORES')}
        >
          <ThemedText
            className={`x] font-medium ${activeTab === 'STORES' ? 'font-bold' : ''}`}
            style={{ color: activeTab === 'STORES' ? theme.primary : theme.neutral[500] }}
          >
            Toko
          </ThemedText>
        </Pressable>
      </View>

      {renderContent()}
    </ThemedView>
  );
}
