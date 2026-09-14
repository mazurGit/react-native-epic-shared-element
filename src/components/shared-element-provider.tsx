import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import type { ReactElement } from 'react';
import { SharedElementContext } from '../context/shared-element-context';
import type {
  MeasureStableRectsOptions,
  SharedElementNode,
  SharedElementRect,
  StableRectSnapshot,
} from '../common/types';
import { createStableRectRequest } from '../common/stable-rect-request';

export type SharedElementProviderProps = PropsWithChildren;

type PendingRequest = ReturnType<typeof createStableRectRequest> & {
  abort: () => void;
  dispose: () => void;
};

export function SharedElementProvider({
  children,
}: SharedElementProviderProps) {
  const [revision, setRevision] = useState(0);
  const nodes = useRef(new Map<string, SharedElementNode>());
  const elements = useRef(new Map<string, ReactElement>());
  const nextRequestId = useRef(0);
  const requests = useRef(new Map<number, PendingRequest>());
  useEffect(
    () => () => {
      requests.current.forEach((request) => request.dispose());
      requests.current.clear();
    },
    []
  );
  const measureStableRects = useCallback(
    (ids: readonly string[], options?: MeasureStableRectsOptions) =>
      new Promise<StableRectSnapshot>((resolve, reject) => {
        const uniqueIds = [...new Set(ids)];
        if (uniqueIds.length === 0) {
          resolve(new Map());
          return;
        }
        const requestId = ++nextRequestId.current;
        const rejectAsAborted = () => {
          options?.signal?.removeEventListener('abort', abort);
          requests.current.delete(requestId);
          const error = new Error('Stable rect measurement was aborted');
          error.name = 'AbortError';
          reject(error);
        };
        const abort = () => {
          const request = requests.current.get(requestId);
          request?.cancel();
          request?.ids.forEach((id) =>
            nodes.current.get(id)?.completeMeasurement(requestId)
          );
          rejectAsAborted();
        };
        if (options?.signal?.aborted) {
          abort();
          return;
        }
        const request = Object.assign(
          createStableRectRequest(requestId, uniqueIds, (snapshot) => {
            requests.current.delete(requestId);
            options?.signal?.removeEventListener('abort', abort);
            resolve(snapshot);
          }),
          {
            abort,
            dispose() {
              requests.current.get(requestId)?.cancel();
              rejectAsAborted();
            },
          }
        );
        requests.current.set(requestId, request);
        options?.signal?.addEventListener('abort', abort, { once: true });
        uniqueIds.forEach((id) =>
          nodes.current.get(id)?.requestMeasurement(requestId)
        );
      }),
    []
  );
  const waitForStableRects = useCallback(
    (ids: readonly string[], callback: () => void) => {
      const controller = new AbortController();
      measureStableRects(ids, { signal: controller.signal }).then(
        callback,
        () => {}
      );
      return () => controller.abort();
    },
    [measureStableRects]
  );

  const register = useCallback(
    (node: SharedElementNode, element: ReactElement) => {
      const existing = nodes.current.get(node.id);
      if (existing && existing !== node) return;
      nodes.current.set(node.id, node);
      requests.current.forEach((request, requestId) => {
        if (request.ids.has(node.id)) node.requestMeasurement(requestId);
      });
      elements.current.set(node.id, element);
      setRevision((value) => value + 1);
    },
    []
  );
  const updateElement = useCallback(
    (node: SharedElementNode, element: ReactElement) => {
      if (nodes.current.get(node.id) === node)
        elements.current.set(node.id, element);
    },
    []
  );
  const updateRect = useCallback(
    (node: SharedElementNode, rect: SharedElementRect) => {
      if (nodes.current.get(node.id) !== node) return;
      node.rect.value = rect;
    },
    []
  );
  const measurementReady = useCallback(
    (node: SharedElementNode, rect: SharedElementRect, requestId: number) => {
      if (nodes.current.get(node.id) !== node) return;
      node.rect.value = rect;
      requests.current.get(requestId)?.accept(node.id, requestId, rect);
    },
    []
  );
  const unregister = useCallback((node: SharedElementNode) => {
    if (nodes.current.get(node.id) !== node) return;
    nodes.current.delete(node.id);
    elements.current.delete(node.id);
    setRevision((value) => value + 1);
  }, []);

  const value = useMemo(
    () => ({
      get: (id: string) => nodes.current.get(id),
      getElement: (id: string) => elements.current.get(id),
      register,
      updateElement,
      updateRect,
      measurementReady,
      measureStableRects,
      waitForStableRects,
      unregister,
      revision,
    }),
    [
      register,
      revision,
      unregister,
      updateElement,
      updateRect,
      measurementReady,
      measureStableRects,
      waitForStableRects,
    ]
  );

  return (
    <SharedElementContext.Provider value={value}>
      {children}
    </SharedElementContext.Provider>
  );
}
