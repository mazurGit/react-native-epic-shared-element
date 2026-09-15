import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { SharedElementTransitionProps } from '../common/types';
import { SharedElementTransition } from './shared-element-transition';

export type SharedElementTransitionDescriptor = SharedElementTransitionProps & {
  key: string;
};

export type SharedElementTransitionLayerProps = PropsWithChildren<{
  /** Whether transition copies are mounted. Set to false only at an endpoint. */
  active: boolean;
  transitions: readonly SharedElementTransitionDescriptor[];
  style?: StyleProp<ViewStyle>;
}>;

/**
 * Renders transition copies in an overlay only while a transition is active.
 * Progress lifecycle remains controlled by the consumer, so the layer is not
 * coupled to navigation, modals, or any other presentation system.
 */
export function SharedElementTransitionLayer({
  active,
  children,
  transitions = [],
  style,
}: SharedElementTransitionLayerProps) {
  return (
    <>
      {children}
      {active ? (
        <View pointerEvents="box-none" style={[styles.overlay, style]}>
          {transitions.map(({ key, ...transition }) => (
            <SharedElementTransition key={key} {...transition} />
          ))}
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: StyleSheet.absoluteFill,
});
