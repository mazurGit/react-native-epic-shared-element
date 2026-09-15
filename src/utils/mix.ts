import type { SharedElementTransitionStyle } from '../common/types';
import { StyleSheet } from 'react-native';

export function mix<T extends readonly SharedElementTransitionStyle[]>(
  ...styles: T
): SharedElementTransitionStyle {
  return (context) => {
    'worklet';
    return styles.reduce<ReturnType<SharedElementTransitionStyle>>(
      (result, style) => {
        const value = style?.(context);
        const next = Array.isArray(value)
          ? StyleSheet.flatten(value)
          : (value ?? {});
        return {
          ...result,
          ...next,
          transform: [...(result?.transform ?? []), ...(next.transform ?? [])],
        };
      },
      {}
    );
  };
}
