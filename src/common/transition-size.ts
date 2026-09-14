import type { ViewStyle } from 'react-native';
import type { SharedElementContentType, SharedElementRect } from './types';

export function getSharedElementSizeStyle(
  progress: number,
  start: SharedElementRect,
  end: SharedElementRect,
  mode: 'resize' | 'zoom',
  contentType: SharedElementContentType
): ViewStyle {
  'worklet';

  if (contentType === 'text') {
    // Text wrappers often stretch to the available row width. That width is
    // not the glyph width, so independent X/Y scaling distorts the letters.
    // Keep the original text layout while interpolating its visual height.
    return {
      width: start.width,
      height: start.height,
      transformOrigin: 'top left',
      transform: [{ scale: 1 + (end.height / start.height - 1) * progress }],
    };
  }

  if (mode === 'zoom') {
    return {
      width: start.width,
      height: start.height,
      transformOrigin: 'top left',
      transform: [
        { scaleX: 1 + (end.width / start.width - 1) * progress },
        { scaleY: 1 + (end.height / start.height - 1) * progress },
      ],
    };
  }

  return {
    width: start.width + (end.width - start.width) * progress,
    height: start.height + (end.height - start.height) * progress,
  };
}
