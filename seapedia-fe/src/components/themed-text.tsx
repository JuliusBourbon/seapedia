import { Platform, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
  className?: string;
};

export function ThemedText({ style, type = 'default', themeColor, className, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  const getTypeClasses = () => {
    switch(type) {
      case 'title': return 'text-[48px] font-semibold leading-[52px]';
      case 'subtitle': return 'text-[32px] font-semibold leading-[44px]';
      case 'small': return 'text-sm font-medium leading-5';
      case 'smallBold': return 'text-sm font-bold leading-5';
      case 'link': return 'text-sm leading-[30px]';
      case 'linkPrimary': return 'text-sm leading-[30px] text-[#3c87f7]';
      case 'code': return `text-xs ${Platform.OS === 'android' ? 'font-bold' : 'font-medium'} font-mono`;
      case 'default':
      default: return 'text-base font-medium leading-6';
    }
  };

  return (
    <Text
      style={[{ color: themeColor ? theme[themeColor] : theme.text }, style]}
      className={`${getTypeClasses()} ${className || ''}`}
      {...rest}
    />
  );
}
