import {
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { createStableRectWaiter } from '../common/stable-rects';

describe('shared-element layout readiness', () => {
  let frames: Map<number, (time: number) => void>;
  let nextId: number;
  const rect = { x: 20, y: 40, width: 100, height: 100 };
  const advanceFrame = () => {
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach((callback) => callback(0));
  };

  beforeEach(() => {
    frames = new Map();
    nextId = 0;
    jest
      .spyOn(global, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        frames.set(++nextId, callback);
        return nextId;
      });
    jest.spyOn(global, 'cancelAnimationFrame').mockImplementation((id) => {
      if (id != null) frames.delete(id);
    });
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('waits for both endpoints and restarts stability when coordinates change', () => {
    const ready = jest.fn();
    const waiter = createStableRectWaiter(['start', 'end'], ready);
    waiter.update('start', rect);
    advanceFrame();
    advanceFrame();
    expect(ready).not.toHaveBeenCalled();
    waiter.update('end', rect);
    advanceFrame();
    waiter.update('end', { ...rect, y: 80 });
    advanceFrame();
    expect(ready).not.toHaveBeenCalled();
    advanceFrame();
    expect(ready).toHaveBeenCalledTimes(1);
    waiter.update('end', { ...rect, y: 120 });
    advanceFrame();
    advanceFrame();
    expect(ready).toHaveBeenCalledTimes(1);
  });

  it('ignores repeated identical measurements without postponing readiness', () => {
    const ready = jest.fn();
    const waiter = createStableRectWaiter(['end'], ready);
    waiter.update('end', rect);
    advanceFrame();
    waiter.update('end', { ...rect });
    advanceFrame();
    expect(ready).toHaveBeenCalledTimes(1);
  });

  it.each([null, { ...rect, width: 0 }, { ...rect, x: NaN }])(
    'does not release invalid or unregistered geometry: %p',
    (invalidRect) => {
      const ready = jest.fn();
      const waiter = createStableRectWaiter(['end'], ready);
      waiter.update('end', rect);
      advanceFrame();
      waiter.update('end', invalidRect);
      advanceFrame();
      advanceFrame();
      expect(ready).not.toHaveBeenCalled();
      waiter.update('end', rect);
      advanceFrame();
      advanceFrame();
      expect(ready).toHaveBeenCalledTimes(1);
    }
  );

  it('cancels pending completion when the consumer cancels', () => {
    const ready = jest.fn();
    const waiter = createStableRectWaiter(['end'], ready);
    waiter.update('end', rect);
    advanceFrame();
    waiter.cancel();
    advanceFrame();
    expect(ready).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });

  it('releases an empty set of requested elements', () => {
    const ready = jest.fn();
    createStableRectWaiter([], ready);
    advanceFrame();
    advanceFrame();
    expect(ready).toHaveBeenCalledTimes(1);
  });
});
