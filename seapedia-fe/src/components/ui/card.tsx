import React from 'react';
import { StyleSheet, View, ViewProps, Platform } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export interface CardProps extends ViewProps {
  variant?: 'default' | 'flat' | 'glass';
}

export function Card({ style, variant = 'default', ...props }: CardProps) {
  const theme = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'flat':
        return {
          backgroundColor: theme.backgroundElement,
          borderWidth: 1.5,
          borderColor: theme.border,
        };
      case 'glass':
        return {
          backgroundColor: Platform.select({
            ios: 'rgba(255, 255, 255, 0.4)',
            android: theme.backgroundElement,
            default: 'rgba(255, 255, 255, 0.4)',
          }),
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 16,
        };
      case 'default':
      default:
        return {
          backgroundColor: theme.backgroundElement,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: theme.background === '#F8FAFC' ? 0.04 : 0.2,
          shadowRadius: 12,
          elevation: 3,
          borderWidth: 1,
          borderColor: theme.border,
        };
    }
  };

  const cardStyle = getVariantStyles();

  return <View style={[styles.card, cardStyle, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: Spacing.three,
  },
});
