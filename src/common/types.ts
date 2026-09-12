import type { ReactElement } from 'react';
import type { ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

export interface SharedElementRect {
  x: number;
  y: number;
  width: number;
  height: number;
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
  clip?: boolean;
  preset?: SharedElementTransitionPreset;
  mode?: 'resize' | 'zoom';
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

export type SharedElementTransitionPreset =
  | 'linear'
  | 'spiral'
  | ((
      context: SharedElementTransitionPresetContext
    ) => SharedElementTransitionDecoration | undefined);
