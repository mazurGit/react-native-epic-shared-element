import { createContext, type ReactElement } from 'react';
import type {
  MeasureStableRectsOptions,
  SharedElementNode,
  SharedElementRect,
  StableRectSnapshot,
} from '../common/types';

export interface SharedElementRegistryValue {
  get: (id: string) => SharedElementNode | undefined;
  getElement: (id: string) => ReactElement | undefined;
  register: (node: SharedElementNode, element: ReactElement) => void;
  updateElement: (node: SharedElementNode, element: ReactElement) => void;
  updateRect: (node: SharedElementNode, rect: SharedElementRect) => void;
  measurementReady: (
    node: SharedElementNode,
    rect: SharedElementRect,
    requestId: number
  ) => void;
  unregister: (node: SharedElementNode) => void;
  measureStableRects: (
    ids: readonly string[],
    options?: MeasureStableRectsOptions
  ) => Promise<StableRectSnapshot>;
  waitForStableRects: (
    ids: readonly string[],
    callback: () => void
  ) => () => void;
  revision: number;
}

export const SharedElementContext =
  createContext<SharedElementRegistryValue | null>(null);
