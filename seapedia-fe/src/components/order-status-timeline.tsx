import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CheckCircle2, Clock, Truck, Package, XCircle } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { ORDER_STATUS_LABELS } from '@/constants/config';

interface StatusHistoryItem {
  id: string;
  status: 'SEDANG_DIKEMAS' | 'MENUNGGU_PENGIRIM' | 'SEDANG_DIKIRIM' | 'PESANAN_SELESAI' | 'DIKEMBALIKAN';
  note: string | null;
  createdAt: string;
}

interface OrderStatusTimelineProps {
  statusHistory: StatusHistoryItem[];
  currentStatus: string;
}

export function OrderStatusTimeline({ statusHistory, currentStatus }: OrderStatusTimelineProps) {
  const theme = useTheme();

  const getStatusIcon = (status: string, isActive: boolean) => {
    const size = 18;
    const color = isActive ? '#FFFFFF' : theme.textSecondary;

    switch (status) {
      case 'SEDANG_DIKEMAS':
        return <Package size={size} color={color} />;
      case 'MENUNGGU_PENGIRIM':
        return <Clock size={size} color={color} />;
      case 'SEDANG_DIKIRIM':
        return <Truck size={size} color={color} />;
      case 'PESANAN_SELESAI':
        return <CheckCircle2 size={size} color={color} />;
      case 'DIKEMBALIKAN':
        return <XCircle size={size} color={color} />;
      default:
        return <Package size={size} color={color} />;
    }
  };

  const getStatusColor = (status: string, isPassed: boolean, isActive: boolean) => {
    if (status === 'DIKEMBALIKAN') {
      return theme.danger;
    }
    if (isActive) {
      return theme.primary;
    }
    if (isPassed) {
      return theme.success;
    }
    return theme.border;
  };

  // Status order sequence
  const statusSteps = ['SEDANG_DIKEMAS', 'MENUNGGU_PENGIRIM', 'SEDANG_DIKIRIM', 'PESANAN_SELESAI'];
  
  // If order was returned, we show a special sequence
  const isReturned = currentStatus === 'DIKEMBALIKAN';
  const stepsToRender = isReturned 
    ? ['SEDANG_DIKEMAS', 'MENUNGGU_PENGIRIM', 'SEDANG_DIKIRIM', 'DIKEMBALIKAN']
    : statusSteps;

  return (
    <View style={styles.container}>
      {stepsToRender.map((step, index) => {
        // Find if this step is present in the history
        const historyItem = statusHistory.find((h) => h.status === step);
        const isPassed = !!historyItem;
        const isActive = currentStatus === step;

        const stepColor = getStatusColor(step, isPassed, isActive);
        const label = ORDER_STATUS_LABELS[step as keyof typeof ORDER_STATUS_LABELS];

        const formattedDate = historyItem
          ? new Date(historyItem.createdAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })
          : null;

        return (
          <View key={step} style={styles.stepRow}>
            {/* Left side timeline indicators */}
            <View style={styles.indicatorContainer}>
              <View
                style={[
                  styles.circleIndicator,
                  {
                    backgroundColor: isActive ? stepColor : isPassed ? `${stepColor}20` : theme.backgroundElement,
                    borderColor: stepColor,
                  },
                ]}
              >
                {getStatusIcon(step, isActive)}
              </View>
              {index < stepsToRender.length - 1 && (
                <View
                  style={[
                    styles.verticalLine,
                    {
                      backgroundColor: isPassed && index < statusHistory.length - 1 ? theme.success : theme.border,
                    },
                  ]}
                />
              )}
            </View>

            {/* Right side status detail card */}
            <View style={styles.detailsContainer}>
              <View style={styles.titleRow}>
                <ThemedText
                  type="smallBold"
                  style={[
                    styles.statusLabel,
                    { color: isActive ? theme.primary : isPassed ? theme.text : theme.textSecondary },
                  ]}
                >
                  {label}
                </ThemedText>
                {formattedDate && (
                  <ThemedText style={styles.dateText} themeColor="textSecondary">
                    {formattedDate}
                  </ThemedText>
                )}
              </View>
              
              {historyItem?.note && (
                <ThemedText style={styles.noteText} themeColor="textSecondary">
                  {historyItem.note}
                </ThemedText>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingLeft: Spacing.one,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 65,
  },
  indicatorContainer: {
    alignItems: 'center',
    width: 32,
  },
  circleIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  verticalLine: {
    width: 2.5,
    flex: 1,
    minHeight: 35,
    marginVertical: 2,
    zIndex: 1,
  },
  detailsContainer: {
    flex: 1,
    marginLeft: Spacing.four,
    paddingBottom: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 11,
  },
  noteText: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
});
