import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactElement,
} from 'react';
import {
  Text,
  type HostInstance,
  type NativeSyntheticEvent,
  type StyleProp,
  type TextLayoutEvent,
  type TextProps,
  type TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { SharedElementHostContext } from '../context/shared-element-host-context';
import { useSharedElementRegistry } from '../hooks/use-shared-element-registry';
import { NativeSharedElement } from '../native/epic-shared-element';
import type { SharedElementProps } from './shared-element';
import type {
  SharedElementFrameChangeEvent,
  SharedElementNode,
  SharedElementRect,
  SharedElementSettledEvent,
} from '../common/types';

export type SharedTextProps = Omit<SharedElementProps, 'style'> &
  Omit<TextProps, 'id'> & {
    style?: StyleProp<TextStyle>;
  };

export const SharedText = forwardRef<HostInstance, SharedTextProps>(
  (
    {
      id,
      borderRadius,
      throttle = 16,
      trackFrame = true,
      onFrameChange,
      onFrameSettled,
      pointerEvents,
      style,
      onTextLayout,
      ...textProps
    },
    ref
  ) => {
    const { register, updateElement, updateRect, markSettled, unregister } =
      useSharedElementRegistry();
    const ancestorTag = useContext(SharedElementHostContext);
    if (ancestorTag === undefined) {
      throw new Error('SharedText must be rendered inside a SharedElementHost');
    }

    const rect = useSharedValue<SharedElementRect | null>(null);
    const visibility = useSharedValue(1);
    const nodeRef = useRef<SharedElementNode | null>(null);
    const frameRef = useRef<SharedElementRect | null>(null);
    const textSizeRef = useRef<SharedTextSize | null>(null);
    const elementRef = useRef<ReactElement | null>(null);
    const visibilityStyle = useAnimatedStyle(() => ({
      opacity: visibility.value,
    }));

    const applyTextSize = useCallback((frame: SharedElementRect) => {
      const textSize = textSizeRef.current;
      return textSize ? { ...frame, ...textSize } : frame;
    }, []);
    const handleFrame = useCallback(
      (event: NativeSyntheticEvent<SharedElementFrameChangeEvent>) => {
        const node = nodeRef.current;
        const current = applyTextSize(event.nativeEvent.current);
        frameRef.current = event.nativeEvent.current;
        if (node) updateRect(node, current);
        onFrameChange?.(event.nativeEvent);
      },
      [applyTextSize, onFrameChange, updateRect]
    );
    const handleFrameSettled = useCallback(
      (event: NativeSyntheticEvent<SharedElementSettledEvent>) => {
        const node = nodeRef.current;
        const current = applyTextSize(event.nativeEvent.current);
        frameRef.current = event.nativeEvent.current;
        if (node) markSettled(node, current);
        onFrameSettled?.(event.nativeEvent);
      },
      [applyTextSize, markSettled, onFrameSettled]
    );
    const handleTextLayout = useCallback(
      (event: TextLayoutEvent) => {
        onTextLayout?.(event);
        textSizeRef.current = measureTextLayout(event);
        const node = nodeRef.current;
        const frame = frameRef.current;
        if (node && frame) updateRect(node, applyTextSize(frame));
      },
      [applyTextSize, onTextLayout, updateRect]
    );

    const textElement = useMemo(
      () => (
        <Text
          {...textProps}
          ref={ref}
          style={style}
          onTextLayout={handleTextLayout}
        />
      ),
      [handleTextLayout, ref, style, textProps]
    );
    elementRef.current = textElement;

    useLayoutEffect(() => {
      frameRef.current = null;
      textSizeRef.current = null;
      const node: SharedElementNode = {
        id,
        rect,
        visibility,
      };
      nodeRef.current = node;
      register(node, elementRef.current as ReactElement);
      return () => {
        if (nodeRef.current === node) nodeRef.current = null;
        unregister(node);
      };
    }, [id, rect, register, unregister, visibility]);
    useEffect(() => {
      const node = nodeRef.current;
      if (node) updateElement(node, textElement);
    }, [textElement, updateElement]);

    return (
      <AnimatedNativeSharedText
        collapsable={false}
        pointerEvents={pointerEvents}
        ancestorTag={ancestorTag ?? undefined}
        borderRadius={borderRadius}
        throttle={throttle}
        trackFrame={trackFrame}
        style={visibilityStyle}
        onFrameChange={handleFrame}
        onFrameSettled={handleFrameSettled}
      >
        {textElement}
      </AnimatedNativeSharedText>
    );
  }
);

SharedText.displayName = 'SharedText';

interface SharedTextSize {
  width: number;
  height: number;
}

function measureTextLayout(event: TextLayoutEvent): SharedTextSize | null {
  const { lines } = event.nativeEvent;
  if (lines.length === 0) return null;

  return {
    width: lines.reduce((max, line) => Math.max(max, line.width), 0),
    height: lines.reduce((max, line) => Math.max(max, line.y + line.height), 0),
  };
}

const AnimatedNativeSharedText =
  Animated.createAnimatedComponent(NativeSharedElement);
