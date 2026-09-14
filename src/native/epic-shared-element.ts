import {
  requireNativeComponent,
  type NativeSyntheticEvent,
  type ViewProps,
} from 'react-native';
import type {
  SharedElementMeasurement,
  SharedElementRect,
} from '../common/types';

export interface NativeSharedElementProps extends ViewProps {
  ancestorTag?: number;
  borderRadius?: number;
  throttle?: number;
  trackFrame?: boolean;
  measurementRequestId?: number;
  onFrame?: (event: NativeSyntheticEvent<SharedElementRect>) => void;
  onMeasurementReady?: (
    event: NativeSyntheticEvent<SharedElementMeasurement>
  ) => void;
}

export const NativeSharedElement =
  requireNativeComponent<NativeSharedElementProps>('EpicSharedElementView');
