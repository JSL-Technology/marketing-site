import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// --- AÑADIDO: Importar los datos para el sitemap dinámico ---
import { PROJECTS, BLOG_POSTS, SOLUTIONS, PRODUCTS } from './app/core/data/mock-data';
import { SUPPORTED_LANGUAGES } from './app/core/constants/languages';
import {
  BASE_URL,
  RESPONSE,
  REQUEST,
  GA_MEASUREMENT_ID,
  GSC_VERIFICATION_TOKEN,
  CALENDLY_URL,
  FEATURE_FLAGS,
  CLARITY_PROJECT_ID,
} from './app/core/constants/tokens';
import { detectPreferredLanguage } from './app/core/utils/language-url';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();

// Running behind Render/other reverse proxies: trust forwarded headers for client IP/proto.
app.set('trust proxy', true);

const CANONICAL_BASE_URL = (
  process.env['CANONICAL_BASE_URL'] ?? 'https://www.jsl.technology'
).replace(/\/+$/, '');
const ENV_GA_MEASUREMENT_ID = process.env['GA_MEASUREMENT_ID'] ?? '';
const ENV_GSC_VERIFICATION_TOKEN = process.env['GSC_VERIFICATION_TOKEN'] ?? '';
const ENV_CALENDLY_URL = process.env['CALENDLY_URL'] ?? '';
const ENV_CLARITY_PROJECT_ID = process.env['CLARITY_PROJECT_ID'] ?? '';
const ENV_FEATURE_FLAGS: Record<string, boolean> = (() => {
  try {
    return JSON.parse(process.env['FEATURE_FLAGS'] ?? '{}');
  } catch {
    return {};
  }
})();
const CANONICAL_HOSTS = new Set(
  (process.env['CANONICAL_HOSTS'] ?? 'www.jsl.technology,jsl.technology,jsl-technology.onrender.com')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean),
);
const SKIP_CANONICAL_REDIRECT = process.env['SKIP_CANONICAL_REDIRECT'] === 'true';

// Pre-calculate canonical host for efficiency and to catch invalid URL early.
const CANONICAL_HOST = (() => {
  try {
    return new URL(CANONICAL_BASE_URL).hostname.toLowerCase();
  } catch (e) {
    console.warn(`[server] Invalid CANONICAL_BASE_URL: "${CANONICAL_BASE_URL}". Falling back to host part only.`);
    // Fallback if URL is just a hostname or invalid
    return CANONICAL_BASE_URL.replace(/^https?:\/\//, '').split('/')[0].toLowerCase() || 'www.jsl.technology';
  }
})();

const angularApp = new AngularNodeAppEngine({
  allowedHosts: [
    'localhost',
    '127.0.0.1',
    'localhost:4000',
    '127.0.0.1:4000',
    'localhost:4100',
    '127.0.0.1:4100',
    'localhost:4200',
    '127.0.0.1:4200',
    ...Array.from(CANONICAL_HOSTS),
  ],
  trustProxyHeaders: true,
});

type SeoHealthSnapshot = {
  generatedAt: string;
  canonicalBaseUrl: string;
  indexedRouteCount: number;
  localeCount: number;
  sitemapEntryCount: number;
  noindexRoutes: string[];
  schemaTypes: string[];
};

let latestSeoHealthSnapshot: SeoHealthSnapshot | null = null;

// --- OPTIMIZACIÓN: Compresión Gzip/Brotli ---
app.use(compression());

// --- SEO: Canonical host redirect (e.g. jsl.technology -> www.jsl.technology) ---
// This logic ensures only one canonical domain serves content, preventing split SEO juice.
// It can be disabled via SKIP_CANONICAL_REDIRECT=true if handled by infra (Cloudflare/Render).
app.use((req, res, next) => {
  if (SKIP_CANONICAL_REDIRECT) {
    return next();
  }

  const host = req.get('host')?.toLowerCase() ?? '';

  // 1. If no host header, skip.
  if (!host) {
    return next();
  }

  // 2. If the host is already canonical, skip.
  if (host === CANONICAL_HOST) {
    return next();
  }

  // 3. Skip redirection for local development and health checks.
  const isLocalHost =
    host.startsWith('localhost') ||
    host.startsWith('127.0.0.1') ||
    host.startsWith('0.0.0.0') ||
    host.endsWith('.local');

  if (isLocalHost) {
    return next();
  }

  // 4. Redirect only if the current host is explicitly allowed/recognized in CANONICAL_HOSTS.
  // This avoids redirecting internal Render URLs (like *.onrender.com) unless they are in the set.
  if (CANONICAL_HOSTS.has(host)) {
    const proto = req.get('x-forwarded-proto')?.split(',')[0]?.trim() || req.protocol || 'https';
    return res.redirect(301, `${proto}://${CANONICAL_HOST}${req.url}`);
  }

  return next();
});

// --- SEGURIDAD: Rate Limiting ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Production limit: 100 requests per 15-minute window per IP
  standardHeaders: true, // Devuelve info en cabeceras `RateLimit-*`
  legacyHeaders: false, // Deshabilita cabeceras `X-RateLimit-*`
  skip: (req) => {
    const ip = req.ip || req.get('x-forwarded-for') || req.socket.remoteAddress || '';
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  },
});
// Aplicar rate limiting a todas las rutas
app.use(limiter);

