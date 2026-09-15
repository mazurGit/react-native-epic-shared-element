import type { SharedElementTransitionGeometry } from '../common/types';

export const Geometry = {
  resize: ({ progress, start, end }) => {
    'worklet';
    const t = progress;
    return {
      width: start.width + (end.width - start.width) * t,
      height: start.height + (end.height - start.height) * t,
    };
  },
  zoom: ({ progress, start, end }) => {
    'worklet';
    const t = progress;
    return {
      width: start.width,
      height: start.height,
      transformOrigin: 'top left',
      transform: [
        { scaleX: 1 + (end.width / start.width - 1) * t },
        { scaleY: 1 + (end.height / start.height - 1) * t },
      ],
    };
  },
  aspectResizeWidth: ({ progress, start, end }) => {
    'worklet';
    const t = progress;
    const width = start.width + (end.width - start.width) * t;
    return {
      width,
      height: width * (start.height / start.width),
    };
  },
  aspectResizeHeight: ({ progress, start, end }) => {
    'worklet';
    const t = progress;
    const height = start.height + (end.height - start.height) * t;
    return {
      width: height * (start.width / start.height),
      height,
    };
  },
  text: ({ progress, start, end }) => {
    'worklet';
    const t = progress;
    return {
      width: start.width,
      height: start.height,
      transformOrigin: 'top left',
      transform: [
        { scaleX: 1 + (end.width / start.width - 1) * t },
        { scaleY: 1 + (end.height / start.height - 1) * t },
      ],
    };
  },
} satisfies Record<string, SharedElementTransitionGeometry>;
