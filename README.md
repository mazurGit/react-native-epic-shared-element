# react-native-epic-shared-element

Native shared-element measurements and Reanimated transitions for React Native.

## Installation

```bash
npm install react-native-epic-shared-element react-native-reanimated react-native-worklets
```

## Usage

```tsx
import {
  SharedElement,
  SharedElementHost,
  SharedElementProvider,
  SharedElementTransition,
  sharedElementTransitionPresets,
} from 'react-native-epic-shared-element';
import { useSharedValue } from 'react-native-reanimated';

export function Screen() {
  const progress = useSharedValue(0);
  return (
    <SharedElementProvider>
      <SharedElementHost style={{ flex: 1 }}>
        <SharedElement id="cover-small">
          <Image source={cover} style={styles.smallCover} />
        </SharedElement>
        <SharedElementTransition
          startId="cover-small"
          endId="cover-large"
          progress={progress}
          mode="zoom"
          transition={sharedElementTransitionPresets.linear}
        />
        <SharedElement id="cover-large">
          <Image source={cover} style={styles.largeCover} />
        </SharedElement>
      </SharedElementHost>
    </SharedElementProvider>
  );
}
```

`progress` is a Reanimated `SharedValue<number>` in the range `0..1`. `mode` controls the base size behavior: `resize` interpolates the frame from A to B, while `zoom` keeps the source frame and scales it. `transition` is a callback configuration; built-in configurations are available as `sharedElementTransitionPresets.linear` and `sharedElementTransitionPresets.spiral`.

Custom presets receive the current progress and both measured frames. They may return `opacity`, `transform`, `left`, or `top`; width and height remain controlled by `mode`:

```tsx
<SharedElementTransition
  startId="cover-small"
  endId="cover-large"
  progress={progress}
  mode="resize"
  transition={({ progress: t, start, end }) => {
    'worklet';
    return {
      left: start.x + (end.x - start.x) * t,
      top: start.y + (end.y - start.y) * t - Math.sin(t * Math.PI) * 24,
      transform: [{ rotate: `${t * Math.PI}rad` }],
    };
  }}
/>
```

Set `clip={false}` to disable clipping.

`SharedElementHost` defines the coordinate space. The native view measures each element relative to that host on iOS and Android. Enable `trackFrame` when an element moves during a transition; `throttle` controls measurement frequency in milliseconds.

## API

- `SharedElementProvider` — owns the element registry.
- `SharedElementHost` — defines the native ancestor used for measurements.
- `SharedElement` — registers and measures an element.
- `SharedElementTransition` — renders the animated element between two IDs.

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
