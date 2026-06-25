import { Platform, Text, type TextProps } from 'react-native';


export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'large' | 'extraLarge' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  className?: string;
};

export function ThemedText({ type = 'default', className, ...rest }: ThemedTextProps) {

  const getTypeClasses = () => {
    switch (type) {
      case 'title': return 'text-[48px] font-semibold leading-[52px]';
      case 'subtitle': return 'text-[32px] font-semibold leading-[44px]';
      case 'small': return 'text-sm font-medium leading-5';
      case 'large': return 'text-lg font-semibold leading-5';
      case 'extraLarge': return 'text-xl font-semibold leading-5';
      case 'smallBold': return 'text-sm font-bold leading-5';
      case 'link': return 'text-sm leading-[30px]';
      case 'linkPrimary': return 'text-sm leading-[30px] text-[#3c87f7]';
      case 'code': return `text-xs ${Platform.OS === 'android' ? 'font-bold' : 'font-medium'} font-mono`;
      case 'default':
      default: return 'text-base leading-6';
    }
  };

  return (
    <Text className={`${getTypeClasses()} ${className || ''}`}{...rest} />
  );
}
