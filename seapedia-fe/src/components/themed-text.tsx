import { Platform, Text, type TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'large' | 'extraLarge' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  className?: string;
  themeColor?: 'text' | 'textSecondary' | 'primary';
};

export function ThemedText({ type = 'default', className, themeColor, ...rest }: ThemedTextProps) {

  const getTypeClasses = () => {
    switch (type) {
      case 'title': return 'text-[48px] font-semibold leading-[52px]';
      case 'subtitle': return 'text-[32px] font-semibold leading-[44px]';
      case 'small': return 'text-sm font-medium leading-5';
      case 'large': return 'text-lg font-semibold leading-5';
      case 'extraLarge': return 'text-xl font-semibold leading-5';
      case 'smallBold': return 'text-sm font-bold leading-5';
      case 'link': return 'text-sm leading-[30px]';
      case 'linkPrimary': return 'text-sm leading-[30px] text-primary';
      case 'code': return `text-xs ${Platform.OS === 'android' ? 'font-bold' : 'font-medium'} font-mono`;
      case 'default':
      default: return 'text-base leading-6';
    }
  };

  const combinedClasses = `${getTypeClasses()} ${className || ''}`;

  const getFontFamily = () => {
    if (type === 'code') return undefined; // use system mono

    if (combinedClasses.includes('font-extrabold')) return 'Commissioner_800ExtraBold';
    if (combinedClasses.includes('font-bold')) return 'Commissioner_700Bold';
    if (combinedClasses.includes('font-semibold')) return 'Commissioner_600SemiBold';
    if (combinedClasses.includes('font-medium')) return 'Commissioner_500Medium';

    return 'Commissioner_400Regular';
  };

  return (
    <Text
      className={combinedClasses}
      style={[{ fontFamily: getFontFamily() }, rest.style]}
      {...rest}
    />
  );
}