app.get('/', (req, res) => {
  const lang = detectPreferredLanguage(
    req.headers['accept-language'],
    req.headers['cookie'],
    SUPPORTED_LANGUAGES,
    defaultLang,
  );
  res.redirect(301, `/${lang}`);
});

app.use((req, res, next) => {
  const pathname = req.path;
  if (shouldSkipLanguageRedirect(pathname)) {
    return next();
  }

  const firstSegment = pathname.split('/').filter(Boolean)[0]?.toLowerCase();
  if (firstSegment && SUPPORTED_LANGUAGES.includes(firstSegment)) {
    return next();
  }

  const lang = detectPreferredLanguage(
    req.headers['accept-language'],
    req.headers['cookie'],
    SUPPORTED_LANGUAGES,
    defaultLang,
  );
  const redirectPath = `/${lang}${req.originalUrl.startsWith('/') ? req.originalUrl : `/${req.originalUrl}`}`;
  return res.redirect(301, redirectPath);
});

// --- INICIO: Funciones para generar el Sitemap ---

// Lista de rutas públicas estáticas
const staticRoutes = [
  '', // Para home
  'solutions',
  'products',
  'projects', // Página índice de proyectos
  'blog', // Página índice de blog
  'ventures',
  'investors',
  'virteex-ecosystem',
  'process',
  'industries',
  'tech-stack',
  'about-us',
  'contact',
  'privacy-policy',
  'terms-of-service',
  'cookie-policy',
  'careers',
  'faq',
  'partners',
  'news',
  'developers',
  'roadmap',
  'events',
  'life-at-jsl',
  'press',
  'pricing',
  'security',
];

// Priority and changefreq per static route (influences crawl budget allocation)
const ROUTE_META: Record<string, { priority: string; changefreq: string }> = {
  '': { priority: '1.0', changefreq: 'weekly' },
  solutions: { priority: '0.9', changefreq: 'monthly' },
  products: { priority: '0.9', changefreq: 'monthly' },
  blog: { priority: '0.9', changefreq: 'weekly' },
  projects: { priority: '0.8', changefreq: 'monthly' },
  'about-us': { priority: '0.8', changefreq: 'monthly' },
  contact: { priority: '0.8', changefreq: 'yearly' },
  careers: { priority: '0.7', changefreq: 'weekly' },
  faq: { priority: '0.7', changefreq: 'monthly' },
  pricing: { priority: '0.7', changefreq: 'monthly' },
  industries: { priority: '0.7', changefreq: 'monthly' },
  'tech-stack': { priority: '0.6', changefreq: 'monthly' },
  ventures: { priority: '0.6', changefreq: 'monthly' },
  investors: { priority: '0.6', changefreq: 'monthly' },
  process: { priority: '0.6', changefreq: 'monthly' },
  'virteex-ecosystem': { priority: '0.6', changefreq: 'monthly' },
  events: { priority: '0.5', changefreq: 'weekly' },
  news: { priority: '0.5', changefreq: 'weekly' },
  partners: { priority: '0.5', changefreq: 'monthly' },
  developers: { priority: '0.5', changefreq: 'monthly' },
  roadmap: { priority: '0.5', changefreq: 'monthly' },
  press: { priority: '0.5', changefreq: 'monthly' },
  'life-at-jsl': { priority: '0.5', changefreq: 'monthly' },
  security: { priority: '0.4', changefreq: 'yearly' },
  'privacy-policy': { priority: '0.3', changefreq: 'yearly' },
  'terms-of-service': { priority: '0.3', changefreq: 'yearly' },
  'cookie-policy': { priority: '0.3', changefreq: 'yearly' },
};

