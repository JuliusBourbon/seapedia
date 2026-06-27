import React from 'react';
import { View, ViewProps, Platform } from 'react-native';

export interface CardProps extends ViewProps {
  variant?: 'default' | 'flat' | 'glass';
  className?: string;
}

export function Card({ style, variant = 'default', className, ...props }: CardProps) {

  return (
    <View
      className={`rounded-2xl ${className || ''}`}
      style={style}
      {...props}
    />
  );
}
