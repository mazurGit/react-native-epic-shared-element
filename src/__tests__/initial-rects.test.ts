import { describe, expect, it, jest } from '@jest/globals';
import { createInitialRectWaiter } from '../utils/initial-rects';

describe('initial shared-element readiness', () => {
  it('waits until every requested element has settled', () => {
    const ready = jest.fn();
    const waiter = createInitialRectWaiter(['start', 'end'], ready);

    waiter.update('start', true);
    waiter.update('end', false);
    expect(ready).not.toHaveBeenCalled();
    waiter.update('end', true);
    expect(ready).toHaveBeenCalledTimes(1);
  });

  it('handles unregistering before all elements settle', () => {
    const ready = jest.fn();
    const waiter = createInitialRectWaiter(['start', 'end'], ready);

    waiter.update('start', true);
    waiter.update('start', false);
    waiter.update('end', true);
    expect(ready).not.toHaveBeenCalled();
    waiter.update('start', true);
    expect(ready).toHaveBeenCalledTimes(1);
  });

  it('ignores unrelated ids and cancellation', () => {
    const ready = jest.fn();
    const waiter = createInitialRectWaiter(['end'], ready);

    waiter.update('other', true);
    waiter.cancel();
    waiter.update('end', true);
    expect(ready).not.toHaveBeenCalled();
  });

  it('deduplicates ids and releases an empty set immediately', () => {
    const duplicateReady = jest.fn();
    const duplicateWaiter = createInitialRectWaiter(
      ['end', 'end'],
      duplicateReady
    );
    duplicateWaiter.update('end', true);
    expect(duplicateReady).toHaveBeenCalledTimes(1);

    const emptyReady = jest.fn();
    createInitialRectWaiter([], emptyReady);
    expect(emptyReady).toHaveBeenCalledTimes(1);
  });
});
