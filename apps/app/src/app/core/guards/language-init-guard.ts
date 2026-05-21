import { Injectable, inject, PLATFORM_ID, Inject } from '@angular/core';
// --- 1. IMPORTAR DOCUMENT ---
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { CanActivateFn, ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CookieService } from 'ngx-cookie-service';
import { SUPPORTED_LANGUAGES } from '../constants/languages';
import { buildLocalizedUrl, normalizeLang, detectPreferredLanguage } from '../utils/language-url';
import { Optional } from '@angular/core';
import { REQUEST } from '../constants/tokens';

@Injectable({ providedIn: 'root' })
export class LanguageInitService {
  constructor(
    private translate: TranslateService,
    private router: Router,
    private cookieService: CookieService,
    @Inject(PLATFORM_ID) private platformId: object,
    // --- 2. INYECTAR DOCUMENT ---
    @Inject(DOCUMENT) private document: Document,
    @Optional() @Inject(REQUEST) private request: any
  ) {}

  initLanguage(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const lang = normalizeLang(route.params['lang']);
    const supportedLangs = this.translate.getLangs().length ? this.translate.getLangs() : SUPPORTED_LANGUAGES;

    if (supportedLangs.includes(lang)) {
      // 1. Activar el idioma en ngx-translate (Se ejecuta en servidor y cliente)
      this.translate.use(lang);

      // --- 3. ACTUALIZAR <html lang=""> (Se ejecuta en servidor y cliente) ---
      // Esto es crucial para la accesibilidad y el SEO en la carga inicial.
      this.document.documentElement.lang = lang;

      if (isPlatformBrowser(this.platformId)) {
        // 2. Guardar la preferencia en localStorage (Solo se ejecuta en el cliente)
        localStorage.setItem('jsl_lang', lang);
        this.cookieService.set('lang', lang, { expires: 365, path: '/' });
      }
      return true; // Permitir el acceso a la ruta
    } else {
      // Si el idioma en la URL no es válido (p.ej. /fr/home o /home cuando no hay prefijo)
      // Redirigir a la versión detectada o por defecto de la misma ruta

      const defaultLang = 'en';
      let langToUse = defaultLang;

      if (isPlatformBrowser(this.platformId)) {
        const storedLang = this.cookieService.get('lang') || localStorage.getItem('jsl_lang');
        if (storedLang && supportedLangs.includes(storedLang)) {
          langToUse = storedLang;
        } else {
          const browserLang = this.translate.getBrowserLang() || '';
          langToUse = supportedLangs.includes(browserLang) ? browserLang : defaultLang;
        }
      } else if (this.request) {
        // SSR Language Detection
        langToUse = detectPreferredLanguage(
          this.request.headers['accept-language'],
          this.request.headers['cookie'],
          supportedLangs,
          defaultLang
        );
      }

      // Prependemos el idioma detectado a la URL original.
      // state.url contiene la ruta completa empezando por '/'.
      const targetUrl = buildLocalizedUrl(state.url, langToUse, supportedLangs);

      this.router.navigateByUrl(targetUrl, { replaceUrl: true });
      return false;
    }
  }
}

export const languageInitGuard: CanActivateFn = (route, state) => {
  return inject(LanguageInitService).initLanguage(route, state);
};