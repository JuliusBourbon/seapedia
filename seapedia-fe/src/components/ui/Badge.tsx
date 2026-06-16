import React from 'react';
import { View, ViewStyle, TextStyle } from 'react-native';
import { ThemedText } from '../themed-text';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'neutral';

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
      case 'secondary': return { container: 'bg-secondary/10', text: 'text-secondary' };
      case 'success': return { container: 'bg-success/10', text: 'text-success' };
      case 'danger': return { container: 'bg-danger/10', text: 'text-danger' };
      case 'warning': return { container: 'bg-warning/10', text: 'text-warning' };
      case 'neutral':
      default: return { container: 'bg-textSecondary/10', text: 'text-textSecondary' };
    }
  };

  const badgeClass = getVariantClasses();

  return (
    <View 
      style={style}
      className={`py-[2px] px-[10px] rounded-full self-start items-center justify-center ${badgeClass.container} ${className || ''}`}
    >
      <ThemedText 
        style={textStyle}
        className={`text-[11px] font-bold uppercase ${badgeClass.text} ${textClasses || ''}`}
      >
        {label}
      </ThemedText>
    </View>
  );
}
