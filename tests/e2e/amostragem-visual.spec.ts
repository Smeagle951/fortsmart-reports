import { test, expect } from '@playwright/test';

test('snapshot visual do relatório de amostragem', async ({ page }) => {
  await page.goto('/qa/amostragem-preview');
  await page.setViewportSize({ width: 1440, height: 1800 });
  await expect(page).toHaveScreenshot('amostragem-preview.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.03,
  });
});

