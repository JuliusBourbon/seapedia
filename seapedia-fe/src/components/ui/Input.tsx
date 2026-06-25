import React, { useState } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  TextStyle,
  Pressable,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '../themed-text';
import { Eye, EyeOff } from 'lucide-react-native';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string | string[];
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  containerClasses?: string;
  inputClasses?: string;
}

export function Input({
  label,
  error,
  containerStyle,
  inputStyle,
  labelStyle,
  secureTextEntry,
  leftIcon,
  onFocus,
  onBlur,
  containerClasses,
  inputClasses,
  ...props
}: InputProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const isPassword = secureTextEntry;
  const shouldHidePassword = isPassword && !isPasswordVisible;

  const errorMsg = Array.isArray(error) ? error[0] : error;

  let borderColor: string = theme.neutral[300];

  if (errorMsg) {
    borderColor = theme.danger;
  } else if (isFocused) {
    borderColor = theme.primary;
  }

  return (
    <View style={containerStyle} className={`mb-4 self-stretch ${containerClasses || ''}`}>
      {label && (
        <ThemedText
          type="smallBold"
          className="mb-1"
          style={[{ color: theme.neutral[600] }, labelStyle]}
        >
          {label}
        </ThemedText>
      )}
      <View
        className="flex-row items-center border-[1px] rounded-xl px-4 h-[52px]"
        style={{
          backgroundColor: theme.neutral[100],
          borderColor: borderColor,
        }}
      >
        {leftIcon && <View className="mr-2 justify-center items-center">{leftIcon}</View>}

        <TextInput
          placeholderTextColor={theme.neutral[400]}
          secureTextEntry={shouldHidePassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`flex-1 h-full text-[15px] font-medium p-0 ${inputClasses || ''}`}
          style={[{ color: theme.neutral[900], fontFamily: 'Commissioner_500Medium' }, inputStyle]}
          {...props}
        />
        {isPassword && (
          <Pressable
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            className="p-1 justify-center items-center"
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color={theme.neutral[500]} />
            ) : (
              <Eye size={20} color={theme.neutral[500]} />
            )}
          </Pressable>
        )}
      </View>
      {errorMsg && (
        <ThemedText type='smallBold' className="mt-1" style={{ color: theme.danger }}>
          {errorMsg}
        </ThemedText>
      )}
    </View>
  );
}
