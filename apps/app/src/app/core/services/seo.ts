import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { SUPPORTED_LANGUAGES } from '../constants/languages';
import { BASE_URL, RESPONSE, GSC_VERIFICATION_TOKEN } from '../constants/tokens';
import { Optional } from '@angular/core';
import { DirectionService } from './direction.service';

@Injectable({
  providedIn: 'root'
})
export class Seo {
  private baseTitle = 'JSL Technology';
  private siteName = 'JSL Technology';
  private defaultImageUrl: string;
  private supportedLangs = SUPPORTED_LANGUAGES;

  constructor(
    private titleService: Title,
    private metaService: Meta,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private translate: TranslateService,
    private directionService: DirectionService,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: object,
    @Inject(BASE_URL) private baseUrl: string,
    @Optional() @Inject(RESPONSE) private response: any,
    @Optional() @Inject(GSC_VERIFICATION_TOKEN) private gscToken: string,
  ) {
    this.defaultImageUrl = `${this.baseUrl}/assets/imgs/jsl-social-default.jpg`;
  }

  /**
   * Devuelve la URL base del sitio.
   */
  public getBaseUrl(): string {
    return this.baseUrl;
  }

  init(): void {
    this.injectGscVerificationTag();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      tap(() => {
        this.setOrganizationSchema();
        this.setWebSiteSchema();
        this.setResourceHints();
        this.clearDynamicSchemas();
        this.setPaginationLinks(); // limpia prev/next en cada navegación
      }),
      map(() => this.getDeepestRoute(this.activatedRoute)),
      filter(route => !!route.snapshot.data['title']),
      switchMap(route => {
        const titleKey = route.snapshot.data['title'];
        let descriptionKey = route.snapshot.data['description'];

        if (titleKey === 'dynamic') {
          return of({ route, translatedTitle: null, translatedDesc: null, breadcrumbHome: '' });
        }

        if (!descriptionKey || descriptionKey === '') {
          descriptionKey = 'COMMON.DEFAULT_DESCRIPTION';
        }

        return this.translate.get([titleKey, descriptionKey, 'COMMON.BREADCRUMB_HOME']).pipe(
          map(translations => {
            let translatedTitle = translations[titleKey];
            let translatedDesc = translations[descriptionKey];
            const breadcrumbHome = translations['COMMON.BREADCRUMB_HOME'] || 'Home';

            // Robust fallback if translation is missing (ngx-translate returns the key)
            if (translatedTitle === titleKey || !translatedTitle) {
              translatedTitle = this.baseTitle;
            }
            if (translatedDesc === descriptionKey || !translatedDesc) {
              translatedDesc = 'Expert software development and digital transformation solutions.';
            }

            return {
              route,
              translatedTitle,
              translatedDesc,
              breadcrumbHome
            };
          })
        );
      })
    ).subscribe(({ route, translatedTitle, translatedDesc, breadcrumbHome }) => {
      // --- 0. Leer Robots Meta de la Ruta ---
      const robotsConfig = route.snapshot.data['robots'] || 'index, follow';

      // --- G. Handle HTTP Status for Noindex Routes ---
      if (this.response) {
        const fullPath = this.router.url;
        const isNotFound = route.routeConfig?.path === '**' ||
                         fullPath.includes('/not-found') ||
                         route.snapshot.url.some(s => s.path === 'not-found');

        const isServerError = fullPath.includes('/server-error') ||
                            route.snapshot.url.some(s => s.path === 'server-error');

        if (isNotFound) {
          console.log('SEO: Setting status to 404 for', fullPath);
          this.response.status(404);
        } else if (isServerError) {
          console.log('SEO: Setting status to 500 for', fullPath);
          this.response.status(500);
        }
      }

      // Skip if the component handles SEO manually
      if (translatedTitle === null) {
        return;
      }
      
      // --- A. Construir URLs y Título ---
      const title = (translatedTitle === 'Inicio' || translatedTitle === 'Home')
        ? this.baseTitle
        : `${translatedTitle} | ${this.baseTitle}`;
      
      const currentLang = route.parent?.snapshot.params['lang'];
      const pathSegments = route.snapshot.pathFromRoot
        .flatMap(r => r.url.map(segment => segment.path))
        .filter(path => path !== currentLang); // Exclude language segment from path

      const pathWithoutLang = pathSegments.join('/');
      
      // --- B. Lógica de URL Canónica ---
      // (Ej: 'home' se convierte en '', 'solutions' se queda como 'solutions')
      let canonicalPath = pathWithoutLang === 'home' ? '' : pathWithoutLang;

      // Ensure no double slashes and no trailing slash unless it's the root
      canonicalPath = canonicalPath.replace(/\/+$/, '');

      // (Ej: https://www.jsltechnology.com/es ó https://www.jsltechnology.com/es/solutions)
      // Evitamos slash final si canonicalPath está vacío
      const canonicalUrl = canonicalPath
        ? `${this.baseUrl}/${currentLang}/${canonicalPath}`
        : `${this.baseUrl}/${currentLang}`;

      // --- C. Actualizar Título y Meta Descripción ---
      this.titleService.setTitle(title);
      this.metaService.updateTag({ name: 'description', content: translatedDesc });

      // --- D. Actualizar Etiqueta Canónica (¡NUEVO!) ---
      // Esto se ejecuta en servidor y cliente
      this.updateCanonicalTag(canonicalUrl);

      // --- E. Actualizar Etiquetas de Redes Sociales (¡NUEVO!) ---
      // (Asumimos una imagen por defecto, pero podrías hacerla dinámica)
      this.updateSocialTags(
        title, 
        translatedDesc, 
        canonicalUrl, 
        this.defaultImageUrl,
        'website' // Añadimos el tipo por defecto
      );

      // --- F. Update Robots Tag ---
      this.updateRobotsTag(robotsConfig);


      // --- G. Actualizar Etiquetas Hreflang (¡MODIFICADO!) ---
      // Ya no está dentro de 'isPlatformBrowser', se ejecutará en el servidor.
      // La lógica interna se encarga de la limpieza solo en el navegador.
      if (currentLang) {
        this.updateHreflangTags(this.baseUrl, canonicalPath);
        this.updateLanguageTag(currentLang);
      }

      // --- H. Limpiar article:* meta tags (no son artículo de blog) ---
      this.clearArticleTags();

      // --- I. Auto-breadcrumbs para páginas estáticas (no-home) ---
      if (currentLang && canonicalPath) {
        this.setBreadcrumbs([
          { name: breadcrumbHome, item: `/${currentLang}` },
          { name: translatedTitle, item: `/${currentLang}/${canonicalPath}` }
        ]);
      }
    });
  }

  private getDeepestRoute(route: ActivatedRoute): ActivatedRoute {
    let currentRoute = route;
    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }
    return currentRoute;
  }

  /**
   * Actualiza el título y la descripción meta.
   */
  public updateTitleAndDescription(title: string, description: string): void {
    this.titleService.setTitle(title);
    this.metaService.updateTag({ name: 'description', content: description });
  }

  /**
   * 3. ¡NUEVO! Actualiza la etiqueta <link rel="canonical">.
   */
  public updateCanonicalTag(url: string): void {
    // Remove ALL existing canonical tags to avoid duplicates during SPA navigation
    const existingCanonicalTags = this.document.querySelectorAll('link[rel="canonical"]');
    existingCanonicalTags.forEach(tag => tag.remove());
    
    // Creamos la nueva etiqueta (esto se ejecuta en servidor y cliente)
    const link: HTMLLinkElement = this.document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    this.document.head.appendChild(link);
  }

  /**
   * 4. ¡NUEVO! Actualiza las etiquetas Meta de Open Graph y Twitter.
   */
  public updateSocialTags(title: string, description: string, url: string, imageUrl: string, ogType = 'website', imageAlt = ''): void {
    const currentLang = this.translate.currentLang || 'en';
    const ogLocale = this.langToOgLocale(currentLang);
    const resolvedAlt = imageAlt || title;

    // Open Graph (Facebook, LinkedIn, etc.)
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:url', content: url });
    this.metaService.updateTag({ property: 'og:image', content: imageUrl });
    this.metaService.updateTag({ property: 'og:image:alt', content: resolvedAlt });
    this.metaService.updateTag({ property: 'og:site_name', content: this.siteName });
    this.metaService.updateTag({ property: 'og:type', content: ogType });
    this.metaService.updateTag({ property: 'og:locale', content: ogLocale });

    // Twitter Cards
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: title });
    this.metaService.updateTag({ name: 'twitter:description', content: description });
    this.metaService.updateTag({ name: 'twitter:image', content: imageUrl });
    this.metaService.updateTag({ name: 'twitter:image:alt', content: resolvedAlt });
    this.metaService.updateTag({ name: 'twitter:site', content: '@jsl_technology' });
    this.metaService.updateTag({ name: 'twitter:creator', content: '@jsl_technology' });
  }

  private langToOgLocale(lang: string): string {
    const map: Record<string, string> = {
      en: 'en_US', es: 'es_ES', fr: 'fr_FR', de: 'de_DE',
      it: 'it_IT', pt: 'pt_BR', ja: 'ja_JP', ko: 'ko_KR',
      zh: 'zh_CN', ar: 'ar_AE', ht: 'ht_HT',
    };
    return map[lang] ?? 'en_US';
  }

  /**
   * 6. ¡NUEVO! Actualiza el atributo lang del html y dir para RTL.
   */
  private updateLanguageTag(lang: string): void {
    this.directionService.syncDirection(lang);
  }

  /**
   * 7. ¡NUEVO! Actualiza la etiqueta meta robots.
   */
  public updateRobotsTag(content: string): void {
    this.metaService.updateTag({ name: 'robots', content: content });
  }

  /**
   * 8. Gestiona scripts de Datos Estructurados (JSON-LD).
   * Pass dynamic=false for permanent schemas (Organization, WebSite) that persist across routes.
   */
  public setJsonLd(schema: any, id = 'structured-data', dynamic = true): void {
    const schemaName = id;

    // 8.1. Limpiar script previo (solo navegador para evitar fugas en navegación SPA)
    if (isPlatformBrowser(this.platformId)) {
      const existingScript = this.document.getElementById(schemaName);
      if (existingScript) {
        existingScript.remove();
      }
    }

    // 8.2. Crear y añadir el nuevo script
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.id = schemaName;
    script.text = JSON.stringify(schema);
    if (dynamic) {
      script.setAttribute('data-dynamic', 'true');
    }
    this.document.head.appendChild(script);
  }

  /**
   * Limpia todos los schemas dinámicos usando el atributo data-dynamic="true".
   */
  public clearDynamicSchemas(): void {
    this.document.querySelectorAll('script[type="application/ld+json"][data-dynamic="true"]')
      .forEach(el => el.remove());
  }

  /**
   * Genera e inyecta el esquema de Organización con LocalBusiness embebido.
   */
  public setOrganizationSchema(): void {
    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': ['Organization', 'LocalBusiness'],
      '@id': `${this.baseUrl}/#organization`,
      'name': 'JSL Technology',
      'url': this.baseUrl,
      'logo': {
        '@type': 'ImageObject',
        'url': `${this.baseUrl}/logo.png`,
        'width': 512,
        'height': 512,
      },
      'image': `${this.baseUrl}/assets/imgs/jsl-social-default.jpg`,
      'description': 'Expert software development and digital transformation solutions for businesses worldwide.',
      'address': {
        '@type': 'PostalAddress',
        'addressCountry': 'DO',
        'addressRegion': 'Santo Domingo'
      },
      'geo': {
        '@type': 'GeoCoordinates',
        'latitude': 18.4861,
        'longitude': -69.9312
      },
      'telephone': '+1-809-264-1693',
      'priceRange': '$$',
      'openingHoursSpecification': {
        '@type': 'OpeningHoursSpecification',
        'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        'opens': '09:00',
        'closes': '18:00'
      },
      'sameAs': [
        'https://www.linkedin.com/company/jsl-technology',
        'https://twitter.com/jsl_technology'
      ],
      'contactPoint': [
        {
          '@type': 'ContactPoint',
          'telephone': '+1-809-264-1693',
          'contactType': 'customer service',
          'areaServed': 'Global',
          'availableLanguage': ['Spanish', 'English', 'French', 'Portuguese']
        },
        {
          '@type': 'ContactPoint',
          'contactType': 'sales',
          'areaServed': 'Global',
          'availableLanguage': ['Spanish', 'English']
        }
      ]
    };
    this.setJsonLd(organizationSchema, 'organization-schema', false);
  }

  /**
   * Inyecta rel="prev" / rel="next" para contenido paginado.
   * Llamar con undefined para limpiar los links existentes.
   */
  public setPaginationLinks(prevUrl?: string, nextUrl?: string): void {
    this.document.querySelectorAll('link[rel="prev"], link[rel="next"]').forEach(el => el.remove());

    if (prevUrl) {
      const prev = this.document.createElement('link');
      prev.setAttribute('rel', 'prev');
      prev.setAttribute('href', prevUrl.startsWith('http') ? prevUrl : `${this.baseUrl}${prevUrl}`);
      this.document.head.appendChild(prev);
    }

    if (nextUrl) {
      const next = this.document.createElement('link');
      next.setAttribute('rel', 'next');
      next.setAttribute('href', nextUrl.startsWith('http') ? nextUrl : `${this.baseUrl}${nextUrl}`);
      this.document.head.appendChild(next);
    }
  }

  /**
   * Inyecta Resource Hints (preconnect, dns-prefetch) para optimizar carga.
   */
  public setResourceHints(): void {
    const domains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ];

    domains.forEach(domain => {
      // Preconnect
      if (!this.document.querySelector(`link[rel="preconnect"][href="${domain}"]`)) {
        const preconnect = this.document.createElement('link');
        preconnect.rel = 'preconnect';
        preconnect.href = domain;
        if (domain.includes('gstatic')) {
          preconnect.setAttribute('crossorigin', '');
        }
        this.document.head.appendChild(preconnect);
      }

      // DNS-prefetch
      if (!this.document.querySelector(`link[rel="dns-prefetch"][href="${domain}"]`)) {
        const dnsPrefetch = this.document.createElement('link');
        dnsPrefetch.rel = 'dns-prefetch';
        dnsPrefetch.href = domain;
        this.document.head.appendChild(dnsPrefetch);
      }
    });
  }

  /**
   * Genera e inyecta el esquema de BreadcrumbList.
   */
  public setBreadcrumbs(breadcrumbs: { name: string, item: string }[]): void {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': breadcrumbs.map((breadcrumb, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': breadcrumb.name,
        'item': breadcrumb.item.startsWith('http') ? breadcrumb.item : `${this.baseUrl}${breadcrumb.item}`
      }))
    };
    this.setJsonLd(breadcrumbSchema, 'breadcrumb-schema');
  }

  /**
   * Inject WebSite schema with SearchAction for Sitelinks Searchbox.
   * Call once from the root component or on home navigation.
   */
  public setWebSiteSchema(): void {
    const lang = this.translate.currentLang || 'en';
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${this.baseUrl}/#website`,
      'url': this.baseUrl,
      'name': this.siteName,
      'description': 'Expert software development and digital transformation solutions for businesses worldwide.',
      'publisher': { '@id': `${this.baseUrl}/#organization` },
      'potentialAction': {
        '@type': 'SearchAction',
        'target': {
          '@type': 'EntryPoint',
          'urlTemplate': `${this.baseUrl}/${lang}/blog?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    };
    this.setJsonLd(schema, 'website-schema', false);
  }

  /**
   * Inject AggregateRating + Review schema from testimonial data.
   * @param reviews Array of resolved (already-translated) review objects.
   */
  public setReviewSchema(reviews: Array<{
    authorName: string;
    reviewBody: string;
    ratingValue: number;
    datePublished: string;
  }>): void {
    if (!reviews || reviews.length === 0) return;

    const totalRating = reviews.reduce((sum, r) => sum + r.ratingValue, 0);
    const avgRating = (totalRating / reviews.length).toFixed(1);

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${this.baseUrl}/#organization`,
      'name': this.siteName,
      'url': this.baseUrl,
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': avgRating,
        'bestRating': '5',
        'worstRating': '1',
        'ratingCount': String(reviews.length),
        'reviewCount': String(reviews.length),
      },
      'review': reviews.map(r => ({
        '@type': 'Review',
        'author': {
          '@type': 'Person',
          'name': r.authorName,
        },
        'reviewRating': {
          '@type': 'Rating',
          'ratingValue': String(r.ratingValue),
          'bestRating': '5',
          'worstRating': '1',
        },
        'reviewBody': r.reviewBody,
        'datePublished': r.datePublished,
        'publisher': { '@id': `${this.baseUrl}/#organization` },
      })),
    };
    this.setJsonLd(schema, 'review-schema');
  }

  /**
   * Inject JobPosting schema for career positions.
   * @param jobs Array of resolved job posting data.
   */
  public setJobPostingsSchema(jobs: Array<{
    title: string;
    description: string;
    employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'INTERN';
    jobLocationType: 'TELECOMMUTE' | 'ONSITE' | 'HYBRID';
    datePosted: string;
    validThrough?: string;
  }>): void {
    if (!jobs || jobs.length === 0) return;

    jobs.forEach((job, index) => {
      const schema: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        'title': job.title,
        'description': job.description,
        'datePosted': job.datePosted,
        'employmentType': job.employmentType,
        'jobLocationType': job.jobLocationType,
        'hiringOrganization': {
          '@type': 'Organization',
          '@id': `${this.baseUrl}/#organization`,
          'name': this.siteName,
          'sameAs': this.baseUrl,
          'logo': `${this.baseUrl}/logo.png`,
        },
        'jobLocation': {
          '@type': 'Place',
          'address': {
            '@type': 'PostalAddress',
            'addressCountry': 'DO',
            'addressRegion': 'Santo Domingo',
          },
        },
        'applicantLocationRequirements': {
          '@type': 'Country',
          'name': 'Worldwide',
        },
      };

      if (job.validThrough) {
        schema['validThrough'] = job.validThrough;
      }

      this.setJsonLd(schema, `job-posting-schema-${index}`);
    });
  }

  /**
   * Inject a <link rel="preload"> hint for a critical resource (e.g. hero image).
   * Safe to call multiple times — deduplicates by href.
   */
  public preloadResource(href: string, as: string, type?: string): void {
    if (this.document.querySelector(`link[rel="preload"][href="${href}"]`)) return;
    const link = this.document.createElement('link');
    link.rel = 'preload';
    link.setAttribute('href', href);
    link.setAttribute('as', as);
    link.setAttribute('fetchpriority', 'high');
    if (type) link.setAttribute('type', type);
    this.document.head.appendChild(link);
  }

  /**
   * Inject Google Search Console HTML verification meta tag from token.
   * No-op if the token is not configured.
   */
  private injectGscVerificationTag(): void {
    if (!this.gscToken || this.gscToken.length < 10) return;
    if (this.document.querySelector('meta[name="google-site-verification"]')) return;
    const meta = this.document.createElement('meta');
    meta.setAttribute('name', 'google-site-verification');
    meta.setAttribute('content', this.gscToken);
    this.document.head.appendChild(meta);
  }

  /**
   * Inject VideoObject schema for an embedded video.
   * @param video Video metadata. thumbnailUrl must be absolute.
   */
  public setVideoSchema(video: {
    name: string;
    description: string;
    thumbnailUrl: string;
    uploadDate: string;
    duration?: string;
    embedUrl?: string;
    contentUrl?: string;
  }): void {
    const schema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      'name': video.name,
      'description': video.description,
      'thumbnailUrl': video.thumbnailUrl,
      'uploadDate': video.uploadDate,
      'publisher': { '@id': `${this.baseUrl}/#organization` },
    };
    if (video.duration) schema['duration'] = video.duration;
    if (video.embedUrl) schema['embedUrl'] = video.embedUrl;
    if (video.contentUrl) schema['contentUrl'] = video.contentUrl;
    this.setJsonLd(schema, 'video-schema');
  }

  /**
   * Inject Event schema for a single event.
   * @param event Event data with ISO 8601 dates.
   */
  public setEventSchema(event: {
    name: string;
    description: string;
    startDate: string;
    endDate?: string;
    image: string;
    organizerName: string;
    locationName: string;
    locationUrl?: string;
    eventStatus?: 'EventScheduled' | 'EventPostponed' | 'EventCancelled' | 'EventRescheduled';
    eventAttendanceMode?: 'OfflineEventAttendanceMode' | 'OnlineEventAttendanceMode' | 'MixedEventAttendanceMode';
    url?: string;
  }, id = 'event-schema'): void {
    const schema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      'name': event.name,
      'description': event.description,
      'startDate': event.startDate,
      'image': [event.image],
      'eventStatus': `https://schema.org/${event.eventStatus ?? 'EventScheduled'}`,
      'eventAttendanceMode': `https://schema.org/${event.eventAttendanceMode ?? 'OnlineEventAttendanceMode'}`,
      'organizer': {
        '@type': 'Organization',
        '@id': `${this.baseUrl}/#organization`,
        'name': event.organizerName,
        'url': this.baseUrl,
      },
      'location': {
        '@type': event.eventAttendanceMode === 'OfflineEventAttendanceMode' ? 'Place' : 'VirtualLocation',
        'name': event.locationName,
        ...(event.locationUrl ? { 'url': event.locationUrl } : {}),
      },
    };
    if (event.endDate) schema['endDate'] = event.endDate;
    if (event.url) schema['url'] = event.url;
    this.setJsonLd(schema, id);
  }

  /**
   * Sets article:* Open Graph meta tags for blog posts.
   * Clears any existing article:* tags first to avoid stale values.
   */
  public updateArticleTags(params: {
    publishedTime: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  }): void {
    this.clearArticleTags();

    this.metaService.addTag({ property: 'article:published_time', content: params.publishedTime });
    this.metaService.addTag({ property: 'article:modified_time', content: params.modifiedTime || params.publishedTime });

    if (params.author) {
      this.metaService.addTag({ property: 'article:author', content: params.author });
    }
    if (params.section) {
      this.metaService.addTag({ property: 'article:section', content: params.section });
    }
    if (params.tags?.length) {
      params.tags.forEach(tag => this.metaService.addTag({ property: 'article:tag', content: tag }));
    }
  }

  /**
   * Removes all article:* Open Graph meta tags from the document head.
   * Called automatically on every non-article route transition.
   */
  public clearArticleTags(): void {
    this.document.querySelectorAll('meta[property^="article:"]').forEach(el => el.remove());
  }

  /**
   * 5. ¡MODIFICADO! Actualiza las etiquetas hreflang siendo "SSR-safe".
   */
  private updateHreflangTags(baseUrl: string, pathWithoutLang: string): void {
    
    // 5.1. Limpiar etiquetas hreflang antiguas
    const oldTags = this.document.querySelectorAll('link[rel="alternate"]');
    oldTags.forEach(tag => {
      // Only remove if it's a hreflang tag (not a sitemap or other alternate)
      if (tag.hasAttribute('hreflang')) {
        tag.remove();
      }
    });

    // 5.2. Obtener la URL canónica para la ruta (quitando 'home')
    let canonicalPath = pathWithoutLang === 'home' ? '' : pathWithoutLang;
    canonicalPath = canonicalPath.replace(/\/+$/, '');

    // 5.3. Añadir una etiqueta por cada idioma soportado (Se ejecuta en servidor y cliente)
    this.supportedLangs.forEach(lang => {
      const link: HTMLLinkElement = this.document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', lang);
      const url = canonicalPath ? `${baseUrl}/${lang}/${canonicalPath}` : `${baseUrl}/${lang}`;
      link.setAttribute('href', url);
      this.document.head.appendChild(link);
    });

    // 5.4. Añadir la etiqueta 'x-default' (Se ejecuta en servidor y cliente)
    const defaultLink: HTMLLinkElement = this.document.createElement('link');
    defaultLink.setAttribute('rel', 'alternate');
    defaultLink.setAttribute('hreflang', 'x-default');
    const defaultUrl = canonicalPath ? `${baseUrl}/en/${canonicalPath}` : `${baseUrl}/en`;
    defaultLink.setAttribute('href', defaultUrl); // Usamos 'en' como default
    this.document.head.appendChild(defaultLink);
  }
}
