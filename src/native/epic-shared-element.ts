import {
  requireNativeComponent,
  type NativeSyntheticEvent,
  type ViewProps,
} from 'react-native';
import type {
  SharedElementFrameChangeEvent,
  SharedElementSettledEvent,
} from '../common/types';

export interface NativeSharedElementProps extends ViewProps {
  ancestorTag?: number;
  borderRadius?: number;
  throttle?: number;
  trackFrame?: boolean;
  onFrameChange?: (
    event: NativeSyntheticEvent<SharedElementFrameChangeEvent>
  ) => void;
  onFrameSettled?: (
    event: NativeSyntheticEvent<SharedElementSettledEvent>
  ) => void;
}

export const NativeSharedElement =
  requireNativeComponent<NativeSharedElementProps>('EpicSharedElementView');
