import { test, expect } from '@playwright/test';

test.describe('Mobile Menu Advanced Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to a mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/es/home');
  });

  test('should open menu via button and restore focus on close', async ({ page }) => {
    const toggleBtn = page.locator('.header__mobile-toggle');
    const menu = page.locator('.header__nav-links-mobile');
    const closeBtn = page.locator('.mobile-close-btn');

    await toggleBtn.click();

    // The menu should be open
    await expect(menu).toHaveClass(/open/);
    await expect(closeBtn).toBeFocused();

    // Close menu
    await closeBtn.click();
    await expect(menu).not.toHaveClass(/open/);

    // Check focus restoration
    await expect(toggleBtn).toBeFocused();
  });

  test('should announce search results and no results via aria-live', async ({ page }) => {
    // Open menu
    await page.locator('.header__mobile-toggle').click();

    const searchInput = page.locator('.mobile-menu-search input');
    // Targeted locator for our live region
    const liveRegion = page.locator('.mobile-menu-content > [aria-live="polite"]');

    // Search for something existing
    await searchInput.fill('Servicios');
    // Wait for debounce and check live region content
    await page.waitForTimeout(600);
    const liveText = await liveRegion.textContent();
    expect(liveText).toContain('resultados');

    // Search for non-existent
    await searchInput.clear();
    await searchInput.fill('NonExistentLink123456');
    await page.waitForTimeout(600);
    const noResultsText = await liveRegion.textContent();
    expect(noResultsText?.length).toBeGreaterThan(0);
    await expect(page.locator('.mobile-menu-no-results')).toBeVisible();
  });

  test('should transition aria-expanded states when toggling sections', async ({ page }) => {
    await page.locator('.header__mobile-toggle').click();

    const sectionHeader = page.locator('.accordion-header').first();
    // Wait for menu to be ready
    await expect(sectionHeader).toBeVisible();

    const isExpandedBefore = await sectionHeader.getAttribute('aria-expanded');

    await sectionHeader.click();
    // Wait for animation/state change
    await page.waitForTimeout(300);
    const isExpandedAfter = await sectionHeader.getAttribute('aria-expanded');

    expect(isExpandedBefore).not.toBe(isExpandedAfter);
  });

  test('should maintain layout consistency after orientation change', async ({ page }) => {
    await page.locator('.header__mobile-toggle').click();
    const menu = page.locator('.header__nav-links-mobile');

    // Check width in portrait
    const portraitBox = await menu.boundingBox();
    expect(portraitBox?.width).toBeLessThanOrEqual(375 * 0.85 + 5);

    // Change to landscape
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(500); // Allow for transition

    const landscapeBox = await menu.boundingBox();
    // Should still be visible and respect max-width 380px
    expect(landscapeBox?.width).toBeLessThanOrEqual(380);
    await expect(menu).toBeVisible();
  });
});
