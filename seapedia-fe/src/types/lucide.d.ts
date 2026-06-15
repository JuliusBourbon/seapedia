import { SvgProps } from 'react-native-svg';

declare module 'lucide-react-native' {
  export interface LucideProps extends SvgProps {
    color?: any;
    fill?: string;
    style?: any;
    opacity?: number;
  }
}
