import {
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import type {
  SharedElementRect,
  SharedElementTransitionDecoration,
  SharedElementTransitionPreset,
} from '../common/types';

const zoomProgressBounds = [0.05, 0.95];

function getLinearGeometry(
  progress: number,
  start: SharedElementRect,
  end: SharedElementRect
) {
  return {
    left: interpolate(progress, [0, 1], [start.x, end.x]),
    top: interpolate(progress, [0, 1], [start.y, end.y]),
  };
}

function getSpiralDecoration(
  progress: number,
  start: SharedElementRect,
  end: SharedElementRect
): SharedElementTransitionDecoration {
  const linear = getLinearGeometry(progress, start, end);
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const angle = progress * Math.PI * 2;
  const radius = distance * 0.18 * Math.sin(progress * Math.PI);

  return {
    left: linear.left + Math.cos(angle) * radius,
    top: linear.top + Math.sin(angle) * radius,
    transform: [{ rotate: `${progress * Math.PI * 2}rad` }],
  };
}

function getDecoration(
  preset: SharedElementTransitionPreset,
  progress: number,
  start: SharedElementRect,
  end: SharedElementRect
): SharedElementTransitionDecoration | undefined {
  if (typeof preset === 'function') {
    return preset({ progress, start, end });
  }

  return preset === 'spiral'
    ? getSpiralDecoration(progress, start, end)
    : getLinearGeometry(progress, start, end);
}

export function useSharedElementTransitionStyle(
  progress: SharedValue<number>,
  start: SharedValue<SharedElementRect | null> | undefined,
  end: SharedValue<SharedElementRect | null> | undefined,
  preset: SharedElementTransitionPreset,
  mode: 'resize' | 'zoom',
  revision: number
) {
  return useAnimatedStyle(() => {
    const startRect = start?.value;
    const endRect = end?.value;

    if (!startRect || !endRect) return { opacity: 0 };

    const value = progress.value;
    const decoration = getDecoration(preset, value, startRect, endRect) ?? {};
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
  }, [mode, preset, revision]);
}
