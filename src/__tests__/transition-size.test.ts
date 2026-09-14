import { describe, expect, it } from '@jest/globals';
import { getSharedElementSizeStyle } from '../common/transition-size';

// A row-stretched title grows in font size but has a narrower destination box.
const source = { x: 0, y: 0, width: 194, height: 32 };
const destination = { x: 0, y: 0, width: 90, height: 48 };

describe('text transitions', () => {
  it.each(['resize', 'zoom'] as const)(
    'preserves glyph proportions in %s mode despite conflicting box ratios',
    (mode) => {
      expect(
        getSharedElementSizeStyle(0, source, destination, mode, 'text')
          .transform
      ).toEqual([{ scale: 1 }]);
      expect(
        getSharedElementSizeStyle(0.5, source, destination, mode, 'text')
          .transform
      ).toEqual([{ scale: 1.25 }]);
      expect(
        getSharedElementSizeStyle(1, source, destination, mode, 'text')
          .transform
      ).toEqual([{ scale: 1.5 }]);
    }
  );

  it('keeps the source text layout instead of rewrapping to the destination box', () => {
    const style = getSharedElementSizeStyle(
      1,
      source,
      destination,
      'resize',
      'text'
    );
    expect(style.width).toBe(source.width);
    expect(style.height).toBe(source.height);
    expect(style.transformOrigin).toBe('top left');
  });

  it('uniformly scales down on the reverse transition', () => {
    const style = getSharedElementSizeStyle(
      1,
      destination,
      source,
      'zoom',
      'text'
    );
    expect(style.transform).toEqual([
      { scale: source.height / destination.height },
    ]);
  });

  it('retains independent axis scaling for ordinary views', () => {
    const style = getSharedElementSizeStyle(
      1,
      source,
      destination,
      'zoom',
      'view'
    );
    expect(style.transform).toEqual([
      { scaleX: destination.width / source.width },
      { scaleY: destination.height / source.height },
    ]);
  });

  it('retains layout resizing for ordinary views', () => {
    const style = getSharedElementSizeStyle(
      1,
      source,
      destination,
      'resize',
      'view'
    );
    expect(style.width).toBe(destination.width);
    expect(style.height).toBe(destination.height);
    expect(style.transform).toBeUndefined();
  });
});
