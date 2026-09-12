import { cloneElement, type PropsWithChildren, type ReactElement } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  type SharedValue,
} from 'react-native-reanimated';
import { useSharedElementRegistry } from '../hooks/use-shared-element-registry';
import { useSharedElementTransitionStyle } from '../hooks/use-shared-element-transition-style';
import type { SharedElementTransitionProps } from '../common/types';
import { sharedElementTransitionPresets } from '../common/transition-presets';

const fadeStart = 0.01;
const fadeEnd = 0.015;
const destinationFadeStart = 1 - fadeEnd;
const destinationFadeEnd = 1 - fadeStart;

type TransitionElementProps = { style?: StyleProp<ViewStyle> };

export function SharedElementTransition(
  props: PropsWithChildren<SharedElementTransitionProps>
) {
  return <SharedElementTransitionView {...props} />;
}

export function SharedElementTransitionView({
  startId,
  endId,
  children,
  element,
  clip = true,
  transition = sharedElementTransitionPresets.linear,
  mode = 'zoom',
  progress,
}: SharedElementTransitionProps & { progress: SharedValue<number> }) {
  const { get, getElement, revision } = useSharedElementRegistry();
  const startNode = get(startId);
  const endNode = get(endId);
  const animatedStyle = useSharedElementTransitionStyle(
    progress,
    startNode?.rect,
    endNode?.rect,
    transition,
    mode,
    revision
  );
  const transitionElement = (element ??
    children ??
    getElement(startId) ??
    null) as ReactElement<TransitionElementProps> | null;
  const renderedTransitionElement = transitionElement
    ? cloneElement(transitionElement, {
        style: [transitionElement.props.style, styles.transitionElement],
      })
    : null;

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
      style={[styles.element, clip && styles.clipped, animatedStyle]}
    >
      {renderedTransitionElement}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  element: { position: 'absolute' },
  clipped: { overflow: 'hidden' },
  transitionElement: { width: '100%', height: '100%' },
});
