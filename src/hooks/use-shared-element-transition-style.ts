import {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import type { ViewStyle } from 'react-native';
import type {
  SharedElementContentType,
  SharedElementRect,
  SharedElementTransitionConfig,
} from '../common/types';

import { getSharedElementSizeStyle } from '../common/transition-size';

const progressBounds = [0.05, 0.95];

export function useSharedElementTransitionStyle(
  progress: SharedValue<number>,
  start: SharedValue<SharedElementRect | null> | undefined,
  end: SharedValue<SharedElementRect | null> | undefined,
  transition: SharedElementTransitionConfig,
  mode: 'resize' | 'zoom',
  revision: number,
  contentType: SharedElementContentType = 'view'
) {
  return useAnimatedStyle(() => {
    const startRect = start?.value;
    const endRect = end?.value;

    if (!startRect || !endRect) return { opacity: 0 };

    const value = progress.value;
    const motionProgress = interpolate(
      value,
      progressBounds,
      [0, 1],
      Extrapolation.CLAMP
    );
    const decoration =
      transition({
        progress: motionProgress,
        start: startRect,
        end: endRect,
      }) ?? {};
    const opacity = interpolate(value, [0, 0.001, 0.999, 1], [0, 1, 1, 0]);

    const size = getSharedElementSizeStyle(
      motionProgress,
      startRect,
      endRect,
      mode,
      contentType
    );

    const radius =
      startRect.borderRadius !== undefined && endRect.borderRadius !== undefined
        ? {
            borderRadius: interpolate(
              motionProgress,
              [0, 1],
              [startRect.borderRadius, endRect.borderRadius]
            ),
          }
        : {};
    const transform = [
      ...(size.transform ?? []),
      ...(decoration.transform ?? []),
    ] as ViewStyle['transform'];

    return {
      opacity,
      ...decoration,
      ...size,
      ...radius,
      transform,
    };
  }, [mode, revision, transition, contentType]);
}
