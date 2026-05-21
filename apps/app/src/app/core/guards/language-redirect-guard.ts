import { Injectable, inject, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CookieService } from 'ngx-cookie-service';
import { SUPPORTED_LANGUAGES } from '../constants/languages';
import { buildLocalizedUrl, detectPreferredLanguage } from '../utils/language-url';
import { Optional } from '@angular/core';
import { REQUEST } from '../constants/tokens';

@Injectable({ providedIn: 'root' })
export class LanguageRedirectService {
  constructor(
    private router: Router,
    private translate: TranslateService,
    private cookieService: CookieService,
    @Inject(PLATFORM_ID) private platformId: object,
    @Optional() @Inject(REQUEST) private request: any
  ) {}

  redirect(state: RouterStateSnapshot): UrlTree {
    const defaultLang = 'en';
    const supportedLangs = this.translate.getLangs().length ? this.translate.getLangs() : SUPPORTED_LANGUAGES;

    let storedLang: string | null = null;

    if (isPlatformBrowser(this.platformId)) {
      storedLang = this.cookieService.get('lang') || localStorage.getItem('jsl_lang');

      if (!storedLang) {
        const browserLang = this.translate.getBrowserLang() || '';
        storedLang = supportedLangs.includes(browserLang) ? browserLang : defaultLang;
      }
    } else if (this.request) {
      storedLang = detectPreferredLanguage(
        this.request.headers['accept-language'],
        this.request.headers['cookie'],
        supportedLangs,
        defaultLang
      );
    }

    const langToUse = storedLang && supportedLangs.includes(storedLang) ? storedLang : defaultLang;
    const targetUrl = buildLocalizedUrl(state.url, langToUse, supportedLangs);

    return this.router.parseUrl(targetUrl);
  }
}

export const languageRedirectGuard: CanActivateFn = (route, state) => {
  return inject(LanguageRedirectService).redirect(state);
};