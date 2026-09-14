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
  SharedElementNode,
  SharedElementRect,
} from '../common/types';

export interface SharedElementProps {
  id: string;
  contentType?: SharedElementContentType;
  borderRadius?: number;
  throttle?: number;
  trackFrame?: boolean;
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
  pointerEvents,
  style,
  children,
}: PropsWithChildren<SharedElementProps & { children: ReactElement }>) {
  const { register, updateElement, updateRect, unregister } =
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
  const visibilityStyle = useAnimatedStyle(() => ({
    opacity: visibility.value,
  }));

  useLayoutEffect(() => {
    const node: SharedElementNode = { id, rect, visibility, contentType };
    nodeRef.current = node;
    register(node, children);
    return () => {
      if (nodeRef.current === node) nodeRef.current = null;
      unregister(node);
    };
  }, [children, contentType, id, rect, register, unregister, visibility]);
  useEffect(() => {
    const node = nodeRef.current;
    if (node) updateElement(node, children);
  }, [children, updateElement]);

  const handleFrame = useCallback(
    (event: NativeSyntheticEvent<SharedElementRect>) => {
      const node = nodeRef.current;
      if (node) updateRect(node, event.nativeEvent);
    },
    [updateRect]
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
      onFrame={handleFrame}
    >
      {children}
    </AnimatedNativeSharedElement>
  );
}

const AnimatedNativeSharedElement =
  Animated.createAnimatedComponent(NativeSharedElement);
