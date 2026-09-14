import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentRef,
  type PropsWithChildren,
} from 'react';
import {
  findNodeHandle,
  StyleSheet,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { SharedElementHostContext } from '../context/shared-element-host-context';

export interface SharedElementHostProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
}

export const SharedElementHost = forwardRef<
  ComponentRef<typeof View>,
  PropsWithChildren<SharedElementHostProps>
>(({ children, style, ...viewProps }, forwardedRef) => {
  const hostRef = useRef<ComponentRef<typeof View>>(null);
  const [hostTag, setHostTag] = useState<number | null>(null);
  useLayoutEffect(() => {
    const tag = findNodeHandle(hostRef.current);
    if (tag != null) setHostTag(tag);
  }, []);
  useImperativeHandle(
    forwardedRef,
    () => hostRef.current as ComponentRef<typeof View>
  );

  return (
    <SharedElementHostContext.Provider value={hostTag}>
      <View
        ref={hostRef}
        style={[StyleSheet.absoluteFill, style]}
        {...viewProps}
        collapsable={false}
      >
        {children}
      </View>
    </SharedElementHostContext.Provider>
  );
});
SharedElementHost.displayName = 'SharedElementHost';
