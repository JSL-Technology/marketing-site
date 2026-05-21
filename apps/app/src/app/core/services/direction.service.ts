import { Injectable, Inject, signal, WritableSignal, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { isRtlLanguage } from '@core/constants/languages';

@Injectable({
  providedIn: 'root',
})
export class DirectionService {
  public isRtl: WritableSignal<boolean> = signal(false);

  constructor(
    private translate: TranslateService,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.init();
  }

  private init(): void {
    // Initial check
    this.syncDirection(this.translate.currentLang || this.translate.getDefaultLang() || 'en');

    // Subscribe to language changes
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.syncDirection(event.lang);
    });
  }

  public syncDirection(lang: string): void {
    const isRtl = isRtlLanguage(lang);
    this.isRtl.set(isRtl);

    const dir = isRtl ? 'rtl' : 'ltr';
    this.document.documentElement.setAttribute('dir', dir);
    this.document.documentElement.setAttribute('lang', lang);

    if (isPlatformBrowser(this.platformId)) {
      this.document.body.setAttribute('dir', dir);
      this.document.body.style.setProperty('--dir', isRtl ? '-1' : '1');
    }
  }
}
