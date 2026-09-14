import {
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
  SharedElementContentType,
  SharedElementFrameChangeEvent,
  SharedElementNode,
  SharedElementRect,
  SharedElementSettledEvent,
} from '../common/types';

export interface SharedElementProps {
  id: string;
  contentType?: SharedElementContentType;
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
  contentType = 'view',
  borderRadius,
  throttle = 16,
  trackFrame = false,
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
  const elementRef = useRef(children);
  elementRef.current = children;
  const visibilityStyle = useAnimatedStyle(() => ({
    opacity: visibility.value,
  }));

  useLayoutEffect(() => {
    const node: SharedElementNode = {
      id,
      rect,
      visibility,
      contentType,
    };
    nodeRef.current = node;
    register(node, elementRef.current);
    return () => {
      if (nodeRef.current === node) nodeRef.current = null;
      unregister(node);
    };
  }, [contentType, id, rect, register, unregister, visibility]);
  useEffect(() => {
    const node = nodeRef.current;
    if (node) updateElement(node, children);
  }, [children, updateElement]);

  const handleFrame = useCallback(
    (event: NativeSyntheticEvent<SharedElementFrameChangeEvent>) => {
      const node = nodeRef.current;
      if (node) updateRect(node, event.nativeEvent.current);
      onFrameChange?.(event.nativeEvent);
    },
    [onFrameChange, updateRect]
  );
  const handleFrameSettled = useCallback(
    (event: NativeSyntheticEvent<SharedElementSettledEvent>) => {
      const node = nodeRef.current;
      if (node) markSettled(node, event.nativeEvent.current);
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
      {children}
    </AnimatedNativeSharedElement>
  );
}

const AnimatedNativeSharedElement =
  Animated.createAnimatedComponent(NativeSharedElement);
