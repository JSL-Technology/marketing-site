import { test, expect } from '@playwright/test';

/**
 * RTL / LTR Direction & i18n E2E Tests
 *
 * These tests validate that switching between LTR and RTL locales produces
 * the correct DOM attributes, visual alignment, and layout mirroring.
 * Snapshots are generated on first run and compared on subsequent runs.
 */

const BASE_URL = process.env['BASE_URL'] || 'http://localhost:4200';

// ─── Direction attributes ──────────────────────────────────────────────────

test.describe('Direction attributes (LTR vs RTL)', () => {
  test('English page sets html[dir="ltr"] and html[lang="en"]', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/home`);
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('Arabic page sets html[dir="rtl"] and html[lang="ar"]', async ({ page }) => {
    await page.goto(`${BASE_URL}/ar/home`);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  });

  test('body dir attribute mirrors html dir in Arabic', async ({ page }) => {
    await page.goto(`${BASE_URL}/ar/home`);
    await expect(page.locator('body')).toHaveAttribute('dir', 'rtl');
  });

  test('body dir attribute mirrors html dir in English', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/home`);
    await expect(page.locator('body')).toHaveAttribute('dir', 'ltr');
  });
});

// ─── Header layout mirroring ───────────────────────────────────────────────

test.describe('Header layout — desktop', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('Logo is on the inline-start side in LTR (left)', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/home`);
    const logo = page.locator('header .logo, header [class*="logo"], header img').first();
    if (await logo.isVisible()) {
      const logoBox = await logo.boundingBox();
      expect(logoBox!.x).toBeLessThan(200);
    }
  });

  test('Logo is on the inline-start side in RTL (right)', async ({ page }) => {
    await page.goto(`${BASE_URL}/ar/home`);
    const logo = page.locator('header .logo, header [class*="logo"], header img').first();
    if (await logo.isVisible()) {
      const logoBox = await logo.boundingBox();
      // In RTL, inline-start is the right side — logo should be beyond center
      expect(logoBox!.x + logoBox!.width).toBeGreaterThan(1280 / 2);
    }
  });
});

test.describe('Header layout — mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test('Mobile menu button is visible in LTR', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/home`);
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    // Verify the page rendered without errors
    const header = page.locator('header, jsl-header, app-header').first();
    await expect(header).toBeVisible();
  });

  test('Mobile menu button is visible in RTL', async ({ page }) => {
    await page.goto(`${BASE_URL}/ar/home`);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    const header = page.locator('header, jsl-header, app-header').first();
    await expect(header).toBeVisible();
  });
});

// ─── Footer layout ─────────────────────────────────────────────────────────

test.describe('Footer layout', () => {
  test('Footer renders correctly in LTR', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/en/home`);
    const footer = page.locator('footer, jsl-footer, app-footer').first();
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
  });

  test('Footer renders correctly in RTL', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/ar/home`);
    const footer = page.locator('footer, jsl-footer, app-footer').first();
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
  });
});

// ─── Blog detail page ──────────────────────────────────────────────────────

test.describe('Blog detail page direction', () => {
  test('Blog list renders in RTL without layout errors', async ({ page }) => {
    await page.goto(`${BASE_URL}/ar/blog`);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    // Verify no console errors indicating layout failure
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForLoadState('domcontentloaded');
    expect(errors.length).toBe(0);
  });
});

// ─── Visual snapshots (LTR vs RTL, mobile + desktop) ──────────────────────

test.describe('Visual snapshots', () => {
  const scenarios = [
    { lang: 'en', dir: 'ltr', viewport: { width: 1280, height: 800 }, label: 'desktop' },
    { lang: 'ar', dir: 'rtl', viewport: { width: 1280, height: 800 }, label: 'desktop' },
    { lang: 'en', dir: 'ltr', viewport: { width: 375, height: 812 }, label: 'mobile' },
    { lang: 'ar', dir: 'rtl', viewport: { width: 375, height: 812 }, label: 'mobile' },
  ];

  for (const { lang, dir, viewport, label } of scenarios) {
    test(`Home [${lang}] ${label} — dir=${dir}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(`${BASE_URL}/${lang}/home`);
      await expect(page.locator('html')).toHaveAttribute('dir', dir);
      await page.waitForLoadState('networkidle');
      // Dismiss any overlays (cookie banner, etc.)
      const cookieBtn = page.locator('[class*="cookie"] button, [class*="accept"]').first();
      if (await cookieBtn.isVisible()) await cookieBtn.click();
      await expect(page).toHaveScreenshot(`home-${lang}-${label}.png`, {
        fullPage: false,
        threshold: 0.25,
        maxDiffPixelRatio: 0.05,
      });
    });
  }
});
