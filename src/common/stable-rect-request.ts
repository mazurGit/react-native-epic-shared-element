import type { SharedElementRect, StableRectSnapshot } from './types';

export function createStableRectRequest(
  requestId: number,
  ids: readonly string[],
  onComplete: (snapshot: StableRectSnapshot) => void
) {
  const requestedIds = new Set(ids);
  const pending = new Set(ids);
  const rects = new Map<string, SharedElementRect>();
  let cancelled = false;

  const completeIfReady = () => {
    if (cancelled || pending.size > 0) return;
    cancelled = true;
    onComplete(new Map(rects));
  };

  completeIfReady();
  return {
    ids: requestedIds,
    accept(id: string, responseRequestId: number, rect: SharedElementRect) {
      if (
        cancelled ||
        responseRequestId !== requestId ||
        !requestedIds.has(id) ||
        ![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) ||
        rect.width <= 0 ||
        rect.height <= 0
      )
        return;
      rects.set(id, rect);
      pending.delete(id);
      completeIfReady();
    },
    cancel() {
      cancelled = true;
    },
  };
}