const DYNAMIC_ROUTE_META: Record<string, { priority: string; changefreq: string }> = {
  solutions: { priority: '0.8', changefreq: 'monthly' },
  products: { priority: '0.8', changefreq: 'monthly' },
  projects: { priority: '0.7', changefreq: 'monthly' },
  blog: { priority: '0.8', changefreq: 'weekly' },
};

const supportedLangs = SUPPORTED_LANGUAGES;
const defaultLang = 'en';

// --- NUEVO: Fecha de última modificación para rutas estáticas (evita fluctuaciones de crawl budget) ---
const STATIC_LASTMOD = process.env['BUILD_DATE'] || new Date().toISOString().split('T')[0];
const NOINDEX_ROUTES = ['/status', '/thank-you', '/server-error', '/not-found'];

function shouldSkipLanguageRedirect(pathname: string): boolean {
  if (pathname === '/') return true;
  if (pathname.startsWith('/api/') || pathname === '/api') return true;
  if (pathname.startsWith('/seo/') || pathname === '/seo') return true;
  if (pathname.startsWith('/assets/')) return true;
  if (pathname === '/robots.txt' || pathname === '/sitemap.xml' || pathname === '/favicon.ico')
    return true;
  return /\.[a-z0-9]+$/i.test(pathname);
}

/**
 * Genera el XML del sitemap dinámicamente.
 * Refactorizado para mayor escalabilidad y modularidad.
 */
type SitemapImage = { loc: string; title?: string; caption?: string };

type DynamicCollection = {
  basePath: string;
  items: Array<{ slug: string; date?: string; imageUrl?: string; key?: string }>;
};

const DYNAMIC_SITEMAP_COLLECTIONS: DynamicCollection[] = [
  { basePath: 'solutions', items: SOLUTIONS },
  { basePath: 'products', items: PRODUCTS },
  { basePath: 'projects', items: PROJECTS },
  { basePath: 'blog', items: BLOG_POSTS },
];

function generateSitemap(domain: string): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>';
  xml +=
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">';

  const now = new Date().toISOString().split('T')[0];

  // 1. Rutas estáticas
  xml += generateStaticEntriesXml(domain);

  // 2. Rutas dinámicas (colecciones escalables)
  DYNAMIC_SITEMAP_COLLECTIONS.forEach(({ basePath, items }) => {
    xml += generateDynamicEntriesXml(basePath, items, domain, now);
  });

  xml += '</urlset>';

  const dynamicEntriesCount = DYNAMIC_SITEMAP_COLLECTIONS.reduce(
    (total, collection) => total + collection.items.length,
    0,
  );
  const indexedRouteCount = staticRoutes.length + dynamicEntriesCount;
  const sitemapEntryCount = indexedRouteCount; // one <url> per canonical route

  latestSeoHealthSnapshot = {
    generatedAt: new Date().toISOString(),
    canonicalBaseUrl: domain,
    indexedRouteCount,
    localeCount: supportedLangs.length,
    sitemapEntryCount,
    noindexRoutes: NOINDEX_ROUTES,
    schemaTypes: [
      'Organization',
      'LocalBusiness',
      'WebSite',
      'BreadcrumbList',
      'BlogPosting',
      'FAQPage',
      'Product',
      'Service',
      'JobPosting',
      'Review',
      'AggregateRating',
    ],
  };

  return xml;
}

