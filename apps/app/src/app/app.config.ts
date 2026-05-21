import {
  ApplicationConfig,
  importProvidersFrom,
  provideZonelessChangeDetection,
  PLATFORM_ID,
  isDevMode,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { BASE_URL } from './core/constants/tokens';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { CookieService } from 'ngx-cookie-service';
import { ALL_ICONS } from './core/constants/icons';

import { routes } from './app.routes';

// Carga estática de traducciones para SSR
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

export function createTranslateLoader(): TranslateLoader {
  return {
    getTranslation: (lang: string): Observable<any> => {
      switch (lang) {
        case 'es':
          return of(es);
        case 'ar':
          return of(ar);
        case 'de':
          return of(de);
        case 'fr':
          return of(fr);
        case 'it':
          return of(it);
        case 'ja':
          return of(ja);
        case 'ko':
          return of(ko);
        case 'pt':
          return of(pt);
        case 'zh':
          return of(zh);
        case 'ht':
          return of(ht);
        default:
          return of(en);
      }
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
        // Valor por defecto para SSR, puede ser sobreescrito en app.config.server.ts o via REQUEST
        return 'https://www.jsl.technology';
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