import { test, expect } from '@playwright/test';

test.describe('Mobile Menu E2E', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should open menu and trap focus', async ({ page }) => {
    await page.goto('/en/home');
    await page.waitForLoadState('networkidle');

    // Open menu
    const menuBtn = page.locator('button[aria-label*="Menu"], .header__mobile-toggle').first();
    await menuBtn.click();

    const drawer = page.locator('.header__nav-links-mobile');
    await expect(drawer).toBeVisible();

    // Trap focus
    await page.keyboard.press('Tab');
    const closeBtn = page.locator('.mobile-close-btn');
    await expect(closeBtn).toBeFocused();

    // Close on Escape
    await page.keyboard.press('Escape');
    await expect(drawer).not.toHaveClass(/open/);
  });
});
