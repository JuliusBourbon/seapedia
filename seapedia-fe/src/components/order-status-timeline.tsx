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
    <View className="pl-1">
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
          <View key={step} className="flex-row items-start min-h-[65px]">
            {/* Left side timeline indicators */}
            <View className="items-center w-8">
              <View
                className="w-8 h-8 rounded-full border-2 items-center justify-center z-10"
                style={[
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
                  className="w-[2.5px] flex-1 min-h-[35px] my-[2px] z-0"
                  style={[
                    {
                      backgroundColor: isPassed && index < statusHistory.length - 1 ? theme.success : theme.border,
                    },
                  ]}
                />
              )}
            </View>

            {/* Right side status detail card */}
            <View className="flex-1 ml-4 pb-3">
              <View className="flex-row justify-between items-center">
                <ThemedText
                  type="smallBold"
                  className="text-[14px] font-bold"
                  style={[
                    { color: isActive ? theme.primary : isPassed ? theme.text : theme.textSecondary },
                  ]}
                >
                  {label}
                </ThemedText>
                {formattedDate && (
                  <ThemedText className="text-[11px]" themeColor="textSecondary">
                    {formattedDate}
                  </ThemedText>
                )}
              </View>
              
              {historyItem?.note && (
                <ThemedText className="text-[12px] mt-1 leading-[16px]" themeColor="textSecondary">
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
