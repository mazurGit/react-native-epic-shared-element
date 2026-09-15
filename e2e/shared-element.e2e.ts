/// <reference types="detox" />

import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve as pathResolve } from 'node:path';
import { beforeEach, describe, it } from '@jest/globals';

describe('shared element example', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('renders the gallery grid', async () => {
    await expect(element(by.text('Shared moments'))).toBeVisible();
    await expect(element(by.text('Aurora'))).toBeVisible();
    await expect(element(by.id('card-aurora'))).toBeVisible();
    await waitFor(element(by.id('source-settled-count')))
      .toHaveText('1')
      .withTimeout(3000);
  });

  it('reports frame changes without settling the same mount again', async () => {
    await element(by.id('gallery-scroll')).scroll(180, 'down');
    await waitFor(element(by.id('frame-change-observed')))
      .toHaveText('changed')
      .withTimeout(3000);
    await expect(element(by.id('source-settled-count'))).toHaveText('1');
  });

  it('opens the detail and closes it again', async () => {
    // --- Open the detail overlay ---
    await device.disableSynchronization();
    await element(by.id('card-aurora')).tap();
    await new Promise((resolve) => setTimeout(resolve, 350));
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
    await new Promise((resolve) => setTimeout(resolve, 400));
    await device.enableSynchronization();

    // The hero has landed — detail sheet is fully visible.
    await expect(element(by.id('destination-artwork'))).toBeVisible();
    await expect(element(by.id('detail-artist'))).toBeVisible();
    await expect(element(by.id('detail-settled-count'))).toHaveText('1');

    // --- Close the detail overlay ---
    // Disable sync so Detox does not hang on the Reanimated close animation
    // or the scheduled unmount that fires from the withTiming callback.
    await device.disableSynchronization();
    await element(by.id('close-detail')).tap();
    // Wait for the close animation (~620ms) plus the unmount to settle.
    await new Promise((resolve) => setTimeout(resolve, 800));
    await device.enableSynchronization();

    // The grid should be visible again with the Aurora card.
    await expect(element(by.id('card-aurora'))).toBeVisible();
  });
});
