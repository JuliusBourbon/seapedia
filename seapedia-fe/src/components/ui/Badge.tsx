import React from 'react';
import { StyleSheet, View, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '../themed-text';
import { Spacing } from '@/constants/theme';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'neutral';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({ label, variant = 'neutral', style, textStyle }: BadgeProps) {
  const theme = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: { backgroundColor: `${theme.primary}15` }, // ~8% opacity hex suffix
          text: { color: theme.primary },
        };
      case 'secondary':
        return {
          container: { backgroundColor: `${theme.secondary}15` },
          text: { color: theme.secondary },
        };
      case 'success':
        return {
          container: { backgroundColor: `${theme.success}15` },
          text: { color: theme.success },
        };
      case 'danger':
        return {
          container: { backgroundColor: `${theme.danger}15` },
          text: { color: theme.danger },
        };
      case 'warning':
        return {
          container: { backgroundColor: `${theme.warning}15` },
          text: { color: theme.warning },
        };
      case 'neutral':
      default:
        return {
          container: { backgroundColor: `${theme.textSecondary}15` },
          text: { color: theme.textSecondary },
        };
    }
  };

  const badgeStyle = getVariantStyles();

  return (
    <View style={[styles.badgeContainer, badgeStyle.container, style]}>
      <ThemedText style={[styles.badgeText, badgeStyle.text, textStyle]}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two * 1.2,
    borderRadius: 99,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
