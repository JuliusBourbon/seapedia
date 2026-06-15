import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
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
import { Spacing } from '@/constants/theme';

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

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: { backgroundColor: theme.primary },
          text: { color: '#FFFFFF' },
        };
      case 'secondary':
        return {
          container: { backgroundColor: theme.secondary },
          text: { color: '#FFFFFF' },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: theme.primary,
          },
          text: { color: theme.primary },
        };
      case 'danger':
        return {
          container: { backgroundColor: theme.danger },
          text: { color: '#FFFFFF' },
        };
      case 'warning':
        return {
          container: { backgroundColor: theme.warning },
          text: { color: '#FFFFFF' },
        };
      default:
        return {
          container: { backgroundColor: theme.primary },
          text: { color: '#FFFFFF' },
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: {
            paddingVertical: Spacing.one * 1.5,
            paddingHorizontal: Spacing.three,
            borderRadius: 8,
          },
          text: { fontSize: 13, fontWeight: '600' as const },
        };
      case 'large':
        return {
          container: {
            paddingVertical: Spacing.three,
            paddingHorizontal: Spacing.five,
            borderRadius: 14,
          },
          text: { fontSize: 17, fontWeight: '700' as const },
        };
      case 'medium':
      default:
        return {
          container: {
            paddingVertical: Spacing.two * 1.5,
            paddingHorizontal: Spacing.four,
            borderRadius: 12,
          },
          text: { fontSize: 15, fontWeight: '600' as const },
        };
    }
  };

  const variantStyle = getVariantStyles();
  const sizeStyle = getSizeStyles();

  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        styles.baseButton,
        variantStyle.container,
        sizeStyle.container,
        isDisabled && styles.disabled,
        style,
        animatedStyle,
      ]}
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
          style={[
            styles.label,
            variantStyle.text,
            sizeStyle.text,
            labelStyle,
          ]}
        >
          {label}
        </ThemedText>
      )}
      {!loading && rightIcon}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
