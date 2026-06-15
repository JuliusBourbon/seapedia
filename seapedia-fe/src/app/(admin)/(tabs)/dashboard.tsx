import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  FlatList,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BarChart3, Users, Store, Package, ClipboardList, RefreshCcw, LogOut, Info, ShieldCheck, Mail, Calendar, Truck } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spacing } from '@/constants/theme';
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
        return <Badge key={role} label={label} variant="danger" style={styles.roleBadge} />;
      case 'SELLER':
        return <Badge key={role} label={label} variant="primary" style={styles.roleBadge} />;
      case 'DRIVER':
        return <Badge key={role} label={label} variant="warning" style={styles.roleBadge} />;
      case 'BUYER':
      default:
        return <Badge key={role} label={label} variant="secondary" style={styles.roleBadge} />;
    }
  };

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={{ marginTop: Spacing.three }} themeColor="textSecondary">
            Memuat data...
          </ThemedText>
        </View>
      );
    }

    if (activeTab === 'OVERVIEW') {
      const stats = [
        { label: 'Total Pengguna', val: summary?.totalUsers ?? 0, icon: <Users size={20} color={theme.primary} />, bg: `${theme.primary}10` },
        { label: 'Total Toko', val: summary?.totalStores ?? 0, icon: <Store size={20} color={theme.secondary} />, bg: `${theme.secondary}10` },
        { label: 'Total Produk', val: summary?.totalProducts ?? 0, icon: <Package size={20} color={theme.success} />, bg: `${theme.success}10` },
        { label: 'Total Pesanan', val: summary?.totalOrders ?? 0, icon: <ClipboardList size={20} color={theme.warning} />, bg: `${theme.warning}10` },
        { label: 'Total Pengiriman', val: summary?.totalDeliveries ?? 0, icon: <Truck size={20} color={theme.primary} />, bg: `${theme.primary}10` },
        { label: 'Overdue Kiriman', val: summary?.overdueCount ?? 0, icon: <Info size={20} color={theme.danger} />, bg: `${theme.danger}10` },
      ];

      return (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
          }
          contentContainerStyle={styles.tabContent}
        >
          {/* Welcome Banner */}
          <Card style={styles.welcomeCard}>
            <View style={styles.profileRow}>
              <View style={[styles.avatarBox, { backgroundColor: `${theme.danger}15` }]}>
                <ShieldCheck size={36} color={theme.danger} />
              </View>
              <View style={styles.profileText}>
                <ThemedText type="smallBold" style={{ fontSize: 18 }}>
                  {user?.name}
                </ThemedText>
                <ThemedText style={{ fontSize: 13 }} themeColor="textSecondary">
                  Administrator Utama (@{user?.username})
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
                style={{ marginTop: Spacing.three }}
              />
            )}
          </Card>

          {/* Time simulation brief */}
          <Card style={styles.timeCard}>
            <View style={styles.timeHeader}>
              <Info size={16} color={theme.primary} />
              <ThemedText type="smallBold" style={{ fontSize: 13, marginLeft: Spacing.one }}>
                Simulasi Waktu Sistem
              </ThemedText>
            </View>
            <ThemedText style={styles.timeValue}>
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
            <Pressable onPress={() => setActiveTab('OVERVIEW')} style={styles.timeAction}>
              <ThemedText style={{ color: theme.primary, fontSize: 12, fontWeight: '700' }}>
                Atur Waktu di Tab Sistem
              </ThemedText>
            </Pressable>
          </Card>

          {/* Grid Stats */}
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Ringkasan Statistik
          </ThemedText>
          <View style={styles.statsGrid}>
            {stats.map((item, index) => (
              <Card key={index} style={styles.statCard}>
                <View style={[styles.iconContainer, { backgroundColor: item.bg }]}>
                  {item.icon}
                </View>
                <ThemedText style={styles.statLabel} themeColor="textSecondary">
                  {item.label}
                </ThemedText>
                <ThemedText type="subtitle" style={styles.statVal}>
                  {item.val}
                </ThemedText>
              </Card>
            ))}
          </View>

          {/* Logout Button */}
          <Button
            label="Keluar Dari Akun"
            variant="danger"
            leftIcon={<LogOut size={20} color="#FFFFFF" />}
            onPress={handleLogout}
            loading={loggingOut}
            style={styles.logoutBtn}
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
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText style={styles.emptyText} themeColor="textSecondary">
              Tidak ada pengguna terdaftar.
            </ThemedText>
          }
          renderItem={({ item }) => (
            <Card style={styles.monitorCard}>
              <View style={styles.cardMainInfo}>
                <ThemedText type="smallBold" style={{ fontSize: 15 }}>
                  {item.name}
                </ThemedText>
                <ThemedText style={{ fontSize: 13 }} themeColor="textSecondary">
                  @{item.username}
                </ThemedText>
              </View>
              <View style={styles.monitorInfoRow}>
                <Mail size={14} color={theme.textSecondary} />
                <ThemedText style={styles.monitorInfoText} themeColor="textSecondary">
                  {item.email}
                </ThemedText>
              </View>
              <View style={styles.monitorInfoRow}>
                <Calendar size={14} color={theme.textSecondary} />
                <ThemedText style={styles.monitorInfoText} themeColor="textSecondary">
                  Daftar: {new Date(item.createdAt).toLocaleDateString('id-ID')}
                </ThemedText>
              </View>
              <View style={styles.rolesRow}>
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
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText style={styles.emptyText} themeColor="textSecondary">
              Tidak ada toko nelayan terdaftar.
            </ThemedText>
          }
          renderItem={({ item }) => (
            <Card style={styles.monitorCard}>
              <View style={styles.cardMainInfo}>
                <ThemedText type="smallBold" style={{ fontSize: 15 }}>
                  {item.name}
                </ThemedText>
                <ThemedText style={{ fontSize: 12, marginTop: 2 }} themeColor="textSecondary">
                  {item.description}
                </ThemedText>
              </View>
              <View style={styles.monitorInfoRow}>
                <Users size={14} color={theme.textSecondary} />
                <ThemedText style={styles.monitorInfoText} themeColor="textSecondary">
                  Pemilik: {item.seller.name} (@{item.seller.username})
                </ThemedText>
              </View>
              <View style={styles.monitorInfoRow}>
                <Package size={14} color={theme.textSecondary} />
                <ThemedText style={styles.monitorInfoText} themeColor="textSecondary">
                  Jumlah Produk: {item.totalProducts} Item
                </ThemedText>
              </View>
              <View style={styles.monitorInfoRow}>
                <Calendar size={14} color={theme.textSecondary} />
                <ThemedText style={styles.monitorInfoText} themeColor="textSecondary">
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
    <ThemedView style={styles.container}>
      {/* Sub Tabs Navigation */}
      <View style={[styles.subTabContainer, { borderBottomColor: theme.border }]}>
        <Pressable
          style={[styles.subTabItem, activeTab === 'OVERVIEW' && { borderBottomColor: theme.primary }]}
          onPress={() => setActiveTab('OVERVIEW')}
        >
          <ThemedText
            style={[
              styles.subTabLabel,
              { color: activeTab === 'OVERVIEW' ? theme.primary : theme.textSecondary },
              activeTab === 'OVERVIEW' && { fontWeight: '700' },
            ]}
          >
            Ikhtisar
          </ThemedText>
        </Pressable>

        <Pressable
          style={[styles.subTabItem, activeTab === 'USERS' && { borderBottomColor: theme.primary }]}
          onPress={() => setActiveTab('USERS')}
        >
          <ThemedText
            style={[
              styles.subTabLabel,
              { color: activeTab === 'USERS' ? theme.primary : theme.textSecondary },
              activeTab === 'USERS' && { fontWeight: '700' },
            ]}
          >
            Pengguna
          </ThemedText>
        </Pressable>

        <Pressable
          style={[styles.subTabItem, activeTab === 'STORES' && { borderBottomColor: theme.primary }]}
          onPress={() => setActiveTab('STORES')}
        >
          <ThemedText
            style={[
              styles.subTabLabel,
              { color: activeTab === 'STORES' ? theme.primary : theme.textSecondary },
              activeTab === 'STORES' && { fontWeight: '700' },
            ]}
          >
            Toko Nelayan
          </ThemedText>
        </Pressable>
      </View>

      {renderContent()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    height: 48,
  },
  subTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  subTabLabel: {
    fontSize: 13.5,
    fontWeight: '500',
  },
  tabContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  listContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.five,
  },
  welcomeCard: {
    padding: Spacing.four,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 54,
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    marginLeft: Spacing.three,
    flex: 1,
  },
  timeCard: {
    padding: Spacing.four,
    backgroundColor: 'rgba(13, 148, 136, 0.04)',
    borderColor: 'rgba(13, 148, 136, 0.1)',
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: Spacing.two,
  },
  timeAction: {
    marginTop: Spacing.one * 1.5,
  },
  sectionTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: Spacing.one,
    marginTop: Spacing.two,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  statCard: {
    width: '47.5%',
    padding: Spacing.three * 1.2,
    gap: 4,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
  },
  logoutBtn: {
    marginTop: Spacing.three,
    height: 50,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.six,
  },
  monitorCard: {
    marginBottom: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  cardMainInfo: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    paddingBottom: Spacing.one,
  },
  monitorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  monitorInfoText: {
    fontSize: 13,
  },
  rolesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  roleBadge: {
    paddingVertical: 1,
    paddingHorizontal: Spacing.two,
  },
});
