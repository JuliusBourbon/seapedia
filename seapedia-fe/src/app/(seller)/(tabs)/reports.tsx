import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Dimensions,
} from 'react-native';
import { BarChart3, TrendingUp, DollarSign, Package, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function SellerReportsScreen() {
  const theme = useTheme();

  // Mock data for display
  const metrics = [
    {
      title: 'Total Pendapatan',
      value: 'Rp 2.450.000',
      change: '+14.2%',
      isPositive: true,
      icon: <DollarSign size={20} color={theme.primary} />,
      bgColor: `${theme.primary}10`,
    },
    {
      title: 'Produk Terjual',
      value: '142 Item',
      change: '+8.5%',
      isPositive: true,
      icon: <Package size={20} color={theme.secondary} />,
      bgColor: `${theme.secondary}10`,
    },
    {
      title: 'Pesanan Selesai',
      value: '38 Pesanan',
      change: '+22.1%',
      isPositive: true,
      icon: <CheckCircle2 size={20} color={theme.success} />,
      bgColor: `${theme.success}10`,
    },
    {
      title: 'SLA Tepat Waktu',
      value: '97.4%',
      change: '-0.8%',
      isPositive: false,
      icon: <ShieldCheck size={20} color={theme.warning} />,
      bgColor: `${theme.warning}10`,
    },
  ];

  const chartData = [
    { label: 'Jan', value: 40 },
    { label: 'Feb', value: 55 },
    { label: 'Mar', value: 45 },
    { label: 'Apr', value: 75 },
    { label: 'Mei', value: 90 },
    { label: 'Jun', value: 110 },
  ];

  const maxChartValue = Math.max(...chartData.map((d) => d.value));

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner */}
        <Card style={styles.introCard}>
          <View style={styles.introHeader}>
            <AlertTriangle size={24} color={theme.warning} />
            <ThemedText type="smallBold" style={{ marginLeft: Spacing.two, fontSize: 16 }}>
              Demo Level 4
            </ThemedText>
          </View>
          <ThemedText style={styles.introDesc} themeColor="textSecondary">
            Halaman ini menampilkan visualisasi statis dari ringkasan performa toko nelayan Anda. Integrasi data transaksi real-time dan pencairan dana ke wallet penjual akan diaktifkan sepenuhnya pada **Level 6 (Modul Laporan & Admin Panel)**.
          </ThemedText>
        </Card>

        {/* Metrics Grid */}
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Metrik Penjualan Toko (Simulasi)
        </ThemedText>
        <View style={styles.metricsGrid}>
          {metrics.map((item, idx) => (
            <Card key={idx} style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <View style={[styles.iconContainer, { backgroundColor: item.bgColor }]}>
                  {item.icon}
                </View>
                <Badge 
                  label={item.change} 
                  variant={item.isPositive ? 'success' : 'danger'} 
                  style={styles.badgeStyle}
                />
              </View>
              <ThemedText style={styles.metricTitle} themeColor="textSecondary">
                {item.title}
              </ThemedText>
              <ThemedText type="subtitle" style={styles.metricValue}>
                {item.value}
              </ThemedText>
            </Card>
          ))}
        </View>

        {/* Mock Chart Card */}
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Grafik Tren Pendapatan 6 Bulan Terakhir
        </ThemedText>
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <ThemedText type="smallBold" style={{ fontSize: 16 }}>
                Grafik Penjualan
              </ThemedText>
              <ThemedText style={{ fontSize: 12 }} themeColor="textSecondary">
                Rata-rata kenaikan bulanan +15.4%
              </ThemedText>
            </View>
            <View style={styles.trendingContainer}>
              <TrendingUp size={16} color={theme.success} />
              <ThemedText style={{ color: theme.success, fontSize: 12, fontWeight: '700', marginLeft: 4 }}>
                Sangat Baik
              </ThemedText>
            </View>
          </View>

          {/* Styled Bars */}
          <View style={styles.barsContainer}>
            {chartData.map((bar, index) => {
              const barHeightPercent = (bar.value / maxChartValue) * 100;
              return (
                <View key={index} style={styles.barItem}>
                  <View style={styles.barBackground}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${barHeightPercent}%`,
                          backgroundColor: index === chartData.length - 1 ? theme.secondary : theme.primary,
                        },
                      ]}
                    />
                  </View>
                  <ThemedText style={styles.barLabel} themeColor="textSecondary">
                    {bar.label}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Future Integrations list */}
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Rencana Integrasi Level 6
        </ThemedText>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={[styles.bulletPoint, { backgroundColor: theme.primary }]} />
            <ThemedText style={styles.infoText} themeColor="textSecondary">
              Kalkulasi pendapatan bersih harian, mingguan, dan bulanan secara otomatis.
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <View style={[styles.bulletPoint, { backgroundColor: theme.primary }]} />
            <ThemedText style={styles.infoText} themeColor="textSecondary">
              Filter dinamis berdasarkan rentang tanggal dan produk terlaris.
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <View style={[styles.bulletPoint, { backgroundColor: theme.primary }]} />
            <ThemedText style={styles.infoText} themeColor="textSecondary">
              Laporan ekspor transaksi penjualan dalam format PDF & Excel untuk laporan pajak nelayan.
            </ThemedText>
          </View>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: Spacing.one,
    marginTop: Spacing.two,
  },
  introCard: {
    padding: Spacing.four,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B', // Amber warning color
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  introDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  metricCard: {
    width: (width - Spacing.four * 2 - Spacing.three) / 2,
    padding: Spacing.three * 1.2,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeStyle: {
    paddingVertical: 1,
    paddingHorizontal: Spacing.two,
  },
  metricTitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  chartCard: {
    padding: Spacing.four,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  trendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    marginTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  barItem: {
    alignItems: 'center',
    flex: 1,
  },
  barBackground: {
    height: '100%',
    width: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 99,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 99,
  },
  barLabel: {
    fontSize: 11,
    marginTop: Spacing.two,
  },
  infoCard: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: Spacing.three,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
