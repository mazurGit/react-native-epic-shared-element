import type {
  SharedElementTransitionConfig,
  SharedElementTransitionDecoration,
} from './types';

const linear: SharedElementTransitionConfig = () => {
  'worklet';
  return undefined;
};

const spiral: SharedElementTransitionConfig = ({ progress, start, end }) => {
  'worklet';

  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const angle = progress * Math.PI * 2;
  const radius = distance * 0.18 * Math.sin(progress * Math.PI);
  const left = start.x + deltaX * progress;
  const top = start.y + deltaY * progress;

  return {
    left: left + Math.cos(angle) * radius,
    top: top + Math.sin(angle) * radius,
    transform: [{ rotate: `${angle}rad` }],
  } satisfies SharedElementTransitionDecoration;
};

export const sharedElementTransitionPresets = {
  linear,
  spiral,
} satisfies Record<string, SharedElementTransitionConfig>;
