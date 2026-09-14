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
import type { SharedElementNode, SharedElementRect } from '../common/types';
import { createInitialRectWaiter } from '../common/initial-rects';

export type SharedElementProviderProps = PropsWithChildren;

export function SharedElementProvider({
  children,
}: SharedElementProviderProps) {
  const [revision, setRevision] = useState(0);
  const nodes = useRef(new Map<string, SharedElementNode>());
  const elements = useRef(new Map<string, ReactElement>());
  const waiters = useRef(new Set<ReturnType<typeof createInitialRectWaiter>>());
  useEffect(
    () => () => {
      waiters.current.forEach((waiter) => waiter.cancel());
      waiters.current.clear();
    },
    []
  );
  const waitForStableRects = useCallback(
    (ids: readonly string[], callback: () => void) => {
      if (ids.length === 0) {
        callback();
        return () => {};
      }
      const waiter = createInitialRectWaiter(ids, () => {
        waiters.current.delete(waiter);
        callback();
      });
      waiters.current.add(waiter);
      ids.forEach((id) =>
        waiter.update(id, nodes.current.get(id)?.settled ?? false)
      );
      return () => {
        waiter.cancel();
        waiters.current.delete(waiter);
      };
    },
    []
  );

  const register = useCallback(
    (node: SharedElementNode, element: ReactElement) => {
      const existing = nodes.current.get(node.id);
      if (existing && existing !== node) return;
      nodes.current.set(node.id, node);
      waiters.current.forEach((waiter) => waiter.update(node.id, node.settled));
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
  const markSettled = useCallback(
    (node: SharedElementNode, rect: SharedElementRect) => {
      if (nodes.current.get(node.id) !== node) return;
      node.rect.value = rect;
      node.settled = true;
      waiters.current.forEach((waiter) => waiter.update(node.id, true));
    },
    []
  );
  const unregister = useCallback((node: SharedElementNode) => {
    if (nodes.current.get(node.id) !== node) return;
    nodes.current.delete(node.id);
    waiters.current.forEach((waiter) => waiter.update(node.id, false));
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
      markSettled,
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
      markSettled,
      waitForStableRects,
    ]
  );

  return (
    <SharedElementContext.Provider value={value}>
      {children}
    </SharedElementContext.Provider>
  );
}
