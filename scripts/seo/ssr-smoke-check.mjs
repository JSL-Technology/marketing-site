import { spawn } from 'node:child_process';

const baseUrl = process.env.SEO_BASE_URL ?? 'http://127.0.0.1:4100';
const serverEntry = process.env.SEO_SERVER_ENTRY ?? 'dist/apps/app/server/server.mjs';
const routes = [
  '/en/home',
  '/es/home',
  '/en/solutions/web-development',
  '/en/products/virtex',
  '/en/blog/future-of-angular-ssr',
  '/en/faq',
];

const server = spawn('node', [serverEntry], {
  env: { ...process.env, PORT: '4100' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

server.stdout.on('data', (chunk) => {
  process.stdout.write(`[server] ${chunk}`);
});

server.stderr.on('data', (chunk) => {
  process.stderr.write(`[server-err] ${chunk}`);
});

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/sitemap.xml`);
      if (response.ok) return;
    } catch {
      // retry
    }
    await sleep(500);
  }
  throw new Error('SSR server did not start in time.');
}

function assertIncludes(html, snippet, message) {
  if (!html.includes(snippet)) {
    throw new Error(`${message}. Missing snippet: ${snippet}`);
  }
}

function assertRegex(html, regex, message) {
  if (!regex.test(html)) {
    throw new Error(`${message}. Regex failed: ${regex}`);
  }
}

async function checkRoute(route) {
  const url = `${baseUrl}${route}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Route ${route} returned HTTP ${response.status}`);
  }

  const html = await response.text();
  assertRegex(html, /<title>[^<]+<\/title>/i, `Missing <title> in ${route}`);
  assertRegex(html, /<meta[^>]+name=["']description["'][^>]+content=["'][^"']+["'][^>]*>/i, `Missing meta description in ${route}`);
  assertRegex(html, /<link[^>]+rel=["']canonical["'][^>]+href=["'][^"']+["'][^>]*>/i, `Missing canonical in ${route}`);
  assertRegex(html, /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']+["'][^>]*>/i, `Missing robots tag in ${route}`);
  assertRegex(html, /<meta[^>]+property=["']og:title["'][^>]*>/i, `Missing OG title in ${route}`);
  assertRegex(html, /<meta[^>]+property=["']og:locale["'][^>]*>/i, `Missing og:locale in ${route}`);
  assertRegex(html, /<meta[^>]+name=["']twitter:card["'][^>]*>/i, `Missing Twitter card in ${route}`);
  assertRegex(html, /<meta[^>]+name=["']twitter:site["'][^>]*>/i, `Missing twitter:site in ${route}`);
  assertIncludes(html, 'application/ld+json', `Missing JSON-LD schema in ${route}`);
  assertRegex(html, /<link[^>]+rel=["']alternate["'][^>]+hreflang=["'][^"']+["'][^>]*>/i, `Missing hreflang alternate tags in ${route}`);

  // Verify no duplicate canonical tags
  const canonicalMatches = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/gi) ?? [];
  if (canonicalMatches.length > 1) {
    throw new Error(`Duplicate canonical tags (${canonicalMatches.length}) found in ${route}`);
  }
}

(async () => {
  try {
    await waitForServer();

    for (const route of routes) {
      await checkRoute(route);
      console.log(`[seo-ssr-check] OK ${route}`);
    }

    const sitemapRes = await fetch(`${baseUrl}/sitemap.xml`);
    const sitemapText = await sitemapRes.text();
    assertIncludes(sitemapText, '<urlset', 'Sitemap is invalid');
    assertIncludes(sitemapText, `${baseUrl}/en/products/virtex`, 'Sitemap is missing product detail URL');

    const healthRes = await fetch(`${baseUrl}/seo/health`);
    if (!healthRes.ok) {
      throw new Error(`/seo/health returned HTTP ${healthRes.status}`);
    }
    const health = await healthRes.json();
    if (!health.sitemapEntryCount || !health.indexedRouteCount) {
      throw new Error('SEO health response missing expected counters');
    }

    console.log('[seo-ssr-check] All checks passed.');
  } finally {
    server.kill('SIGTERM');
    await sleep(300);
  }
})().catch((error) => {
  console.error(`[seo-ssr-check] ${error.message}`);
  process.exit(1);
});
