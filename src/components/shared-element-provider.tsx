import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import type { ReactElement } from 'react';
import { SharedElementContext } from '../context/shared-element-context';
import type { SharedElementNode, SharedElementRect } from '../common/types';

export type SharedElementProviderProps = PropsWithChildren;

export function SharedElementProvider({
  children,
}: SharedElementProviderProps) {
  const [revision, setRevision] = useState(0);
  const nodes = useRef(new Map<string, SharedElementNode>());
  const elements = useRef(new Map<string, ReactElement>());

  const register = useCallback(
    (node: SharedElementNode, element: ReactElement) => {
      const existing = nodes.current.get(node.id);
      if (existing && existing !== node) return;
      nodes.current.set(node.id, node);
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
      if (nodes.current.get(node.id) === node) node.rect.value = rect;
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
      unregister,
      revision,
    }),
    [register, revision, unregister, updateElement, updateRect]
  );

  return (
    <SharedElementContext.Provider value={value}>
      {children}
    </SharedElementContext.Provider>
  );
}
