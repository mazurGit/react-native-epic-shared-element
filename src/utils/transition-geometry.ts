import type { SharedElementTransitionGeometry } from '../common/types';
import { Extrapolation, interpolate } from 'react-native-reanimated';

export const Geometry = {
  resize: (({ progress, start, end }) => {
    'worklet';
    const t = interpolate(progress, [0, 1], [0, 1], Extrapolation.CLAMP);
    return {
      width: start.width + (end.width - start.width) * t,
      height: start.height + (end.height - start.height) * t,
    };
  }) satisfies SharedElementTransitionGeometry,
  zoom: (({ progress, start, end }) => {
    'worklet';
    const t = interpolate(progress, [0, 1], [0, 1], Extrapolation.CLAMP);
    return {
      width: start.width,
      height: start.height,
      transformOrigin: 'top left',
      transform: [
        { scaleX: 1 + (end.width / start.width - 1) * t },
        { scaleY: 1 + (end.height / start.height - 1) * t },
      ],
    };
  }) satisfies SharedElementTransitionGeometry,
  aspectResizeWidth: (({ progress, start, end }) => {
    'worklet';
    const t = interpolate(progress, [0, 1], [0, 1], Extrapolation.CLAMP);
    const width = start.width + (end.width - start.width) * t;
    return {
      width,
      height: width * (start.height / start.width),
    };
  }) satisfies SharedElementTransitionGeometry,
  aspectResizeHeight: (({ progress, start, end }) => {
    'worklet';
    const t = interpolate(progress, [0, 1], [0, 1], Extrapolation.CLAMP);
    const height = start.height + (end.height - start.height) * t;
    return {
      width: height * (start.width / start.height),
      height,
    };
  }) satisfies SharedElementTransitionGeometry,
};