/**
 * Genera las entradas XML para las rutas estáticas
 */
function generateStaticEntriesXml(domain: string): string {
  let xml = '';
  staticRoutes.forEach((route) => {
    const meta = ROUTE_META[route] ?? { priority: '0.5', changefreq: 'monthly' };
    xml += generateUrlEntry(route, STATIC_LASTMOD, domain, meta.priority, meta.changefreq);
  });
  return xml;
}

/**
 * Genera las entradas XML para rutas dinámicas basadas en una colección.
 * Incluye extensión image:image cuando el ítem tiene imageUrl absoluta.
 */
function generateDynamicEntriesXml(
  basePath: string,
  collection: Array<{ slug: string; date?: string; imageUrl?: string; key?: string }>,
  domain: string,
  fallbackDate: string,
): string {
  const meta = DYNAMIC_ROUTE_META[basePath] ?? { priority: '0.6', changefreq: 'monthly' };
  let xml = '';
  collection.forEach((item) => {
    const images: SitemapImage[] = [];
    if (item.imageUrl && item.imageUrl.startsWith('http')) {
      images.push({ loc: item.imageUrl, title: item.key ?? item.slug });
    }
    xml += generateUrlEntry(
      `${basePath}/${item.slug}`,
      item.date || fallbackDate,
      domain,
      meta.priority,
      meta.changefreq,
      images,
    );
  });
  return xml;
}

/**
 * Helper para generar una entrada <url> con hreflang, priority, changefreq e image:image opcionales.
 * Generates ONE <url> per route (not per lang×route) with all language alternates inside.
 * The canonical <loc> uses the default language (en).
 */
