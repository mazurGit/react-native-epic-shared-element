# React Native Epic Shared Element

A **native**, **lightweight**, and **customizable** shared-element transition
library for React Native.
It measures views on iOS and Android, then animates their geometry with
`react-native-reanimated`.

---

## ✨ Features

- 🎯 Native frame measurement on iOS and Android
- 🎯 Smooth size and position interpolation between two elements
- 🎯 Composable geometry and trajectory presets
- 🎯 Built-in presets: `linear`, `spiral`, `slingshot`, `arc`, `swoosh`, and `portalWarp`
- 🎯 Custom transition presets with worklet support
- 🎯 Optional border-radius interpolation
- 🎯 Custom transition elements
- 🎯 Configurable clipping and frame tracking
- 🎯 TypeScript support out of the box
- 🎯 Compatible with React Native New Architecture

---

## 🎥 Demo

The repository includes a complete example gallery in [`example/src/App.tsx`](example/src/App.tsx).
It demonstrates multiple transition presets, native measurements, custom radii,
and transitions between different element sizes.

<p align="center">
  <img src="docs/demo-transition-linear.gif" alt="Shared element transition" width="220" />
  <img src="docs/demo-transition-presets.gif" alt="Shared element presets" width="220" />
</p>

To run the example:

```bash
yarn install
yarn example ios
```

or

```bash
yarn example android
```

---

## 📦 Installation

```bash
npm install react-native-epic-shared-element react-native-reanimated react-native-worklets
```

or

```bash
yarn add react-native-epic-shared-element react-native-reanimated react-native-worklets
```

> **Note:**
> Make sure `react-native-reanimated` and `react-native-worklets` are configured
> according to their installation guides.

---

## 🚀 Basic Usage

```tsx
import { useCallback, useState } from 'react';
import { Button, Image } from 'react-native';
import {
  SharedElement,
  SharedElementHost,
  SharedElementPresets,
  SharedElementProvider,
  SharedElementTransitionLayer,
} from 'react-native-epic-shared-element';
import {
  ReduceMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const artwork = require('./artwork.png');

export function Screen() {
  const progress = useSharedValue(0);
  const [transitionActive, setTransitionActive] = useState(false);

  const open = useCallback(() => {
    setTransitionActive(true);
    progress.value = withTiming(
      1,
      { duration: 620, reduceMotion: ReduceMotion.Never },
      (finished) => {
        if (finished) scheduleOnRN(setTransitionActive, false);
      }
    );
  }, [progress]);

  return (
    <SharedElementProvider>
      <SharedElementHost style={{ flex: 1 }}>
        <SharedElementTransitionLayer
          active={transitionActive}
          transitions={[
            {
              key: 'artwork',
              startId: 'artwork-small',
              endId: 'artwork-large',
              progress,
              transition: SharedElementPresets
                .geometry('resize')
                .trajectory('linear'),
            },
          ]}
        >
          <Button title="Open artwork" onPress={open} />

          <SharedElement id="artwork-small" borderRadius={24}>
            <Image source={artwork} style={{ width: 120, height: 120 }} />
          </SharedElement>

          <SharedElement id="artwork-large" borderRadius={8}>
            <Image source={artwork} style={{ width: 320, height: 420 }} />
          </SharedElement>
        </SharedElementTransitionLayer>
      </SharedElementHost>
    </SharedElementProvider>
  );
}
```

`progress` is a Reanimated `SharedValue<number>` in the range `0..1`.
The `SharedElementHost` defines the coordinate space used by native
measurements.

The component reads `progress`; the application owns the animation that updates
it. Use `reduceMotion: ReduceMotion.Never` on that animation when the shared
element transition must remain animated while the device's reduced-motion
setting is enabled.

`SharedElementTransitionLayer` mounts transition copies above its children only
while `active` is true. Set it to true before animating away from either endpoint,
then set it to false after `progress` reaches `0` or `1`. This keeps completed
transition copies out of the view tree and supports multiple simultaneous shared
elements through the `transitions` array. `SharedElementTransition` remains
available when the consumer needs to manage placement and mounting directly.

Every `SharedElement` must be inside a `SharedElementHost`. Native measurements
are layout coordinates relative to that host: ancestor translations/scales used
for presentation are excluded, while scroll offsets inside the host are included.
The host is kept in the native view hierarchy on both Fabric and Paper. Until its
native ref is ready, no measurement is emitted; there is no fallback to window
coordinates. Render the transition overlay at the host's origin. If elements use
different hosts, their origins and coordinate units must be aligned by the caller.

`onFrameChange` reports only delivered geometry changes. Its event contains the
previous and current rect plus `framesDiff`, the number of sampled native display
frames since the previous delivered change. `onFrameSettled` fires once per native
view, when its initial rect remains unchanged for two consecutive display frames.
By default, measurement continues after the initial settle so scrolling and other
ancestor layout changes keep the rect current. Set `trackFrame={false}` to stop
continuous measurement; it resumes for one sample after a later element layout.

