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

export interface SharedElementMeasurement extends SharedElementRect {
  requestId: number;
}

export interface MeasureStableRectsOptions {
  signal?: AbortSignal;
}

export type StableRectSnapshot = ReadonlyMap<string, SharedElementRect>;

export type SharedElementContentType = 'view' | 'text';

export interface SharedElementNode {
  id: string;
  rect: SharedValue<SharedElementRect | null>;
  requestMeasurement: (requestId: number) => void;
  completeMeasurement: (requestId: number) => void;
  visibility: SharedValue<number>;
  contentType?: SharedElementContentType;
}

export interface SharedElementTransitionProps {
  startId: string;
  endId: string;
  progress: SharedValue<number>;
  children?: ReactElement;
  element?: ReactElement;
  clip?: boolean;
  transition?: SharedElementTransitionConfig;
  mode?: 'resize' | 'zoom';
  /** Text preserves glyph proportions with uniform, height-based scaling. */
  contentType?: SharedElementContentType;
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

export type SharedElementTransitionConfig = (
  context: SharedElementTransitionPresetContext
) => SharedElementTransitionDecoration | undefined;
