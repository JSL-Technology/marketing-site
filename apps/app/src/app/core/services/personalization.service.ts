import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

export type UserSegment = 'startup' | 'enterprise' | 'small-business' | 'investor' | 'unknown';

@Injectable({ providedIn: 'root' })
export class PersonalizationService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  public visitedCategories = signal<string[]>([]);
  public userSegment = signal<UserSegment>('unknown');
  public currentLang = signal<string>('es');

  private readonly VISITED_CATEGORIES_KEY = 'jsl_visited_categories';
  private readonly USER_SEGMENT_KEY = 'jsl_user_segment';
  private readonly PAGE_TIME_KEY = 'jsl_page_times';
  private pageEnterTime = 0;

  constructor() {
    const translate = inject(TranslateService);
    this.currentLang.set(translate.currentLang || translate.defaultLang || 'es');
    translate.onLangChange.pipe(takeUntilDestroyed()).subscribe((event: any) => {
      this.currentLang.set(event.lang);
    });

    if (isPlatformBrowser(this.platformId)) {
      this.loadData();
      this.trackNavigation();
      this.pageEnterTime = Date.now();
    }
  }

  private loadData(): void {
    const savedCategories = localStorage.getItem(this.VISITED_CATEGORIES_KEY);
    if (savedCategories) {
      try { this.visitedCategories.set(JSON.parse(savedCategories)); } catch { /* ignore */ }
    }
    const savedSegment = localStorage.getItem(this.USER_SEGMENT_KEY) as UserSegment;
    if (savedSegment) this.userSegment.set(savedSegment);
  }

  private trackNavigation(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const url = event.urlAfterRedirects;

        if (url.includes('/solutions/')) {
          this.addVisitedCategory(url.split('/solutions/')[1].split('/')[0]);
        } else if (url.includes('/products/')) {
          this.addVisitedCategory(url.split('/products/')[1].split('/')[0]);
        }

        // Segment detection: explicit ?segment= param first
        const urlParams = new URLSearchParams(window.location.search);
        const explicitSegment = urlParams.get('segment') as UserSegment;
        if (explicitSegment && ['startup', 'enterprise', 'small-business', 'investor'].includes(explicitSegment)) {
          this.setSegment(explicitSegment);
          return;
        }

        const utmSource = urlParams.get('utm_source')?.toLowerCase() ?? '';
        const utmMedium = urlParams.get('utm_medium')?.toLowerCase() ?? '';
        const utmCampaign = urlParams.get('utm_campaign')?.toLowerCase() ?? '';

        // Enterprise signals
        if (
          utmSource === 'linkedin' || utmMedium === 'linkedin' ||
          utmCampaign.includes('enterprise') || utmCampaign.includes('b2b') ||
          utmSource === 'salesforce' || utmSource === 'hubspot' ||
          (utmMedium === 'cpc' && utmCampaign.includes('enterprise'))
        ) {
          this.setSegment('enterprise');
          return;
        }

        // Startup signals
        if (
          utmSource === 'producthunt' || utmSource === 'ycombinator' ||
          utmSource === 'angellist' || utmSource === 'crunchbase' ||
          utmCampaign.includes('startup') || utmMedium === 'startup' ||
          utmSource === 'hacker-news' || utmSource === 'hackernews'
        ) {
          this.setSegment('startup');
          return;
        }

        // Small-business / social signals
        if (
          utmSource === 'twitter' || utmSource === 'instagram' ||
          utmSource === 'facebook' || utmMedium === 'social' ||
          utmSource === 'youtube' || utmSource === 'tiktok' ||
          utmSource === 'pinterest' || utmMedium === 'social-media'
        ) {
          this.setSegment('small-business');
          return;
        }

        // Investor signals
        if (
          utmSource === 'crunchbase' || utmCampaign.includes('investor') ||
          utmSource === 'pitchbook' || utmMedium === 'investor'
        ) {
          this.setSegment('investor');
        }
      });
  }

  private addVisitedCategory(category: string): void {
    const current = this.visitedCategories();
    if (!current.includes(category)) {
      const updated = [category, ...current].slice(0, 10); // Keep last 10
      this.visitedCategories.set(updated);
      try {
        localStorage.setItem(this.VISITED_CATEGORIES_KEY, JSON.stringify(updated));
      } catch { /* storage full */ }
    }
  }

  public setSegment(segment: UserSegment): void {
    this.userSegment.set(segment);
    try { localStorage.setItem(this.USER_SEGMENT_KEY, segment); } catch { /* ignore */ }
  }

  public getMostVisitedCategory(): string | null {
    return this.visitedCategories()[0] || null;
  }

  public getPersonalizedHeroTitle(defaultKey: string): string {
    const category = this.getMostVisitedCategory();
    const segment = this.userSegment();

    if (segment === 'startup') return 'HOME.HERO_STARTUP';
    if (segment === 'enterprise') return 'HOME.HERO_ENTERPRISE';
    if (segment === 'investor') return 'HOME.HERO_INVESTOR';

    if (category === 'web-development') return 'HOME.HERO_WEB';
    if (category === 'mobile-apps') return 'HOME.HERO_MOBILE';
    if (category === 'erp') return 'HOME.HERO_ERP';

    return defaultKey;
  }
}
