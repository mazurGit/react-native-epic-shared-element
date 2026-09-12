import type {
  SharedElementTransitionConfig,
  SharedElementTransitionDecoration,
} from './types';

const linear: SharedElementTransitionConfig = ({ progress, start, end }) => {
  'worklet';

  return {
    left: start.x + (end.x - start.x) * progress,
    top: start.y + (end.y - start.y) * progress,
  };
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

const slingshot: SharedElementTransitionConfig = ({ progress, start, end }) => {
  'worklet';

  const startX = start.x + start.width / 2;
  const startY = start.y + start.height / 2;
  const deltaX = end.x + end.width / 2 - startX;
  const deltaY = end.y + end.height / 2 - startY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY) || 1;
  let travel = 0;
  let bend = 0;

  if (progress < 0.16) {
    const t = progress / 0.16;
    const ease = t * t * (3 - 2 * t);
    travel = -0.07 * ease;
  } else if (progress < 0.56) {
    const t = (progress - 0.16) / 0.4;
    const ease = t * t * (3 - 2 * t);
    travel = -0.07 + 0.65 * ease;
    bend = ease;
  } else {
    const t = (progress - 0.56) / 0.44;
    const ease = t * t * (3 - 2 * t);
    const spring =
      0.16 *
      Math.sin(t * Math.PI * 4) *
      Math.exp(-3 * t) *
      Math.sin(t * Math.PI) ** 2;
    travel = 0.58 + 0.42 * ease + spring;
    bend = 1 - ease;
  }

  const arcOffset = Math.min(90, distance * 0.24) * bend;
  const width = start.width + (end.width - start.width) * progress;
  const height = start.height + (end.height - start.height) * progress;

  return {
    left:
      startX + deltaX * travel - (deltaY / distance) * arcOffset - width / 2,
    top:
      startY + deltaY * travel + (deltaX / distance) * arcOffset - height / 2,
  };
};

const arc: SharedElementTransitionConfig = ({ progress, start, end }) => {
  'worklet';

  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY) || 1;
  const arcOffset = 140 * Math.sin(progress * Math.PI);
  const rotation = 0.18 * Math.sin(progress * Math.PI * 2);
  const scale = 1 + 0.06 * Math.sin(progress * Math.PI);

  return {
    left: start.x + deltaX * progress - (deltaY / distance) * arcOffset,
    top: start.y + deltaY * progress + (deltaX / distance) * arcOffset,
    transform: [{ scale }, { rotate: `${rotation}rad` }],
  };
};

const swoosh: SharedElementTransitionConfig = ({ progress, start, end }) => {
  'worklet';

  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY) || 1;
  const normalX = -deltaY / distance;
  const normalY = deltaX / distance;
  const control1X = start.x + deltaX * 0.16 + normalX * 220;
  const control1Y = start.y + deltaY * 0.16 + normalY * 220;
  const control2X = start.x + deltaX * 0.72 + normalX * 24;
  const control2Y = start.y + deltaY * 0.72 + normalY * 24;
  const inverseT = 1 - progress;

  return {
    left:
      inverseT ** 3 * start.x +
      3 * inverseT ** 2 * progress * control1X +
      3 * inverseT * progress ** 2 * control2X +
      progress ** 3 * end.x,
    top:
      inverseT ** 3 * start.y +
      3 * inverseT ** 2 * progress * control1Y +
      3 * inverseT * progress ** 2 * control2Y +
      progress ** 3 * end.y,
  };
};

const portalWarp: SharedElementTransitionConfig = ({
  progress,
  start,
  end,
}) => {
  'worklet';

  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY) || 1;
  const normalX = -deltaY / distance;
  const normalY = deltaX / distance;
  const control1X = start.x + deltaX * 0.2 + normalX * 180;
  const control1Y = start.y + deltaY * 0.2 + normalY * 180;
  const control2X = start.x + deltaX * 0.78 - normalX * 80;
  const control2Y = start.y + deltaY * 0.78 - normalY * 80;
  const inverseT = 1 - progress;
  const warp = Math.sin(progress * Math.PI);

  return {
    left:
      inverseT ** 3 * start.x +
      3 * inverseT ** 2 * progress * control1X +
      3 * inverseT * progress ** 2 * control2X +
      progress ** 3 * end.x,
    top:
      inverseT ** 3 * start.y +
      3 * inverseT ** 2 * progress * control1Y +
      3 * inverseT * progress ** 2 * control2Y +
      progress ** 3 * end.y,
    transform: [{ scaleX: 1 - 0.18 * warp }, { scaleY: 1 + 0.3 * warp }],
    opacity: 1 - 0.55 * warp,
  };
};

export const SharedElementPresets = {
  linear,
  spiral,
  slingshot,
  arc,
  swoosh,
  portalWarp,
} satisfies Record<string, SharedElementTransitionConfig>;
