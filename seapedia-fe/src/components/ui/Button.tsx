import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '../themed-text';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'warning';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  label: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  className?: string;
  labelClasses?: string;
}

export function Button({
  variant = 'primary',
  size = 'medium',
  loading = false,
  label,
  leftIcon,
  rightIcon,
  style,
  labelStyle,
  className,
  labelClasses,
  disabled,
  ...props
}: ButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96, { damping: 10, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, { damping: 10, stiffness: 300 });
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return { container: 'bg-primary', text: 'text-white' };
      case 'secondary':
        return { container: 'bg-secondary', text: 'text-white' };
      case 'outline':
        return { container: 'bg-transparent border-[1.5px] border-primary', text: 'text-primary' };
      case 'danger':
        return { container: 'bg-danger', text: 'text-white' };
      case 'warning':
        return { container: 'bg-warning', text: 'text-white' };
      default:
        return { container: 'bg-primary', text: 'text-white' };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return { container: 'py-[6px] px-4 rounded-lg', text: 'text-[13px] font-semibold' };
      case 'large':
        return { container: 'py-4 px-8 rounded-[14px]', text: 'text-[17px] font-bold' };
      case 'medium':
      default:
        return { container: 'py-3 px-6 rounded-xl', text: 'text-[15px] font-semibold' };
    }
  };

  const variantClass = getVariantClasses();
  const sizeClass = getSizeClasses();

  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      className={`flex-row items-center justify-center gap-2 shadow-sm ${variantClass.container} ${sizeClass.container} ${isDisabled ? 'opacity-50' : ''} ${className || ''}`}
      style={[style, animatedStyle]}
      {...props}
    >
      {!loading && leftIcon}
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? theme.primary : '#FFFFFF'}
        />
      ) : (
        <ThemedText
          className={`text-center ${variantClass.text} ${sizeClass.text} ${labelClasses || ''}`}
          style={labelStyle}
        >
          {label}
        </ThemedText>
      )}
      {!loading && rightIcon}
    </AnimatedPressable>
  );
}
