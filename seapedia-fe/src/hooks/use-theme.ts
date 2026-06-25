/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();

  // Because `theme.ts` uses a single color palette without light/dark modes,
  // we return the `Colors` object directly and map common semantic colors.
  return {
    ...Colors,
    // text: Colors.neutral[900],
    // textSecondary: Colors.neutral[500],
    // background: Colors.neutral[50],
  };
}
