import type { SharedElementRect } from './types';

/** Releases a waiter only after all requested layouts settle for two frames. */
export function createStableRectWaiter(
  ids: readonly string[],
  callback: () => void
) {
  const pending = new Set(ids);
  const rects = new Map<string, SharedElementRect>();
  let frame: number | undefined;
  let cancelled = false;

  const cancelFrame = () => {
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
  };
  const schedule = () => {
    cancelFrame();
    if (pending.size || cancelled) return;
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        frame = undefined;
        if (cancelled) return;
        cancelled = true;
        callback();
      });
    });
  };

  schedule();
  return {
    update(id: string, rect: SharedElementRect | null) {
      if (cancelled || !ids.includes(id)) return;
      if (
        !rect ||
        ![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) ||
        rect.width <= 0 ||
        rect.height <= 0
      ) {
        rects.delete(id);
        pending.add(id);
        cancelFrame();
        return;
      }
      const previous = rects.get(id);
      if (
        previous?.x === rect.x &&
        previous.y === rect.y &&
        previous.width === rect.width &&
        previous.height === rect.height &&
        previous.borderRadius === rect.borderRadius
      )
        return;
      rects.set(id, rect);
      pending.delete(id);
      schedule();
    },
    cancel() {
      cancelled = true;
      cancelFrame();
    },
  };
}
