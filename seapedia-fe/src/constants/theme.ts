/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  primary: '#0D9488',
  primaryShades: {
    50: '#FFFFFF',
    100: '#B3FFF3',
    200: '#89F5E7',
    300: '#6BD8CB',
    400: '#4CBCAF',
    500: '#29A195',
    600: '#00867B',
    700: '#005049',
    800: '#003732',
    900: '#00201D',
  },
  secondary: '#F59E0B',
  secondaryShades: {
    50: '#FFFFFF',
    100: '#FFEEDE',
    200: '#FFDDB8',
    300: '#FFB95F',
    400: '#EE9800',
    500: '#A76A00',
    600: '#855300',
    700: '#653E00',
    800: '#472A00',
    900: '#2A1700',
  },
  tertiary: '#0369A1',
  tertiaryShades: {
    50: '#FFFFFF',
    100: '#E7F2FF',
    200: '#CDE5FF',
    300: '#94CCFF',
    400: '#69B1EE',
    500: '#4C97D1',
    600: '#2C7CB6',
    700: '#004B74',
    800: '#003352',
    900: '#001D32',
  },
  neutral: {
    50: '#FFFFFF',
    100: '#F0F1F2',
    200: '#E1E3E4',
    300: '#C5C7C8',
    400: '#AAABAC',
    500: '#8F9192',
    600: '#2E3132',
    700: '#2E3132',
    800: '#2E3132',
    900: '#191C1D',
  },
} as const;

export type ThemeColor = keyof typeof Colors;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
