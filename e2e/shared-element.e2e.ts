/// <reference types="detox" />

import { beforeAll, describe, it } from '@jest/globals';

describe('shared element example', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('renders the initial source state', async () => {
    await expect(element(by.text('One element, two layouts.'))).toBeVisible();
    await expect(element(by.text('Expand artwork'))).toBeVisible();
    await expect(element(by.text('Aurora'))).toBeVisible();
  });

  it('expands and resets the shared element', async () => {
    await element(by.text('Expand artwork')).tap();
    await expect(element(by.text('Reset transition'))).toBeVisible();
    await expect(element(by.id('destination-artwork'))).toBeVisible();

    await element(by.text('Reset transition')).tap();
    await expect(element(by.text('Expand artwork'))).toBeVisible();
  });
});
