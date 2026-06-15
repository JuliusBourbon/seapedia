/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A', // Slate 900
    background: '#F8FAFC', // Slate 50
    backgroundElement: '#FFFFFF', // White
    backgroundSelected: '#E2E8F0', // Slate 200
    textSecondary: '#64748B', // Slate 500
    primary: '#0D9488', // Teal 600
    primaryMuted: '#2DD4BF', // Teal 400
    secondary: '#0EA5E9', // Sky 500
    success: '#10B981', // Emerald 500
    danger: '#EF4444', // Red 500
    warning: '#F59E0B', // Amber 500
    border: '#E2E8F0', // Slate 200
    card: '#FFFFFF',
    placeholder: '#94A3B8',
  },
  dark: {
    text: '#F8FAFC', // Slate 50
    background: '#0F172A', // Slate 900
    backgroundElement: '#1E293B', // Slate 800
    backgroundSelected: '#334155', // Slate 700
    textSecondary: '#94A3B8', // Slate 400
    primary: '#0D9488', // Teal 600
    primaryMuted: '#14B8A6', // Teal 500
    secondary: '#38BDF8', // Sky 400
    success: '#34D399', // Emerald 400
    danger: '#F87171', // Red 400
    warning: '#FBBF24', // Amber 400
    border: '#334155', // Slate 700
    card: '#1E293B',
    placeholder: '#475569',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

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
