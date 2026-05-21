import { test, expect } from '@playwright/test';

const languages = ['en', 'es', 'fr', 'ar'];
const baseUrl = 'http://localhost:4201';

for (const lang of languages) {
  test(`screenshot home page in ${lang}`, async ({ page }) => {
    await page.goto(`${baseUrl}/${lang}/home`);
    await page.waitForTimeout(5000); // More time for slow dev server
    await page.screenshot({ path: `${lang}_home.png`, fullPage: false });
  });
}

test('screenshot pricing page', async ({ page }) => {
  await page.goto(`${baseUrl}/en/pricing`);
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'en_pricing.png', fullPage: false });
});
