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
import * as nodemailer from 'nodemailer';
import { makeStateKey, TransferState } from '@angular/core';

// --- AÑADIDO: Importar los datos para el sitemap dinámico ---
import { PROJECTS, BLOG_POSTS, SOLUTIONS, PRODUCTS } from './app/core/data/mock-data';
import { SUPPORTED_LANGUAGES } from './app/core/constants/languages';
import {
  BASE_URL,
  RESPONSE,
  REQUEST,
  GA_MEASUREMENT_ID,
  RECAPTCHA_SITE_KEY,
  GSC_VERIFICATION_TOKEN,
  CALENDLY_URL,
  FEATURE_FLAGS,
  CLARITY_PROJECT_ID,
} from './app/core/constants/tokens';
import { detectPreferredLanguage } from './app/core/utils/language-url';

const browserDistFolder = join(import.meta.dirname, '../browser');

/**
 * EXTRA_ALLOWED_HOSTS: Additional hostnames allowed for SSR rendering.
 * Useful for Render PR Previews or staging environments.
 */
const EXTRA_ALLOWED_HOSTS = (process.env['ALLOWED_HOSTS'] ?? '')
  .split(',')
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

const app = express();

/**
 * PROXY CONFIGURATION:
 * We trust the first proxy (Render's load balancer) to correctly interpret
 * X-Forwarded-Proto and X-Forwarded-For headers.
 * This ensures req.protocol is 'https' when the client connects via SSL,
 * preventing redirection loops and allowing secure cookie handling.
 */
app.set('trust proxy', true);

/**
 * SSR ENGINE CONFIGURATION:
 * AngularNodeAppEngine is configured to trust proxy headers for internal
 * absolute URL generation and CSRF/SSRF protection.
 *
 * DOMAIN CANONICALIZATION:
 * We no longer perform manual redirects between jsl.technology and www.jsl.technology
 * within the application code. This logic is now managed at the infrastructure
 * level (Render) to avoid 'ERR_TOO_MANY_REDIRECTS' and simplify the architecture.
 */
const angularApp = new AngularNodeAppEngine({
  trustProxyHeaders: true,
  allowedHosts: [
    'localhost',
    '127.0.0.1',
    'jsl.technology',
    'www.jsl.technology',
    'localhost:4000',
    'localhost:4100',
    '127.0.0.1:4000',
    '127.0.0.1:4100',
    ...EXTRA_ALLOWED_HOSTS,
  ],
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

const CANONICAL_BASE_URL = (
  process.env['CANONICAL_BASE_URL'] ?? 'https://www.jsl.technology'
).replace(/\/+$/, '');
const ENV_GA_MEASUREMENT_ID = process.env['GA_MEASUREMENT_ID'] ?? '';
const ENV_GSC_VERIFICATION_TOKEN = process.env['GSC_VERIFICATION_TOKEN'] ?? '';
const ENV_CALENDLY_URL = process.env['CALENDLY_URL'] ?? '';
const ENV_CLARITY_PROJECT_ID = process.env['CLARITY_PROJECT_ID'] ?? '';
const ENV_RECAPTCHA_SITE_KEY = process.env['RECAPTCHA_SITE_KEY'] ?? '';
const ENV_RECAPTCHA_SECRET_KEY = process.env['RECAPTCHA_SECRET_KEY'] ?? '';

// SMTP Configuration
const SMTP_HOST = process.env['SMTP_HOST'] ?? '';
const SMTP_PORT = Number(process.env['SMTP_PORT'] ?? 587);
const SMTP_USER = process.env['SMTP_USER'] ?? '';
const SMTP_PASS = process.env['SMTP_PASS'] ?? '';
const SMTP_FROM = process.env['SMTP_FROM'] ?? '"JSL Technology" <noreply@jsl.technology>';
const CONTACT_RECEIVER_EMAIL = process.env['CONTACT_RECEIVER_EMAIL'] ?? 'contact@jsl.technology';

const ENV_FEATURE_FLAGS: Record<string, boolean> = (() => {
  try {
    return JSON.parse(process.env['FEATURE_FLAGS'] ?? '{}');
  } catch {
    return {};
  }
})();
// --- OPTIMIZACIÓN: Compresión Gzip/Brotli ---
app.use(compression());

// Parse JSON payloads for API routes
app.use(express.json());

// --- SEGURIDAD: Rate Limiting ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10000, // Límite aumentado significativamente para permitir tests E2E paralelos sin bloqueos 429
  standardHeaders: true, // Devuelve info en cabeceras `RateLimit-*`
  legacyHeaders: false, // Deshabilita cabeceras `X-RateLimit-*`
  validate: false,
  skip: (req) => {
    const ip = req.ip || req.connection.remoteAddress || '';
    return (
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip === '::ffff:127.0.0.1' ||
      req.path.startsWith('/seo/')
    );
  },
});
// Aplicar rate limiting a todas las rutas
app.use(limiter);
// ─── CAPA 1: TRAILING SLASH ─────────────────────────────────────────────
// Normaliza todas las rutas sin trailing slash → con trailing slash (301)
// No aplica a archivos estáticos ni a la raíz
app.use((req, res, next) => {
  const path = req.path;
  if (/\.\w+$/.test(path)) return next(); // tiene extensión → estático
  if (path === "/") return next(); // raíz → no tocar
  if (!path.endsWith("/")) {
    const qs = req.url.slice(path.length); // preserva query string
    return res.redirect(301, path + "/" + qs);
  }
  next();
});