`useSharedElementRegistry().waitForStableRects(ids, callback)` remains available
to coordinate the initial settle of several elements. It returns a cancellation
function and does not drive animations or navigation.

### Text content

The library does not infer text layout. Choose a geometry preset or provide a
custom geometry callback that matches the content you are animating.

---

## 🎨 Transition Presets

Built-in presets are available from `SharedElementPresets`:

```tsx
<SharedElementTransition
  startId="artwork-small"
  endId="artwork-large"
  progress={progress}
  transition={SharedElementPresets.geometry('resize').trajectory('spiral')}
/>
```

Available presets:

| Preset       | Description                                     |
| :----------- | :---------------------------------------------- |
| `linear`     | Direct interpolation from source to destination |
| `spiral`     | Curved movement with rotation                   |
| `slingshot`  | Accelerated movement with an overshooting arc   |
| `arc`        | Arc movement with subtle scale and rotation     |
| `swoosh`     | Bézier swoosh path                              |
| `portalWarp` | Bézier path with scale and opacity distortion   |

### Custom preset

Custom presets are worklet callbacks. The transition controls the element size;
your preset can customize position, transforms, and opacity:

```tsx
const customPreset = ({ progress: t, start, end }) => {
  'worklet';

  return {
    left: start.x + (end.x - start.x) * t,
    top: start.y + (end.y - start.y) * t - Math.sin(t * Math.PI) * 24,
    transform: [{ rotate: `${t * Math.PI}rad` }],
  };
};

<SharedElementTransition
  startId="artwork-small"
  endId="artwork-large"
  progress={progress}
  transition={SharedElementPresets.geometry('resize').trajectory(customPreset)}
/>;
```

---

## ⚙️ API

### `SharedElement`

| Prop           | Type      | Default | Description                                          |
| :------------- | :-------- | :------ | :--------------------------------------------------- |
| `id`           | `string`  | —       | Unique identifier used by the transition             |
| `borderRadius` | `number`  | —       | Native border radius, interpolated during transition |
| `trackFrame`   | `boolean` | `true`  | Continuously measure a moving element                |
| `throttle`     | `number`  | `16`    | Frame measurement interval in milliseconds           |

### `SharedElementTransition`

| Prop         | Type                            | Default  | Description                                         |
| :----------- | :------------------------------ | :------- | :-------------------------------------------------- |
| `startId`    | `string`                        | —        | Source shared-element ID                            |
| `endId`      | `string`                        | —        | Destination shared-element ID                       |
| `progress`   | `SharedValue<number>`           | —        | Transition progress from `0` to `1`                 |
| `transition` | `SharedElementTransitionConfig` | `resize + linear` | Geometry and projection preset          |
| `clip`       | `boolean`                       | `true`   | Clips the transition element to its animated bounds |
| `element`    | `ReactElement`                  | —        | Custom element rendered during the transition       |

Position and `borderRadius` are interpolated from source to destination by
default. Size remains at the source dimensions unless a geometry preset is used.
Compose geometry and trajectory independently:

```tsx
transition={SharedElementPresets.geometry('resize').trajectory('arc')}
```

Geometry presets are `resize`, `zoom`, `aspectResizeWidth`, and
`aspectResizeHeight`; trajectory presets are `linear`,
`spiral`, `slingshot`, `arc`, `swoosh`, and `portalWarp`.

You can also pass the transition element as a child:

```tsx
<SharedElementTransition
  startId="artwork-small"
  endId="artwork-large"
  progress={progress}
  element={<Image source={artwork} />}
/>
```

### `SharedElementTransitionLayer`

| Prop          | Type                                           | Default | Description                                      |
| :------------ | :--------------------------------------------- | :------ | :----------------------------------------------- |
| `active`      | `boolean`                                      | —       | Mounts transition copies while an animation runs |
| `transitions` | `readonly SharedElementTransitionDescriptor[]` | —       | Transition props plus a unique React `key`       |
| `style`       | `StyleProp<ViewStyle>`                         | —       | Optional style for the absolute overlay          |
| `children`    | `ReactNode`                                    | —       | Content rendered below the transition overlay    |

Keep the layer inside the same `SharedElementHost` as both endpoints. The layer
uses that host's coordinate space and renders its overlay after `children`, so
transition copies appear above the presented content.

---

## 🛠 Requirements

- React Native >= 0.71
- `react-native-reanimated` >= 3.16
- `react-native-worklets` >= 0.5
- iOS and Android

---

## 🤝 Contributing

We welcome contributions!
Please read the [Contributing Guide](CONTRIBUTING.md) to learn how to help
improve Epic Shared Element.

---

## 📄 License

MIT License © 2024 [Oleh Mazur](https://github.com/mazurGit)

---

> Built with ❤️ using [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
