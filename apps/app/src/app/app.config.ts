import {
  ApplicationConfig,
  importProvidersFrom,
  provideZonelessChangeDetection,
  PLATFORM_ID,
  isDevMode,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, HttpClient } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { BASE_URL } from './core/constants/tokens';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { CookieService } from 'ngx-cookie-service';
import { ALL_ICONS } from './core/constants/icons';

import { routes } from './app.routes';

// Static SSR fallbacks — all 11 languages bundled for correct server-side rendering.
// On the browser, translations are loaded lazily via HttpClient (only the needed language).
// Tradeoff: these static imports increase the SSR bundle size (~50-100 KB total for 11 langs),
// but browser clients only download one language file on demand, improving client-side performance.
import * as en from '@assets/i18n/en.json';
import * as es from '@assets/i18n/es.json';
import * as ar from '@assets/i18n/ar.json';
import * as de from '@assets/i18n/de.json';
import * as fr from '@assets/i18n/fr.json';
import * as it from '@assets/i18n/it.json';
import * as ja from '@assets/i18n/ja.json';
import * as ko from '@assets/i18n/ko.json';
import * as pt from '@assets/i18n/pt.json';
import * as zh from '@assets/i18n/zh.json';
import * as ht from '@assets/i18n/ht.json';

const SSR_TRANSLATIONS: Record<string, any> = { en, es, ar, de, fr, it, ja, ko, pt, zh, ht };

export function createTranslateLoader(platformId: object, http: HttpClient): TranslateLoader {
  return {
    getTranslation: (lang: string): Observable<any> => {
      // On server: use bundled static fallbacks (all 11 languages available for correct SSR)
      if (!isPlatformBrowser(platformId)) {
        return of(SSR_TRANSLATIONS[lang] ?? SSR_TRANSLATIONS['en']);
      }
      // On browser: lazy load only the needed language from assets via HTTP
      return http.get<any>(`/assets/i18n/${lang}.json`).pipe(
        catchError(() => of(SSR_TRANSLATIONS[lang] ?? SSR_TRANSLATIONS['en'])),
      );
    },
  } as TranslateLoader;
}

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: BASE_URL,
      useFactory: (platformId: object, document: Document) => {
        if (isPlatformBrowser(platformId)) {
          return document.location.origin;
        }
        // Fallback for SSR if not provided by server.ts.
        // This value is usually overridden by the provider in server.ts
        return 'https://jsl.technology';
      },
      deps: [PLATFORM_ID, DOCUMENT],
    },
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'disabled' }),
    ),
    /*
      NOTE: Native scroll restoration only handles the main window scroll.
      Internal scroll containers (overflow: auto/scroll) are not covered by this solution.
    */
    provideHttpClient(withFetch()),
    provideAnimationsAsync(),
    provideTranslateService({
      fallbackLang: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [PLATFORM_ID, HttpClient],
      },
    }),
    importProvidersFrom(LucideAngularModule.pick(ALL_ICONS)),
    CookieService,
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
