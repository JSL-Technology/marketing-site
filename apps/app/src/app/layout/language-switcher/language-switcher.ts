// src/app/layout/language-switcher/language-switcher.ts

import { Component, Inject, OnInit, OnDestroy, ElementRef, inject } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ClickOutsideDirective } from '@shared/directives/click-outside';
import { BottomSheetComponent } from '@shared/components/bottom-sheet/bottom-sheet';
import { LanguageListComponent } from './language-list';
import { LanguageSuggestionService } from '@core/services/language-suggestion.service';
import { BreakpointService } from '@core/services/breakpoint.service';

export interface LanguageItem {
  code: string;
  nativeName: string;
  translatedName: string;
}

@Component({
  selector: 'jsl-language-switcher',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    LucideAngularModule,
    ClickOutsideDirective,
    BottomSheetComponent,
    LanguageListComponent,
  ],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.scss',
})
export class LanguageSwitcher implements OnInit, OnDestroy {
  public currentLang = 'es';
  public isDropdownOpen = false;
  public languages: LanguageItem[] = [];
  public featuredLanguages: LanguageItem[] = [];
  public otherLanguages: LanguageItem[] = [];
  public showAllLanguages = false;
  public opensUp = false;

  public breakpointService = inject(BreakpointService);

  private routerSubscription: Subscription | undefined;
  public currentRouteWithoutLang: string[] = [];

  // Define which languages are considered "featured"
  private readonly FEATURED_CODES = ['en', 'es', 'pt', 'fr'];

  private readonly NATIVE_NAMES: Record<string, string> = {
    'es': 'Español',
    'en': 'English',
    'pt': 'Português',
    'fr': 'Français',
    'de': 'Deutsch',
    'ar': 'العربية',
    'it': 'Italiano',
    'ja': '日本語',
    'ko': '한국어',
    'zh': '中文',
    'ht': 'Kreyòl Ayisyen'
  };

  constructor(
    @Inject(TranslateService) public translate: TranslateService,
    private router: Router,
    private elementRef: ElementRef,
    private langSuggestion: LanguageSuggestionService,
  ) {}

  ngOnInit(): void {
    this.setupLanguages();

    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentLang = this.translate.currentLang || 'es';
        this.updateCurrentRoute(event.urlAfterRedirects);
        this.closeDropdown();
        this.categorizeLanguages();
      });

    this.updateCurrentRoute(this.router.url);
    this.categorizeLanguages();
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  private setupLanguages(): void {
    this.languages = this.translate.getLangs().map(lang => ({
      code: lang,
      nativeName: this.NATIVE_NAMES[lang] || lang.toUpperCase(),
      translatedName: `LANG.${lang.toUpperCase()}`,
    }));
    this.categorizeLanguages();
  }

  private categorizeLanguages(): void {
    this.currentLang = this.translate.currentLang || 'es';

    // 1. Featured are the current lang + specific ones from FEATURED_CODES
    const featured = this.languages.filter(lang =>
      lang.code === this.currentLang || this.FEATURED_CODES.includes(lang.code)
    );

    // 2. Sort featured: current language first, then the rest of FEATURED_CODES in order
    this.featuredLanguages = featured.sort((a, b) => {
      if (a.code === this.currentLang) return -1;
      if (b.code === this.currentLang) return 1;

      const aIdx = this.FEATURED_CODES.indexOf(a.code);
      const bIdx = this.FEATURED_CODES.indexOf(b.code);

      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;

      return a.code.localeCompare(b.code);
    });

    // 3. Others are those not in featured
    this.otherLanguages = this.languages
      .filter(lang => !this.featuredLanguages.find(f => f.code === lang.code))
      .sort((a, b) => a.code.localeCompare(b.code));
  }

  private updateCurrentRoute(currentUrl: string): void {
    const segments = currentUrl.split('/');
    this.currentRouteWithoutLang = segments.slice(2);
  }

  public getRouteForLang(langCode: string): string[] {
    return [`/${langCode}`, ...this.currentRouteWithoutLang];
  }

  public setLanguage(langCode: string): void {
    this.langSuggestion.dismiss();
    this.translate.use(langCode);
    this.currentLang = langCode;
  }

  toggleDropdown(): void {
    // Calculate position before opening
    if (!this.isDropdownOpen) {
      this.calculateDropdownPosition();
      this.showAllLanguages = false; // Reset expansion when opening
    }
    this.isDropdownOpen = !this.isDropdownOpen;

    // Body scroll lock on mobile
    if (this.breakpointService.isMobile()) {
      if (this.isDropdownOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
    if (this.breakpointService.isMobile()) {
      document.body.style.overflow = '';
    }
  }

  toggleMoreLanguages(event: Event): void {
    event.stopPropagation();
    this.showAllLanguages = !this.showAllLanguages;
  }

  private calculateDropdownPosition(): void {
    const elementRect = this.elementRef.nativeElement.getBoundingClientRect();
    const spaceBelow = window.innerHeight - elementRect.bottom;

    // Max height set in SCSS
    const MAX_DROPDOWN_HEIGHT = 450;

    // Estimate dropdown height
    const estimatedHeight = 400;

    // If not enough space below, open upwards
    this.opensUp = spaceBelow < estimatedHeight;
  }
}