import { describe, expect, it, jest } from '@jest/globals';
import { Children, isValidElement } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { SharedElementTransitionLayer } from '../components/shared-element-transition-layer';

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'AnimatedView' },
  Extrapolation: { CLAMP: 'clamp' },
  interpolate: jest.fn(),
  useAnimatedReaction: jest.fn(),
  useAnimatedStyle: jest.fn(),
}));

const transition = {
  key: 'artwork',
  startId: 'artwork-small',
  endId: 'artwork-large',
  progress: { value: 0 } as SharedValue<number>,
} as const;

describe('SharedElementTransitionLayer', () => {
  it('does not mount its overlay at an endpoint', () => {
    const tree = SharedElementTransitionLayer({
      active: false,
      transitions: [transition],
      children: 'content',
    });

    const children = Children.toArray(tree.props.children);
    expect(children).toEqual(['content']);
  });

  it('mounts one transition copy per descriptor while active', () => {
    const tree = SharedElementTransitionLayer({
      active: true,
      transitions: [transition, { ...transition, key: 'second' }],
      children: 'content',
    });

    const children = Children.toArray(tree.props.children);
    const overlay = children[1];
    expect(isValidElement(overlay)).toBe(true);
    if (!isValidElement<{ children: unknown }>(overlay)) return;

    expect(Children.count(overlay.props.children)).toBe(2);
  });
});
