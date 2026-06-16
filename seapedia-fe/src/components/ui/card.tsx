import React from 'react';
import { View, ViewProps, Platform } from 'react-native';

export interface CardProps extends ViewProps {
  variant?: 'default' | 'flat' | 'glass';
  className?: string;
}

export function Card({ style, variant = 'default', className, ...props }: CardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'flat':
        return 'bg-backgroundElement border-[1.5px] border-border';
      case 'glass':
        return Platform.select({
          ios: 'bg-white/40 border border-white/20 shadow-xl',
          android: 'bg-backgroundElement border border-white/20 shadow-xl',
          default: 'bg-white/40 border border-white/20 shadow-xl',
        });
      case 'default':
      default:
        return 'bg-backgroundElement shadow-md shadow-slate-900/5 dark:shadow-slate-900/20 border border-border';
    }
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
