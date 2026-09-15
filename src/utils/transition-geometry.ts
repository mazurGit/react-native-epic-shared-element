import type { SharedElementTransitionGeometry } from '../common/types';

export const Geometry = {
  resize: ({ progress, start, end }) => {
    'worklet';
    return {
      width: start.width + (end.width - start.width) * progress,
      height: start.height + (end.height - start.height) * progress,
    };
  },
  zoom: ({ progress, start, end }) => {
    'worklet';
    return {
      width: start.width,
      height: start.height,
      transformOrigin: 'top left',
      transform: [
        { scaleX: 1 + (end.width / start.width - 1) * progress },
        { scaleY: 1 + (end.height / start.height - 1) * progress },
      ],
    };
  },
  aspectResizeWidth: ({ progress, start, end }) => {
    'worklet';
    const width = start.width + (end.width - start.width) * progress;
    return {
      width,
      height: width * (start.height / start.width),
    };
  },
  aspectResizeHeight: ({ progress, start, end }) => {
    'worklet';
    const height = start.height + (end.height - start.height) * progress;
    return {
      width: height * (start.width / start.height),
      height,
    };
  },
  text: ({ progress, start, end }) => {
    'worklet';
    const height = start.height + (end.height - start.height) * progress;
    return {
      width: start.width,
      height: start.height,
      transformOrigin: 'top left',
      transform: [{ scale: height / start.height }],
    };
  },
} satisfies Record<string, SharedElementTransitionGeometry>;
