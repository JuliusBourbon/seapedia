// import React from 'react';
import { View, ViewStyle, TextStyle } from 'react-native';
import { ThemedText } from '../themed-text';

export type BadgeVariant = 'primary' | 'secondary' | 'tertiary' | 'success' | 'danger' | 'warning' | 'neutral';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  className?: string;
  textClasses?: string;
}

export function Badge({ label, variant = 'neutral', style, textStyle, className, textClasses }: BadgeProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary': return { container: 'bg-primary/10', text: 'text-primary' };
      case 'secondary': return { container: 'bg-secondary/5', text: 'text-secondary' };
      case 'tertiary': return { container: 'bg-tertiary/5', text: 'text-tertiary' };
      case 'success': return { container: 'bg-primary/10', text: 'text-primary' };
      case 'danger': return { container: 'bg-danger/5', text: 'text-danger' };
      case 'warning': return { container: 'bg-secondary/5', text: 'text-secondary' };
      case 'neutral':
      default: return { container: 'bg-textSecondary/10', text: 'text-textSecondary' };
    }
  };

  const badgeClass = getVariantClasses();

  return (
    <View
      style={style}
      className={`py-[2px] px-[10px] rounded-md self-start items-center justify-center ${badgeClass.container} ${className || ''}`}
    >
      <ThemedText
        type='small'
        style={textStyle}
        className={`font-bold uppercase text-center ${badgeClass.text} ${textClasses || ''}`}
      >
        {label}
      </ThemedText>
    </View>
  );
}
