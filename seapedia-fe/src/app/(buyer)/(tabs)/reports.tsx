import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BarChart3 } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { useRouter } from 'expo-router';
import { Spacing } from '@/constants/theme';

export default function BuyerReportsTabPlaceholder() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <BarChart3 size={64} color={theme.placeholder} />
        <ThemedText type="smallBold" style={styles.title}>
          Laporan Pengeluaran Belanja
        </ThemedText>
        <ThemedText style={styles.subtitle} themeColor="textSecondary">
          Fitur visualisasi statistik dan rekapitulasi nominal belanja bulanan Anda akan diaktifkan pada Level 6.
        </ThemedText>
        <Button
          label="Kembali Ke Dasbor"
          onPress={() => router.push('/(buyer)/(tabs)/dashboard')}
          style={styles.btn}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    marginTop: Spacing.three,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
  },
  btn: {
    width: 200,
  },
});
