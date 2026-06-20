import React from 'react';
import { View, ViewProps, Platform } from 'react-native';

export interface CardProps extends ViewProps {
  variant?: 'default' | 'flat' | 'glass';
  className?: string;
}

export function Card({ style, variant = 'default', className, ...props }: CardProps) {
  const getVariantClasses = () => {
    return 'shadow-md shadow-slate-900/5 dark:shadow-slate-900/20 border border-white/20';
  };

  const variantClass = getVariantClasses();

  return (
    <View
      className={`rounded-2xl p-4 ${variantClass} ${className || ''}`}
      style={style}
      {...props}
    />
  );
}
