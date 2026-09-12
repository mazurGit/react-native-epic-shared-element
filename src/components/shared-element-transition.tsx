import { type PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  type SharedValue,
} from 'react-native-reanimated';
import { useSharedElementRegistry } from '../hooks/use-shared-element-registry';
import { useSharedElementResizeStyle } from '../hooks/use-shared-element-resize-style';
import { useSharedElementZoomStyle } from '../hooks/use-shared-element-zoom-style';
import type { SharedElementTransitionProps } from '../common/types';

const fadeStart = 0.01;
const fadeEnd = 0.015;
const destinationFadeStart = 1 - fadeEnd;
const destinationFadeEnd = 1 - fadeStart;

export function SharedElementTransition(
  props: PropsWithChildren<SharedElementTransitionProps>
) {
  return <SharedElementTransitionView {...props} />;
}

export function SharedElementTransitionView({
  startId,
  endId,
  children,
  clip = true,
  mode = 'zoom',
  progress,
}: SharedElementTransitionProps & { progress: SharedValue<number> }) {
  const { get, getElement, revision } = useSharedElementRegistry();
  const startNode = get(startId);
  const endNode = get(endId);
  const resizeStyle = useSharedElementResizeStyle(
    progress,
    startNode?.rect,
    endNode?.rect,
    revision
  );
  const zoomStyle = useSharedElementZoomStyle(
    progress,
    startNode?.rect,
    endNode?.rect,
    revision
  );
  const transitionElement = children ?? getElement(startId) ?? null;

  useAnimatedReaction(
    () => ({ value: progress.value }),
    ({ value }) => {
      if (startNode?.visibility)
        startNode.visibility.value = interpolate(
          value,
          [0, fadeStart, fadeEnd],
          [1, 1, 0],
          Extrapolation.CLAMP
        );
      if (endNode?.visibility)
        endNode.visibility.value = interpolate(
          value,
          [0, destinationFadeStart, destinationFadeEnd],
          [0, 0, 1],
          Extrapolation.CLAMP
        );
    },
    [revision]
  );

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.element,
        clip && styles.clipped,
        mode === 'zoom' ? zoomStyle : resizeStyle,
      ]}
    >
      {transitionElement}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  element: { position: 'absolute' },
  clipped: { overflow: 'hidden' },
});
