import { describe, expect, it } from '@jest/globals';
import { Projection as SharedElementPresets } from '../utils/transition-projection';
import type { SharedElementTransitionDecoration } from '../common/types';

const start = { x: 10, y: 20, width: 100, height: 120 };
const end = { x: 210, y: 320, width: 240, height: 280 };

// Utility: check that a decoration only contains allowed keys.
function expectValidDecoration(
  decoration: SharedElementTransitionDecoration | undefined
) {
  if (decoration === undefined) return;
  const allowed: (keyof SharedElementTransitionDecoration)[] = [
    'opacity',
    'transform',
    'transformOrigin',
    'left',
    'top',
  ];
  for (const key of Object.keys(decoration)) {
    expect(allowed).toContain(key);
  }
}

describe('SharedElementPresets.linear', () => {
  const transition = SharedElementPresets.linear;

  it('starts at the source frame', () => {
    expect(transition({ progress: 0, start, end })).toEqual({
      left: start.x,
      top: start.y,
    });
  });

  it('interpolates to the midpoint', () => {
    expect(transition({ progress: 0.5, start, end })).toEqual({
      left: 110,
      top: 170,
    });
  });

  it('ends at the destination frame', () => {
    expect(transition({ progress: 1, start, end })).toEqual({
      left: end.x,
      top: end.y,
    });
  });

  it('does not add a transform', () => {
    const result = transition({ progress: 0.5, start, end });
    expect(result).not.toHaveProperty('transform');
  });

  it('returns only allowed decoration keys', () => {
    for (const p of [0, 0.25, 0.5, 0.75, 1]) {
      expectValidDecoration(transition({ progress: p, start, end }));
    }
  });
});

describe('SharedElementPresets.spiral', () => {
  const transition = SharedElementPresets.spiral;

  it('anchors to the source at progress 0', () => {
    const atStart = transition({ progress: 0, start, end });
    expect(atStart?.left).toBe(start.x);
    expect(atStart?.top).toBe(start.y);
    expect(atStart?.transform).toEqual([{ rotate: '0rad' }]);
  });

  it('anchors to the destination at progress 1', () => {
    const atEnd = transition({ progress: 1, start, end });
    expect(atEnd?.left).toBe(end.x);
    expect(atEnd?.top).toBe(end.y);
    expect(atEnd?.transform).toEqual([{ rotate: `${Math.PI * 2}rad` }]);
  });

  it('travels along the interpolated spiral path at the midpoint', () => {
    const mid = transition({ progress: 0.5, start, end });
    // Reproduce the spiral formula at t=0.5:
    //   base = start + delta * 0.5
    //   angle = 0.5 * 2π = π
    //   radius = distance * 0.18 * sin(0.5 * π) = distance * 0.18
    //   left = baseLeft + cos(π) * radius = baseLeft - radius
    //   top  = baseTop  + sin(π) * radius ≈ baseTop (sin π ≈ 0)
    const angle = 0.5 * Math.PI * 2;
    const distance = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
    const radius = distance * 0.18 * Math.sin(0.5 * Math.PI);
    const baseLeft = start.x + (end.x - start.x) * 0.5;
    const baseTop = start.y + (end.y - start.y) * 0.5;
    expect(mid?.left).toBe(baseLeft + Math.cos(angle) * radius);
    expect(mid?.top).toBe(baseTop + Math.sin(angle) * radius);
  });

  it('produces a single rotate transform at every progress value', () => {
    for (const p of [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1]) {
      const result = transition({ progress: p, start, end });
      expect(result?.transform).toHaveLength(1);
      expect(result?.transform?.[0]).toHaveProperty('rotate');
    }
  });

  it('rotates by progress * 2π radians', () => {
    for (const p of [0.25, 0.5, 0.75]) {
      const result = transition({ progress: p, start, end });
      expect(result?.transform).toEqual([{ rotate: `${p * Math.PI * 2}rad` }]);
    }
  });

  it('returns only allowed decoration keys', () => {
    for (const p of [0, 0.25, 0.5, 0.75, 1]) {
      expectValidDecoration(transition({ progress: p, start, end }));
    }
  });

  it('handles identical start and end frames without NaN', () => {
    const same = { x: 50, y: 60, width: 100, height: 100 };
    const result = transition({ progress: 0.5, start: same, end: same });
    expect(result?.left).toBe(50);
    expect(result?.top).toBe(60);
    expect(Number.isNaN(result?.left ?? 0)).toBe(false);
    expect(Number.isNaN(result?.top ?? 0)).toBe(false);
  });
});

describe('SharedElementPresets', () => {
  it('exposes both linear and spiral presets', () => {
    expect(SharedElementPresets).toHaveProperty('linear');
    expect(SharedElementPresets).toHaveProperty('spiral');
    expect(typeof SharedElementPresets.linear).toBe('function');
    expect(typeof SharedElementPresets.spiral).toBe('function');
  });

  it.each(['slingshot', 'arc', 'swoosh', 'portalWarp'] as const)(
    'exposes the %s preset with source and destination anchors',
    (name) => {
      const transition = SharedElementPresets[name];
      const atStart = transition({ progress: 0, start, end });
      const atEnd = transition({ progress: 1, start, end });

      expect(atStart?.left).toBeCloseTo(start.x);
      expect(atStart?.top).toBeCloseTo(start.y);
      expect(atEnd?.left).toBeCloseTo(end.x);
      expect(atEnd?.top).toBeCloseTo(end.y);
    }
  );
});
