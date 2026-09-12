import {
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import type {
  SharedElementRect,
  SharedElementTransitionDecoration,
  SharedElementTransitionConfig,
} from '../common/types';

const zoomProgressBounds = [0.05, 0.95];

function getLinearGeometry(
  progress: number,
  start: SharedElementRect,
  end: SharedElementRect
) {
  'worklet';
  return {
    left: interpolate(progress, [0, 1], [start.x, end.x]),
    top: interpolate(progress, [0, 1], [start.y, end.y]),
  };
}

function getDecoration(
  transition: SharedElementTransitionConfig,
  progress: number,
  start: SharedElementRect,
  end: SharedElementRect
): SharedElementTransitionDecoration | undefined {
  'worklet';
  return transition({ progress, start, end });
}

export function useSharedElementTransitionStyle(
  progress: SharedValue<number>,
  start: SharedValue<SharedElementRect | null> | undefined,
  end: SharedValue<SharedElementRect | null> | undefined,
  transition: SharedElementTransitionConfig,
  mode: 'resize' | 'zoom',
  revision: number
) {
  return useAnimatedStyle(() => {
    const startRect = start?.value;
    const endRect = end?.value;

    if (!startRect || !endRect) return { opacity: 0 };

    const value = progress.value;
    const decoration =
      getDecoration(transition, value, startRect, endRect) ?? {};
    const opacity = interpolate(value, [0, 0.001, 0.999, 1], [0, 1, 1, 0]);

    const geometry = getLinearGeometry(value, startRect, endRect);
    const size =
      mode === 'zoom'
        ? {
            width: startRect.width,
            height: startRect.height,
            transformOrigin: 'top left' as const,
            transform: [
              {
                scale: interpolate(value, zoomProgressBounds, [
                  1,
                  endRect.height / startRect.height,
                ]),
              },
            ],
          }
        : {
            width: interpolate(value, [0, 1], [startRect.width, endRect.width]),
            height: interpolate(
              value,
              [0, 1],
              [startRect.height, endRect.height]
            ),
          };
    const transform = decoration.transform ?? size.transform;

    return {
      opacity,
      ...geometry,
      ...decoration,
      ...size,
      ...(transform ? { transform } : {}),
    };
  }, [mode, revision, transition]);
}
