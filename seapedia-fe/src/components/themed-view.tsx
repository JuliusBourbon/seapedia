import { View, type ViewProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  type?: ThemeColor;
  className?: string;
};

export function ThemedView({ style, type, className, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();

  return (
    <View 
      style={[{ backgroundColor: theme[type ?? 'background'] }, style]} 
      className={className} 
      {...otherProps} 
    />
  );
}
