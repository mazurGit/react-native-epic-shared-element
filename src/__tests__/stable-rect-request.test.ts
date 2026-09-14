import { describe, expect, it, jest } from '@jest/globals';
import { createStableRectRequest } from '../common/stable-rect-request';
import type { StableRectSnapshot } from '../common/types';

describe('stable rect measurement requests', () => {
  const rect = { x: 20, y: 40, width: 100, height: 100 };

  it('returns one atomic snapshot after every endpoint responds', () => {
    const snapshots: StableRectSnapshot[] = [];
    const request = createStableRectRequest(7, ['start', 'end'], complete);

    function complete(snapshot: StableRectSnapshot) {
      snapshots.push(snapshot);
    }

    request.accept('start', 7, rect);
    expect(snapshots).toHaveLength(0);
    request.accept('end', 7, { ...rect, y: 80 });

    expect(snapshots).toHaveLength(1);
    expect([...snapshots[0]!]).toEqual([
      ['start', rect],
      ['end', { ...rect, y: 80 }],
    ]);
  });

  it('ignores stale responses from another request', () => {
    const complete = jest.fn();
    const request = createStableRectRequest(8, ['end'], complete);

    request.accept('end', 7, rect);
    expect(complete).not.toHaveBeenCalled();
    request.accept('end', 8, rect);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it.each([null, { ...rect, width: 0 }, { ...rect, x: NaN }])(
    'ignores invalid geometry: %p',
    (invalidRect) => {
      const complete = jest.fn();
      const request = createStableRectRequest(9, ['end'], complete);

      if (invalidRect) request.accept('end', 9, invalidRect);
      expect(complete).not.toHaveBeenCalled();
      request.accept('end', 9, rect);
      expect(complete).toHaveBeenCalledTimes(1);
    }
  );

  it('does not complete after cancellation', () => {
    const complete = jest.fn();
    const request = createStableRectRequest(10, ['end'], complete);
    request.cancel();
    request.accept('end', 10, rect);
    expect(complete).not.toHaveBeenCalled();
  });

  it('deduplicates ids and completes an empty request immediately', () => {
    const duplicateComplete = jest.fn();
    const duplicateRequest = createStableRectRequest(
      11,
      ['end', 'end'],
      duplicateComplete
    );
    duplicateRequest.accept('end', 11, rect);
    expect(duplicateComplete).toHaveBeenCalledTimes(1);

    const emptyComplete = jest.fn();
    createStableRectRequest(12, [], emptyComplete);
    expect(emptyComplete).toHaveBeenCalledWith(new Map());
  });
});
