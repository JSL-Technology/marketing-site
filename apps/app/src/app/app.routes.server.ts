import { RenderMode, ServerRoute } from '@angular/ssr';
// 1. NO importamos 'getPrerenderParams'

import { PROJECTS, BLOG_POSTS } from './core/data/mock-data';
import { SUPPORTED_LANGUAGES } from './core/constants/languages';

const supportedLangs = SUPPORTED_LANGUAGES;

export const serverRoutes: ServerRoute[] = [
  // --- RUTAS ESTÁTICAS CORREGIDAS ---
  // 2. Usamos .map() para devolver un array: [{ lang: 'es' }, { lang: 'en' }]
  // 3. Hacemos la función 'async' para que devuelva una Promesa (la forma más robusta)
  {
    path: ':lang',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/solutions',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/products',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/projects',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/blog',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/about-us',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/contact',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/privacy-policy',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/terms-of-service',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/cookie-policy',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/ventures',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/investors',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/virteex-ecosystem',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/process',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/industries',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/tech-stack',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/careers',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/faq',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/partners',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/news',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/developers',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/roadmap',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/events',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/status',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/life-at-jsl',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/press',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/pricing',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/security',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },
  {
    path: ':lang/server-error',
    renderMode: RenderMode.Server,
  },
  {
    path: ':lang/thank-you',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => supportedLangs.map(lang => ({ lang })),
  },

  // --- RUTAS DINÁMICAS CORREGIDAS ---
  // 3. Hacemos la función 'async'
  {
    path: ':lang/projects/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => { // <--- async
      const params: { lang: string; slug: string }[] = [];
      for (const lang of supportedLangs) {
        for (const project of PROJECTS) {
          params.push({ lang, slug: project.slug });
        }
      }
      return params;
    },
  },

  {
    path: ':lang/solutions/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => {
      const { SOLUTIONS } = await import('./core/data/mock-data');
      const params: { lang: string; slug: string }[] = [];
      for (const lang of supportedLangs) {
        for (const solution of SOLUTIONS) {
          params.push({ lang, slug: solution.slug });
        }
      }
      return params;
    },
  },

  {
    path: ':lang/products/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => {
      const { PRODUCTS } = await import('./core/data/mock-data');
      const params: { lang: string; slug: string }[] = [];
      for (const lang of supportedLangs) {
        for (const product of PRODUCTS) {
          params.push({ lang, slug: product.slug });
        }
      }
      return params;
    },
  },

  {
    path: ':lang/blog/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => { // <--- async
      const params: { lang: string; slug: string }[] = [];
      for (const lang of supportedLangs) {
        for (const post of BLOG_POSTS) {
          params.push({ lang, slug: post.slug });
        }
      }
      return params;
    },
  },
  
  // --- FALLBACK CORREGIDO ---
  // 4. Cambiamos 'Dynamic' por 'SSR'
{
  path: '**',
  renderMode: RenderMode.Server 
}
];