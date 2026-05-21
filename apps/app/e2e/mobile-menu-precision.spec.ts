import { test, expect } from '@playwright/test';

test.describe('Mobile Menu Gesture Precision', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to a mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/es/home');
  });

  test('should NOT open menu on ambiguous diagonal swipe (vertical preference)', async ({ page }) => {
    // Perform diagonal move: more vertical than horizontal (dy > dx)
    // dx=30, dy=100 -> absDiffY (100) > absDiffX (30) * 1.2
    await page.mouse.move(5, 100);
    await page.mouse.down();
    await page.mouse.move(35, 200, { steps: 10 });
    await page.mouse.up();

    const menu = page.locator('.header__nav-links-mobile');
    // Ensure it didn't open
    await expect(menu).not.toHaveClass(/open/);
  });

  test('should open menu on clean horizontal swipe', async ({ page }) => {
    // dx=150, dy=10 -> horizontal enough
    await page.mouse.move(5, 150);
    await page.mouse.down();
    await page.mouse.move(155, 160, { steps: 10 });
    await page.mouse.up();

    const menu = page.locator('.header__nav-links-mobile');
    await expect(menu).toHaveClass(/open/);
  });

  test('should NOT open menu on high-velocity swipe in WRONG direction (edge-swipe)', async ({ page }) => {
    // Start at edge, move LEFT (wrong direction for LTR opening)
    await page.mouse.move(10, 100);
    await page.mouse.down();
    await page.mouse.move(-50, 100, { steps: 2 }); // Fast move to the left
    await page.mouse.up();

    const menu = page.locator('.header__nav-links-mobile');
    await expect(menu).not.toHaveClass(/open/);
  });

  test('should NOT close on very slow tap in overlay', async ({ page }) => {
    // Open menu first
    await page.locator('.header__mobile-toggle').click();
    const menu = page.locator('.header__nav-links-mobile');
    await expect(menu).toHaveClass(/open/);

    const overlay = page.locator('.jsl-mm-overlay');
    await expect(overlay).toBeVisible();

    // Simulate very slow tap (> GESTURE_TAP_TIMEOUT_MS)
    // Click on the right side (15% area) to ensure we hit the overlay
    const x = 350;
    const y = 300;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.waitForTimeout(300); // Exceed GESTURE_TAP_TIMEOUT_MS (220ms)
    await page.mouse.up();

    // Should still be open
    await expect(menu).toHaveClass(/open/);
  });

  test('should close on quick tap in overlay', async ({ page }) => {
    await page.locator('.header__mobile-toggle').click();
    const menu = page.locator('.header__nav-links-mobile');
    // Wait for animation to finish
    await page.waitForTimeout(600);
    await expect(menu).toHaveClass(/open/);

    const overlay = page.locator('.jsl-mm-overlay');
    await expect(overlay).toBeVisible();

    // Standard click is fast
    // Use evaluate to click so it's precisely where we want and fast
    await page.evaluate(() => {
        const overlay = document.querySelector('.jsl-mm-overlay') as HTMLElement;
        if (overlay) {
            const common = { bubbles: true, cancelable: true, isPrimary: true, pointerId: 1, pointerType: 'touch' };
            overlay.dispatchEvent(new PointerEvent('pointerdown', { ...common, clientX: 350, clientY: 300 }));
            overlay.dispatchEvent(new PointerEvent('pointerup',   { ...common, clientX: 350, clientY: 300 }));
        }
    });

    // Allow for closing animation
    await page.waitForTimeout(600);
    await expect(menu).not.toHaveClass(/open/);
  });

  test('should ignore gestures during cooldown after opening', async ({ page }) => {
    const toggle = page.locator('.header__mobile-toggle');
    await toggle.click();

    const menu = page.locator('.header__nav-links-mobile');
    // Wait a bit but stay within MenuService cooldown (400ms)
    await page.waitForTimeout(100);
    await expect(menu).toHaveClass(/open/);

    // Try to swipe back closed immediately (within MenuService cooldown 400ms)
    await page.evaluate(() => {
      const overlay = document.querySelector('.jsl-mm-overlay');
      if (overlay) {
        // Use a high pointerId to avoid conflicts
        const common = { bubbles: true, cancelable: true, isPrimary: true, pointerId: 999, pointerType: 'touch' };
        overlay.dispatchEvent(new PointerEvent('pointerdown', { ...common, clientX: 300, clientY: 200 }));
        // Move enough to exceed thresholds
        overlay.dispatchEvent(new PointerEvent('pointermove', { ...common, clientX: 100, clientY: 200 }));
        overlay.dispatchEvent(new PointerEvent('pointerup',   { ...common, clientX: 100, clientY: 200 }));
      }
    });

    // Should still be open because the immediate gesture was ignored by MenuService cooldown.
    await expect(menu).toHaveClass(/open/);
    await expect(menu).not.toHaveClass(/dragging/);

    // Wait for cooldown to expire (400ms)
    await page.waitForTimeout(500);

    // Now it should work (close via tap on overlay)
    await page.evaluate(() => {
        const overlay = document.querySelector('.jsl-mm-overlay') as HTMLElement;
        if (overlay) {
            const common = { bubbles: true, cancelable: true, isPrimary: true, pointerId: 1, pointerType: 'touch' };
            overlay.dispatchEvent(new PointerEvent('pointerdown', { ...common, clientX: 350, clientY: 300 }));
            overlay.dispatchEvent(new PointerEvent('pointerup',   { ...common, clientX: 350, clientY: 300 }));
        }
    });
    // Allow for closing animation
    await page.waitForTimeout(600);
    await expect(menu).not.toHaveClass(/open/);
  });

  test('should respect RTL swipe direction (edge-swipe)', async ({ page }) => {
    // Switch to Arabic (RTL)
    await page.goto('/ar/home');
    await page.setViewportSize({ width: 375, height: 667 });

    const menu = page.locator('.header__nav-links-mobile');

    // Edge-swipe from RIGHT to LEFT to open in RTL
    const width = 375;
    await page.mouse.move(width - 5, 100);
    await page.mouse.down();
    await page.mouse.move(width - 155, 100, { steps: 10 });
    await page.mouse.up();

    await expect(menu).toHaveClass(/open/);
  });
});
