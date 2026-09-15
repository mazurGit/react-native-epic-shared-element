import {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import type { ViewStyle } from 'react-native';
import type {
  SharedElementRect,
  SharedElementTransitionConfig,
} from '../common/types';

const progressBounds = [0.05, 0.95];

export function useSharedElementTransitionStyle(
  progress: SharedValue<number>,
  start: SharedValue<SharedElementRect | null> | undefined,
  end: SharedValue<SharedElementRect | null> | undefined,
  revision: number,
  transition?: SharedElementTransitionConfig
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
    const opacity =
      value >= 1
        ? 0
        : interpolate(value, [0, 0.001], [0, 1], Extrapolation.CLAMP);

    const size = { width: startRect.width, height: startRect.height };
    const transitionStyle =
      transition?.({
        progress: motionProgress,
        start: startRect,
        end: endRect,
      }) ?? {};

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
    const basePosition = {
      left: startRect.x + (endRect.x - startRect.x) * motionProgress,
      top: startRect.y + (endRect.y - startRect.y) * motionProgress,
    };

    return {
      opacity,
      ...basePosition,
      ...size,
      ...transitionStyle,
      ...radius,
      transform: transitionStyle.transform as ViewStyle['transform'],
    };
  }, [revision, transition]);
}
