import { test, expect } from '@playwright/test';

test.describe('SEO Technical Audit', () => {
  const baseUrl = 'http://127.0.0.1:4000';
  const languages = ['es', 'en'];
  const totalLangsCount = 12; // 11 supported + x-default

  for (const lang of languages) {
    test(`Home page [${lang}] should have correct basic SEO tags`, async ({ page }) => {
      await page.goto(`${baseUrl}/${lang}/home`);

      // Canonical
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveAttribute('href', `${baseUrl}/${lang}`);

      // Hreflang
      const hreflangs = page.locator('link[rel="alternate"][hreflang]');
      await expect(hreflangs).toHaveCount(totalLangsCount);
      await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', `${baseUrl}/en`);

      // Title & Description
      const title = await page.title();
      expect(title).toContain('JSL Technology');

      const description = page.locator('meta[name="description"]');
      await expect(description).toHaveAttribute('content', /.+/); // Not empty

      // Robots
      const robots = page.locator('meta[name="robots"]');
      await expect(robots).toHaveAttribute('content', 'index, follow');
    });
  }

  test('Organization schema should be present on all pages', async ({ page }) => {
    await page.goto(`${baseUrl}/en/home`);
    const schemaScript = page.locator('script[type="application/ld+json"]#organization-schema');
    const schemaText = await schemaScript.textContent();
    const schema = JSON.parse(schemaText || '{}');
    expect(schema['@type']).toBe('Organization');
    expect(schema['name']).toBe('JSL Technology');
    expect(schema['url']).toBeDefined();
    expect(schema['logo']).toBeDefined();
  });

  test('Solution detail page should have granular metadata and schema', async ({ page }) => {
    // web-development is a slug in mock-data
    await page.goto(`${baseUrl}/es/solutions/web-development`);

    const title = await page.title();
    expect(title).toContain('JSL Technology');

    // Schema Service
    const schemaScript = page.locator('script[type="application/ld+json"]#structured-data');
    const schemaText = await schemaScript.textContent();
    const schema = JSON.parse(schemaText || '{}');
    expect(schema['@type']).toBe('Service');
    expect(schema['name']).toContain('Desarrollo Web');
    expect(schema['provider']['name']).toBe('JSL Technology');

    // Breadcrumb schema
    const bcScript = page.locator('script[type="application/ld+json"]#breadcrumb-schema');
    const bcText = await bcScript.textContent();
    const bcSchema = JSON.parse(bcText || '{}');
    expect(bcSchema['@type']).toBe('BreadcrumbList');
    expect(bcSchema['itemListElement'].length).toBe(3);
  });

  test('Product detail page should have Product schema', async ({ page }) => {
    await page.goto(`${baseUrl}/en/products/virtex`);
    const schemaScript = page.locator('script[type="application/ld+json"]#structured-data');
    const schemaText = await schemaScript.textContent();
    const schema = JSON.parse(schemaText || '{}');
    expect(schema['@type']).toBe('Product');
    expect(schema['name']).toBeDefined();
    expect(schema['brand']['name']).toBe('JSL Technology');
  });

  test('Project detail page should have CreativeWork schema', async ({ page }) => {
    await page.goto(`${baseUrl}/en/projects/erp-logistics-optimization`);
    const schemaScript = page.locator('script[type="application/ld+json"]#structured-data');
    const schemaText = await schemaScript.textContent();
    const schema = JSON.parse(schemaText || '{}');
    expect(schema['@type']).toBe('CreativeWork');
    expect(schema['name']).toBeDefined();
    expect(schema['author']['name']).toBe('JSL Technology');
  });

  test('Blog detail page should have BlogPosting schema', async ({ page }) => {
    await page.goto(`${baseUrl}/en/blog/future-of-angular-ssr`);

    const schemaScript = page.locator('script[type="application/ld+json"]#structured-data');
    const schemaText = await schemaScript.textContent();
    const schema = JSON.parse(schemaText || '{}');
    expect(schema['@type']).toBe('BlogPosting');
    expect(schema['headline']).toContain('Future of Angular SSR');
    expect(schema['author']['name']).toBe('JSL Technology');
  });

  test('Blog listing page should expose structured editorial ItemList schema', async ({ page }) => {
    await page.goto(`${baseUrl}/en/blog`);

    const schemaScript = page.locator('script[type="application/ld+json"]#structured-data');
    const schemaText = await schemaScript.textContent();
    const schema = JSON.parse(schemaText || '{}');
    expect(schema['@type']).toBe('ItemList');
    expect(Array.isArray(schema['itemListElement'])).toBeTruthy();
    expect(schema['itemListElement'].length).toBeGreaterThan(0);
    expect(schema['itemListElement'][0]['@type']).toBe('BlogPosting');
  });

  test('FAQ page should have FAQPage schema', async ({ page }) => {
    await page.goto(`${baseUrl}/es/faq`);

    const schemaScript = page.locator('script[type="application/ld+json"]#faq-schema');
    const schemaText = await schemaScript.textContent();
    const schema = JSON.parse(schemaText || '{}');
    expect(schema['@type']).toBe('FAQPage');
    expect(schema['mainEntity'].length).toBeGreaterThan(0);
    expect(schema['mainEntity'][0]['@type']).toBe('Question');
    expect(schema['mainEntity'][0]['acceptedAnswer']['@type']).toBe('Answer');
  });

  test('Canonical should not have trailing slash', async ({ page }) => {
    await page.goto(`${baseUrl}/es/solutions/`);
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', /[^/]$/);
  });

  test('Meta tags should not accumulate during SPA navigation', async ({ page }) => {
    await page.goto(`${baseUrl}/es/home`);

    // Use footer links which are usually more stable for E2E
    const solutionsLink = page.locator('footer a[href="/es/solutions"]').first();
    await solutionsLink.scrollIntoViewIfNeeded();
    await solutionsLink.click();
    await page.waitForURL(/.*\/solutions/);

    const aboutUsLink = page.locator('footer a[href="/es/about-us"]').first();
    await aboutUsLink.scrollIntoViewIfNeeded();
    await aboutUsLink.click();
    await page.waitForURL(/.*\/about-us/);

    const canonicals = page.locator('link[rel="canonical"]');
    await expect(canonicals).toHaveCount(1);

    const hreflangs = page.locator('link[rel="alternate"][hreflang]');
    await expect(hreflangs).toHaveCount(totalLangsCount);
  });

  test('Sitemap.xml should be valid and return 200', async ({ request }) => {
    const response = await request.get(`${baseUrl}/sitemap.xml`);
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toContain('<?xml');
    expect(body).toContain('<urlset');
    expect(body).toContain('<loc>');
    expect(body).toContain(`${baseUrl}/en`);
    expect(body).toContain(`${baseUrl}/en/products/virtex`);

    // Check that noindex routes are NOT in sitemap
    expect(body).not.toContain('<loc>' + baseUrl + '/en/status</loc>');
    expect(body).not.toContain('<loc>' + baseUrl + '/en/server-error</loc>');
    expect(body).not.toContain('<loc>' + baseUrl + '/en/thank-you</loc>');
    expect(body).not.toContain('<loc>' + baseUrl + '/en/not-found</loc>');
  });

  test('Error pages should return correct SSR status codes', async ({ request }) => {
    // Note: This requires the server to be running and handling these routes with SSR
    const notFoundResponse = await request.get(`${baseUrl}/en/not-found-page-that-does-not-exist`);
    expect(notFoundResponse.status()).toBe(404);

    const serverErrorResponse = await request.get(`${baseUrl}/en/server-error`);
    expect(serverErrorResponse.status()).toBe(500);
  });

  test('Status page should have noindex meta tag', async ({ page }) => {
    await page.goto(`${baseUrl}/en/status`);
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute('content', 'noindex, follow');
  });

  test('All images should have an alt attribute', async ({ page }) => {
    await page.goto(`${baseUrl}/en/home`);
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).not.toBeNull();
      expect(alt?.length).toBeGreaterThan(0);
    }
  });

  test('Key landing pages should have exactly one H1', async ({ page }) => {
    const pages = ['/en/home', '/en/solutions', '/en/blog', '/en/about-us'];
    for (const route of pages) {
      await page.goto(`${baseUrl}${route}`);
      const h1s = page.locator('h1');
      await expect(h1s).toHaveCount(1);
    }
  });
});
