/// <reference types="detox" />

import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve as pathResolve } from 'node:path';
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
    await device.disableSynchronization();
    await element(by.text('Expand artwork')).tap();
    await new Promise((resolve) => setTimeout(resolve, 300));
    const midTransitionScreenshot = await device.takeScreenshot(
      'shared-element-mid-transition'
    );
    const screenshotPath = pathResolve(
      __dirname,
      '../artifacts/shared-element-mid-transition.png'
    );
    mkdirSync(dirname(screenshotPath), { recursive: true });
    copyFileSync(midTransitionScreenshot, screenshotPath);
    console.log(`Mid-transition screenshot: ${midTransitionScreenshot}`);
    await device.enableSynchronization();
    await expect(element(by.text('Reset transition'))).toBeVisible();
    await expect(element(by.id('destination-artwork'))).toBeVisible();

    await element(by.text('Reset transition')).tap();
    await expect(element(by.text('Expand artwork'))).toBeVisible();
  });
});
