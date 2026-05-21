import { test, expect } from '@playwright/test';

test.describe('Language Switcher Modern UI', () => {

    test('should have premium styles on desktop', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/');

        // Find language trigger in the top bar
        const trigger = page.locator('.top-bar .lang-switcher__button');
        await trigger.click();

        // The container should be visible
        const container = page.locator('.top-bar .lang-switcher__container');
        await expect(container).toBeVisible();

        // Check for glassmorphism styles (blur)
        const styles = await container.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
                backdropFilter: computed.backdropFilter,
                backgroundColor: computed.backgroundColor,
                borderRadius: computed.borderRadius
            };
        });

        expect(styles.backdropFilter).toContain('blur');
        expect(styles.borderRadius).toBe('16px');

        // Screenshot for visual verification
        await page.screenshot({ path: 'reports/language-switcher-desktop-final.png' });
    });

    test('should show as a bottom sheet on mobile', async ({ page }) => {
        // Breakpoint is 992px, so 390px is definitely mobile
        await page.setViewportSize({ width: 390, height: 844 }); // iPhone 13
        await page.goto('/');

        // Screenshot before anything
        await page.screenshot({ path: 'reports/debug-mobile-1-initial.png' });

        // Dismiss cookie banner if present
        const cookieDecline = page.locator('.cookie-banner .btn-decline');
        if (await cookieDecline.isVisible({ timeout: 5000 }).catch(() => false)) {
            await cookieDecline.click();
            await page.waitForTimeout(500);
        }

        // Check triggers
        const triggers = page.locator('.lang-switcher__button');
        console.log(`Found ${await triggers.count()} language triggers`);

        // Open switcher from header mobile
        const mobileTrigger = page.locator('.header__mobile-lang-switcher .lang-switcher__button');
        await expect(mobileTrigger).toBeVisible({ timeout: 15000 });

        // Screenshot before click
        await page.screenshot({ path: 'reports/debug-mobile-2-before-click.png' });

        await mobileTrigger.click();

        // Wait for animation to settle
        await page.waitForTimeout(1000);

        // Take screenshot of mobile bottom sheet
        await page.screenshot({ path: 'reports/debug-mobile-3-after-click.png' });

        // Use bottom sheet for mobile
        const container = page.locator('.bottom-sheet-wrapper');
        console.log(`Found ${await container.count()} open containers`);

        // Check for "More languages" button
        const moreBtn = container.locator('.lang-switcher__more-toggle').first();
        await expect(moreBtn).toBeVisible({ timeout: 5000 });
        await moreBtn.click({ force: true });

        // Check if other languages appear and scroll is possible (visual check)
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'reports/debug-mobile-4-expanded.png' });
    });

    test('should toggle more languages', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/');

        await page.locator('.top-bar .lang-switcher__button').click();

        const container = page.locator('.top-bar .lang-switcher__container');
        const moreBtn = container.locator('.lang-switcher__more-toggle');
        await expect(moreBtn).toBeVisible();

        // Initially some languages should be hidden
        const initialItemsCount = await container.locator('.lang-switcher__item').count();

        await moreBtn.click();

        // After clicking, check if others list is present
        const othersList = container.locator('.lang-switcher__list--others');
        await expect(othersList).toBeVisible();

        const expandedItemsCount = await container.locator('.lang-switcher__item').count();
        expect(expandedItemsCount).toBeGreaterThan(initialItemsCount);
    });
});
