import type { ReactElement } from 'react';
import type { ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

export interface SharedElementRect {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius?: number;
}

export interface SharedElementFrameChangeEvent {
  previous: SharedElementRect | null;
  current: SharedElementRect;
  framesDiff: number;
}

export interface SharedElementSettledEvent {
  current: SharedElementRect;
  framesCount: number;
}

export interface SharedElementNode {
  id: string;
  rect: SharedValue<SharedElementRect | null>;
  visibility: SharedValue<number>;
}

export interface SharedElementTransitionProps {
  startId: string;
  endId: string;
  progress: SharedValue<number>;
  children?: ReactElement;
  element?: ReactElement;
  clip?: boolean;
  transition?: SharedElementTransitionConfig;
}

export interface SharedElementTransitionPresetContext {
  progress: number;
  start: SharedElementRect;
  end: SharedElementRect;
}

export type SharedElementTransitionDecoration = Pick<
  ViewStyle,
  'opacity' | 'transform' | 'transformOrigin'
> & {
  left?: number;
  top?: number;
};

export type SharedElementTransitionGeometry = SharedElementTransitionStyle;

export type SharedElementTransitionProjection = (
  context: SharedElementTransitionPresetContext
) => SharedElementTransitionDecoration | undefined;
export type SharedElementTransitionTrajectory =
  SharedElementTransitionProjection;
export type SharedElementTransitionStyle = (
  context: SharedElementTransitionPresetContext
) =>
  | (SharedElementTransitionDecoration &
      Partial<Pick<ViewStyle, 'width' | 'height'>>)
  | undefined;
export type SharedElementTransitionConfig = SharedElementTransitionStyle;
