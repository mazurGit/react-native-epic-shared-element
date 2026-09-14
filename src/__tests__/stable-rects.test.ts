import { describe, expect, it, jest } from '@jest/globals';
import { createStableRectWaiter } from '../common/stable-rects';

describe('shared-element layout readiness', () => {
  const rect = { x: 20, y: 40, width: 100, height: 100 };

  it('waits until native measurement confirms every endpoint', () => {
    const ready = jest.fn();
    const waiter = createStableRectWaiter(['start', 'end'], ready);

    waiter.update('start', rect, true);
    waiter.update('end', rect, false);
    expect(ready).not.toHaveBeenCalled();

    waiter.update('end', { ...rect, y: 80 }, true);
    expect(ready).toHaveBeenCalledTimes(1);
  });

  it('revokes readiness when native measurement becomes unstable', () => {
    const ready = jest.fn();
    const waiter = createStableRectWaiter(['start', 'end'], ready);

    waiter.update('start', rect, true);
    waiter.update('start', { ...rect, y: 60 }, false);
    waiter.update('end', rect, true);
    expect(ready).not.toHaveBeenCalled();

    waiter.update('start', { ...rect, y: 60 }, true);
    expect(ready).toHaveBeenCalledTimes(1);
  });

  it.each([null, { ...rect, width: 0 }, { ...rect, x: NaN }])(
    'does not release invalid or unregistered geometry: %p',
    (invalidRect) => {
      const ready = jest.fn();
      const waiter = createStableRectWaiter(['end'], ready);

      waiter.update('end', invalidRect, true);
      expect(ready).not.toHaveBeenCalled();
      waiter.update('end', rect, true);
      expect(ready).toHaveBeenCalledTimes(1);
    }
  );

  it('cancels pending completion', () => {
    const ready = jest.fn();
    const waiter = createStableRectWaiter(['end'], ready);
    waiter.cancel();
    waiter.update('end', rect, true);
    expect(ready).not.toHaveBeenCalled();
  });

  it('releases an empty set immediately', () => {
    const ready = jest.fn();
    createStableRectWaiter([], ready);
    expect(ready).toHaveBeenCalledTimes(1);
  });
});
