import {
  cloneElement,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  type PropsWithChildren,
  type ReactElement,
} from 'react';
import {
  type NativeSyntheticEvent,
  type TextLayoutEvent,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { SharedElementHostContext } from '../context/shared-element-host-context';
import { useSharedElementRegistry } from '../hooks/use-shared-element-registry';
import { NativeSharedElement } from '../native/epic-shared-element';
import type {
  SharedElementFrameChangeEvent,
  SharedElementNode,
  SharedElementRect,
  SharedElementSettledEvent,
} from '../common/types';

export interface SharedElementProps {
  id: string;
  borderRadius?: number;
  throttle?: number;
  trackFrame?: boolean;
  onFrameChange?: (event: SharedElementFrameChangeEvent) => void;
  onFrameSettled?: (event: SharedElementSettledEvent) => void;
  pointerEvents?: ViewProps['pointerEvents'];
  style?: StyleProp<ViewStyle>;
}

export function SharedElement({
  children,
  ...props
}: PropsWithChildren<SharedElementProps & { children: ReactElement }>) {
  return <SharedElementView {...props}>{children}</SharedElementView>;
}

export function SharedElementView({
  id,
  borderRadius,
  throttle = 16,
  trackFrame = true,
  onFrameChange,
  onFrameSettled,
  pointerEvents,
  style,
  children,
}: PropsWithChildren<SharedElementProps & { children: ReactElement }>) {
  const { register, updateElement, updateRect, markSettled, unregister } =
    useSharedElementRegistry();
  const ancestorTag = useContext(SharedElementHostContext);
  if (ancestorTag === undefined) {
    throw new Error(
      'SharedElement must be rendered inside a SharedElementHost'
    );
  }
  const rect = useSharedValue<SharedElementRect | null>(null);
  const visibility = useSharedValue(1);
  const nodeRef = useRef<SharedElementNode | null>(null);
  const frameRef = useRef<SharedElementRect | null>(null);
  const textMetricsRef = useRef<
    Pick<SharedElementRect, 'contentWidth' | 'contentHeight'>
  >({});
  const elementRef = useRef(children);
  elementRef.current = children;
  const visibilityStyle = useAnimatedStyle(() => ({
    opacity: visibility.value,
  }));

  useLayoutEffect(() => {
    frameRef.current = null;
    textMetricsRef.current = {};
    const node: SharedElementNode = {
      id,
      rect,
      visibility,
    };
    nodeRef.current = node;
    register(node, elementRef.current);
    return () => {
      if (nodeRef.current === node) nodeRef.current = null;
      unregister(node);
    };
  }, [id, rect, register, unregister, visibility]);
  useEffect(() => {
    const node = nodeRef.current;
    if (node) updateElement(node, children);
  }, [children, updateElement]);

  const handleFrame = useCallback(
    (event: NativeSyntheticEvent<SharedElementFrameChangeEvent>) => {
      const node = nodeRef.current;
      const next = { ...event.nativeEvent.current, ...textMetricsRef.current };
      frameRef.current = next;
      if (node) updateRect(node, next);
      onFrameChange?.(event.nativeEvent);
    },
    [onFrameChange, updateRect]
  );
  const handleFrameSettled = useCallback(
    (event: NativeSyntheticEvent<SharedElementSettledEvent>) => {
      const node = nodeRef.current;
      const current = {
        ...event.nativeEvent.current,
        ...textMetricsRef.current,
      };
      frameRef.current = current;
      if (node) markSettled(node, current);
      onFrameSettled?.(event.nativeEvent);
    },
    [markSettled, onFrameSettled]
  );

  return (
    <AnimatedNativeSharedElement
      collapsable={false}
      pointerEvents={pointerEvents}
      ancestorTag={ancestorTag ?? undefined}
      borderRadius={borderRadius}
      throttle={throttle}
      trackFrame={trackFrame}
      style={[visibilityStyle, style]}
      onFrameChange={handleFrame}
      onFrameSettled={handleFrameSettled}
    >
      {cloneWithTextMetrics(children, (event) => {
        const node = nodeRef.current;
        const frame = frameRef.current;
        if (!node || !frame) return;
        const lines = event.nativeEvent.lines;
        const contentWidth = lines.reduce(
          (max, line) => Math.max(max, line.width),
          0
        );
        const contentHeight = lines.reduce(
          (max, line) => Math.max(max, line.y + line.height),
          0
        );
        textMetricsRef.current = { contentWidth, contentHeight };
        updateRect(node, { ...frame, contentWidth, contentHeight });
      })}
    </AnimatedNativeSharedElement>
  );
}

function cloneWithTextMetrics(
  child: ReactElement,
  onTextLayout: (
    event: NativeSyntheticEvent<TextLayoutEvent['nativeEvent']>
  ) => void
) {
  if (typeof child.type !== 'function') return child;
  return cloneElement(child, { onTextLayout } as never);
}

const AnimatedNativeSharedElement =
  Animated.createAnimatedComponent(NativeSharedElement);