function generateUrlEntry(
  route: string,
  lastmod: string,
  domain: string,
  priority = '0.5',
  changefreq = 'monthly',
  images: SitemapImage[] = [],
): string {
  const canonicalUrl = `${domain}/${defaultLang}${route ? '/' + route : ''}`;

  let entryXml = '<url>';
  entryXml += `<loc>${canonicalUrl}</loc>`;
  entryXml += `<lastmod>${lastmod}</lastmod>`;
  entryXml += `<changefreq>${changefreq}</changefreq>`;
  entryXml += `<priority>${priority}</priority>`;

  // image:image extensions
  if (images.length > 0) {
    images.forEach((img) => {
      entryXml += '<image:image>';
      entryXml += `<image:loc>${escapeXml(img.loc)}</image:loc>`;
      if (img.title) entryXml += `<image:title>${escapeXml(img.title)}</image:title>`;
      if (img.caption) entryXml += `<image:caption>${escapeXml(img.caption)}</image:caption>`;
      entryXml += '</image:image>';
    });
  }

  // hreflang alternates for all supported languages
  supportedLangs.forEach((altLang) => {
    const altUrl = `${domain}/${altLang}${route ? '/' + route : ''}`;
    entryXml += `<xhtml:link rel="alternate" hreflang="${altLang}" href="${altUrl}" />`;
  });

  // x-default points to the default language URL
  entryXml += `<xhtml:link rel="alternate" hreflang="x-default" href="${canonicalUrl}" />`;

  entryXml += '</url>';

  return entryXml;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
// --- FIN: Funciones para generar el Sitemap ---

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 * // Handle API request
 * });
 * ```
 */

const sitemapCache = new Map<string, { xml: string; generatedAt: number }>();
const SITEMAP_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

app.get('/sitemap.xml', (req, res) => {
  const domain = resolveCanonicalBaseUrl(req);
  const cached = sitemapCache.get(domain);
  const now = Date.now();

  if (cached && (now - cached.generatedAt) < SITEMAP_CACHE_TTL_MS) {
    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=86400');
    res.send(cached.xml);
    return;
  }

  const sitemap = generateSitemap(domain);
  sitemapCache.set(domain, { xml: sitemap, generatedAt: now });
  res.header('Content-Type', 'application/xml');
  res.header('Cache-Control', 'public, max-age=86400');
  res.send(sitemap);
});

app.get('/seo/health', (req, res) => {
  const secret = process.env['HEALTH_CHECK_SECRET'];
  if (secret) {
    const provided = req.headers['x-health-secret'];
    if (provided !== secret) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
  }

  const canonicalBaseUrl = resolveCanonicalBaseUrl(req);
  if (!latestSeoHealthSnapshot) {
    const dynamicEntriesCount = DYNAMIC_SITEMAP_COLLECTIONS.reduce(
      (total, collection) => total + collection.items.length,
      0,
    );
    const indexedRouteCount = staticRoutes.length + dynamicEntriesCount;
    latestSeoHealthSnapshot = {
      generatedAt: new Date(0).toISOString(),
      canonicalBaseUrl,
      indexedRouteCount,
      localeCount: supportedLangs.length,
      sitemapEntryCount: 0,
      noindexRoutes: NOINDEX_ROUTES,
      schemaTypes: ['Organization', 'BreadcrumbList', 'BlogPosting', 'FAQPage', 'Product'],
    };
  }

  res.json({
    status: 'ok',
    ...latestSeoHealthSnapshot,
    canonicalHostPolicy: {
      canonicalBaseUrl: CANONICAL_BASE_URL,
      allowedHosts: Array.from(CANONICAL_HOSTS),
    },
  });
});

/**
 * Standalone security headers middleware — applied to ALL responses including static assets.
 */
function applySecurityHeaders(req: express.Request, res: express.Response, next: express.NextFunction): void {
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Vary', 'Accept-Language');
  next();
}

app.use(applySecurityHeaders);

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
    setHeaders(res, filePath) {
      if (filePath.endsWith('.avif')) {
        res.setHeader('Content-Type', 'image/avif');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (filePath.endsWith('.webp')) {
        res.setHeader('Content-Type', 'image/webp');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  // Defense-in-depth: X-Robots-Tag for noindex routes (supplements meta robots tag)
  const isNoindexRoute = NOINDEX_ROUTES.some((route) => req.path.includes(route));
  if (isNoindexRoute) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }

  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      // 'unsafe-inline' is required for Angular SSR inline bootstrap scripts.
      // 'strict-dynamic' is included to prepare for nonce migration — in browsers
      // that support strict-dynamic, 'unsafe-inline' is ignored for script execution.
      "script-src 'self' 'unsafe-inline' 'strict-dynamic' https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://connect.facebook.net https://www.clarity.ms",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: https://www.google-analytics.com https://www.facebook.com",
      "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://www.google.com/recaptcha/ https://www.facebook.com https://clarity.microsoft.com https://api.brevo.com",
      "frame-src 'self' https://calendly.com",
      "frame-ancestors 'none'",
    ].join('; '),
  );

  const dynamicBaseUrl = resolveCanonicalBaseUrl(req);

  angularApp
    .handle(req, {
      providers: [
        { provide: BASE_URL, useValue: dynamicBaseUrl },
        { provide: RESPONSE, useValue: res },
        { provide: REQUEST, useValue: req },
        { provide: GA_MEASUREMENT_ID, useValue: ENV_GA_MEASUREMENT_ID },
        { provide: GSC_VERIFICATION_TOKEN, useValue: ENV_GSC_VERIFICATION_TOKEN },
        { provide: CALENDLY_URL, useValue: ENV_CALENDLY_URL },
        { provide: FEATURE_FLAGS, useValue: ENV_FEATURE_FLAGS },
        { provide: CLARITY_PROJECT_ID, useValue: ENV_CLARITY_PROJECT_ID },
      ],
    })
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);

function resolveCanonicalBaseUrl(req: express.Request): string {
  const host = req.get('host')?.toLowerCase() ?? '';
  const forwardedProto = req.get('x-forwarded-proto');
  const requestProtocol = forwardedProto?.split(',')[0]?.trim() || req.protocol || 'https';
  const isLocalHost = host.includes('localhost') || host.includes('127.0.0.1');

  if (isLocalHost && host) {
    return `${requestProtocol}://${host}`;
  }

  if (!host) {
    return CANONICAL_BASE_URL;
  }

  if (CANONICAL_HOSTS.has(host)) {
    return CANONICAL_BASE_URL;
  }

  return CANONICAL_BASE_URL;
}
