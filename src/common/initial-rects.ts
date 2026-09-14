export function createInitialRectWaiter(
  ids: readonly string[],
  callback: () => void
) {
  const requestedIds = new Set(ids);
  const pending = new Set(ids);
  let cancelled = false;

  const completeIfReady = () => {
    if (cancelled || pending.size > 0) return;
    cancelled = true;
    callback();
  };

  completeIfReady();
  return {
    update(id: string, settled: boolean) {
      if (cancelled || !requestedIds.has(id)) return;
      if (settled) pending.delete(id);
      else pending.add(id);
      completeIfReady();
    },
    cancel() {
      cancelled = true;
    },
  };
}
