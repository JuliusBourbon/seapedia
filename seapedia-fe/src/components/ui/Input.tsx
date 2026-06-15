import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  TextStyle,
  Pressable,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '../themed-text';
import { Spacing } from '@/constants/theme';
import { Eye, EyeOff } from 'lucide-react-native';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string | string[];
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  leftIcon?: React.ReactNode;
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

  // Process error message
  const errorMsg = Array.isArray(error) ? error[0] : error;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <ThemedText
          type="smallBold"
          style={[styles.label, { color: theme.textSecondary }, labelStyle]}
        >
          {label}
        </ThemedText>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: errorMsg
              ? theme.danger
              : isFocused
              ? theme.primary
              : theme.border,
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
        
        <TextInput
          placeholderTextColor={theme.placeholder}
          secureTextEntry={shouldHidePassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            { color: theme.text },
            inputStyle,
          ]}
          {...props}
        />
        {isPassword && (
          <Pressable
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.toggleButton}
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color={theme.textSecondary} />
            ) : (
              <Eye size={20} color={theme.textSecondary} />
            )}
          </Pressable>
        )}
      </View>
      {errorMsg && (
        <ThemedText style={[styles.errorText, { color: theme.danger }]}>
          {errorMsg}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.three,
    alignSelf: 'stretch',
  },
  label: {
    marginBottom: Spacing.one,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    height: 52,
  },
  leftIconContainer: {
    marginRight: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontWeight: '500',
    padding: 0, // Reset default padding for android/ios
  },
  toggleButton: {
    padding: Spacing.one,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: Spacing.one,
  },
});