// ─── CAPA 2: REDIRECTS PERMANENTES (rutas legacy) ───────────────────────
// Fuente de verdad: editar SOLO este objeto para agregar/quitar redirects
const PERMANENT_REDIRECTS: Record<string, string> = {
  // NOTA: las keys ya incluyen trailing slash porque la Capa 1 ya normalizó
  "/en/home/": "/en/",
  "/es/home/": "/es/",
  "/ar/home/": "/ar/",
  "/de/home/": "/de/",
  "/fr/home/": "/fr/",
  "/it/home/": "/it/",
  "/ja/home/": "/ja/",
  "/ko/home/": "/ko/",
  "/pt/home/": "/pt/",
  "/zh/home/": "/zh/",
  "/ht/home/": "/ht/",
  "/solutions/cloud-architecture/": "/en/solutions/cloud-architecture/",
};

app.use((req, res, next) => {
  const destination = PERMANENT_REDIRECTS[req.path];
  if (destination) {
    const qs = req.url.slice(req.path.length); // preserva query string
    return res.redirect(301, destination + qs);
  }
  next();
});




app.get('/', (req, res) => {
  const lang = detectPreferredLanguage(
    req.headers['accept-language'],
    req.headers['cookie'],
    SUPPORTED_LANGUAGES,
    defaultLang,
  );
  res.redirect(301, `/${lang}/`);
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
  // Si el redirectPath no termina en slash y no es un archivo, se le añadirá en la siguiente vuelta del middleware de trailing slash
  // o podemos forzarlo aquí para ahorrar un salto. Dado que Capa 1 ya pasó, mejor forzarlo aquí.
  const finalRedirect = redirectPath.endsWith('/') ? redirectPath : `${redirectPath}/`;
  return res.redirect(301, finalRedirect);
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
  if (pathname.startsWith('/assets/')) return true;
  if (
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/seo/')
  )
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
  const sitemapEntryCount = indexedRouteCount * supportedLangs.length;

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
 */
function generateUrlEntry(
  route: string,
  lastmod: string,
  domain: string,
  priority = '0.5',
  changefreq = 'monthly',
  images: SitemapImage[] = [],
): string {
  let entryXml = '';

  supportedLangs.forEach((lang) => {
    const url = `${domain}/${lang}${route ? '/' + route + '/' : '/'}`;

    entryXml += '<url>';
    entryXml += `<loc>${url}</loc>`;
    entryXml += `<lastmod>${lastmod}</lastmod>`;
    entryXml += `<changefreq>${changefreq}</changefreq>`;
    entryXml += `<priority>${priority}</priority>`;

    // image:image extensions (only on the canonical lang entry to avoid duplication)
    if (lang === defaultLang && images.length > 0) {
      images.forEach((img) => {
        entryXml += '<image:image>';
        entryXml += `<image:loc>${escapeXml(img.loc)}</image:loc>`;
        if (img.title) entryXml += `<image:title>${escapeXml(img.title)}</image:title>`;
        if (img.caption) entryXml += `<image:caption>${escapeXml(img.caption)}</image:caption>`;
        entryXml += '</image:image>';
      });
    }

    // hreflang alternates
    supportedLangs.forEach((altLang) => {
      const altUrl = `${domain}/${altLang}${route ? '/' + route + '/' : '/'}`;
      entryXml += `<xhtml:link rel="alternate" hreflang="${altLang}" href="${altUrl}" />`;
    });

    // x-default
    const defaultUrl = `${domain}/${defaultLang}${route ? '/' + route + '/' : '/'}`;
    entryXml += `<xhtml:link rel="alternate" hreflang="x-default" href="${defaultUrl}" />`;

    entryXml += '</url>';
  });

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

app.get('/sitemap.xml', (req, res) => {
  const domain = resolveCanonicalBaseUrl(req);

  const sitemap = generateSitemap(domain);
  res.header('Content-Type', 'application/xml');
  res.send(sitemap);
});

/**
 * Handle Contact Form Submission
 * Verifies reCAPTCHA and sends email via SMTP.
 */
app.post('/api/contact', async (req, res) => {
  const {
    recaptchaToken,
    name,
    email,
    company,
    service,
    serviceOther,
    budget,
    message,
    phone,
    referralSource,
    segment,
  } = req.body;

  if (!recaptchaToken) {
    return res.status(400).json({ success: false, message: 'reCAPTCHA token is required' });
  }

  try {
    // 1. Verify reCAPTCHA
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${ENV_RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`;
    const verifyResponse = await fetch(verificationUrl, { method: 'POST' });
    const verifyData = (await verifyResponse.json()) as {
      success: boolean;
      score?: number;
      action?: string;
    };

    if (!verifyData.success || (verifyData.score !== undefined && verifyData.score < 0.5)) {
      return res.status(403).json({
        success: false,
        message: 'reCAPTCHA verification failed',
        details: verifyData,
      });
    }

    // 2. Prepare Email
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const selectedService = service === 'other' ? `Other (${serviceOther})` : service;

    const mailOptions = {
      from: SMTP_FROM,
      to: CONTACT_RECEIVER_EMAIL,
      replyTo: email,
      subject: `New Lead: ${name} - ${selectedService}`,
      text: `
        Name: ${name}
        Email: ${email}
        Phone: ${phone || 'N/A'}
        Company: ${company || 'N/A'}
        Service: ${selectedService}
        Budget: ${budget || 'N/A'}
        Source: ${referralSource || 'N/A'}
        Segment: ${segment || 'N/A'}

        Message:
        ${message}
      `,
      html: `
        <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
          <h2>New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Name:</strong></td><td style="padding: 8px; border: 1px solid #eee;">${name}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Email:</strong></td><td style="padding: 8px; border: 1px solid #eee;"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Phone:</strong></td><td style="padding: 8px; border: 1px solid #eee;">${phone || '—'}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Company:</strong></td><td style="padding: 8px; border: 1px solid #eee;">${company || '—'}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Service:</strong></td><td style="padding: 8px; border: 1px solid #eee;">${selectedService}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Budget:</strong></td><td style="padding: 8px; border: 1px solid #eee;">${budget || '—'}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Referral:</strong></td><td style="padding: 8px; border: 1px solid #eee;">${referralSource || '—'}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Segment:</strong></td><td style="padding: 8px; border: 1px solid #eee;">${segment || '—'}</td></tr>
          </table>
          <h3>Message:</h3>
          <p style="background: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff;">
            ${message.replace(/\n/g, '<br>')}
          </p>
        </div>
      `,
    };

    // 3. Send Email
    await transporter.sendMail(mailOptions);

    console.log(`Contact form email sent successfully for ${email}`);

    return res.json({
      success: true,
      message: 'Message received and email sent successfully',
    });
  } catch (error) {
    console.error('Error handling contact form submission:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/seo/health', (req, res) => {
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
      extraAllowedHosts: EXTRA_ALLOWED_HOSTS,
    },
  });
});

// ─── CAPA 3: ARCHIVOS ESTÁTICOS ─────────────────────────────────────────
app.get('*.*',
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

// ─── CAPA 4: ANGULAR ENGINE (catch-all) ─────────────────────────────────
app.get('*', (req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Vary', 'Accept-Language');

  // SSR HTML cache: 60s fresh + 5min stale-while-revalidate for CDN/proxies.
  // Eliminates "Efficiently cache static assets" warning for HTML.
  // Only cache GET/HEAD to avoid caching form submissions.
  if (req.method === 'GET' || req.method === 'HEAD') {
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  }

  // Defense-in-depth: X-Robots-Tag for noindex routes (supplements meta robots tag)
  const isNoindexRoute = NOINDEX_ROUTES.some((route) => req.path.includes(route));
  if (isNoindexRoute) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }

  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://connect.facebook.net https://www.clarity.ms",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: https://www.google-analytics.com https://www.facebook.com",
      "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://www.google.com/recaptcha/ https://www.facebook.com https://clarity.microsoft.com https://api.brevo.com",
      "frame-src 'self' https://calendly.com",
      "frame-ancestors 'none'",
    ].join('; '),
  );

  const dynamicBaseUrl = resolveCanonicalBaseUrl(req);

  const transferState = new TransferState();
  transferState.set(makeStateKey<string>('RECAPTCHA_SITE_KEY'), ENV_RECAPTCHA_SITE_KEY);

  angularApp
    .handle(req, {
      providers: [
        { provide: TransferState, useValue: transferState },
        { provide: BASE_URL, useValue: dynamicBaseUrl },
        { provide: RESPONSE, useValue: res },
        { provide: REQUEST, useValue: req },
        { provide: GA_MEASUREMENT_ID, useValue: ENV_GA_MEASUREMENT_ID },
        { provide: RECAPTCHA_SITE_KEY, useValue: ENV_RECAPTCHA_SITE_KEY },
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
  const isLocalHost = host.includes('localhost') || host.includes('127.0.0.1');

  if (isLocalHost && host) {
    return `${req.protocol}://${host}`;
  }

  return CANONICAL_BASE_URL;
}
