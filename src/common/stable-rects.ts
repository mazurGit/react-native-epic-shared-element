import type { SharedElementRect } from './types';

/** Releases a waiter after native measurement confirms every requested layout. */
export function createStableRectWaiter(
  ids: readonly string[],
  callback: () => void
) {
  const pending = new Set(ids);
  let cancelled = false;
  const requestedIds = new Set(ids);
  const completeIfReady = () => {
    if (pending.size || cancelled) return;
    cancelled = true;
    callback();
  };

  completeIfReady();
  return {
    update(id: string, rect: SharedElementRect | null, stable: boolean) {
      if (cancelled || !requestedIds.has(id)) return;
      if (
        !rect ||
        ![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) ||
        rect.width <= 0 ||
        rect.height <= 0
      ) {
        pending.add(id);
        return;
      }
      if (stable) pending.delete(id);
      else pending.add(id);
      completeIfReady();
    },
    cancel() {
      cancelled = true;
    },
  };
}
