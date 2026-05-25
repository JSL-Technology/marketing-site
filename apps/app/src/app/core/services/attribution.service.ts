import { Injectable, Inject, PLATFORM_ID, DestroyRef, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface UtmTouch {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  timestamp: number;
  page: string;
}

export interface AttributionData {
  firstTouch: UtmTouch | null;
  lastTouch: UtmTouch | null;
  touchCount: number;
  allTouches: UtmTouch[];
}

const STORAGE_KEY = 'jsl_utm_touches';
const MAX_TOUCHES = 10;

@Injectable({ providedIn: 'root' })
export class AttributionService {
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private router: Router,
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.captureCurrentTouch();
      this.router.events
        .pipe(
          filter((e): e is NavigationEnd => e instanceof NavigationEnd),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => this.captureCurrentTouch());
    }
  }

  getAttributionData(): AttributionData {
    const touches = this.loadTouches();
    return {
      firstTouch: touches[0] ?? null,
      lastTouch: touches[touches.length - 1] ?? null,
      touchCount: touches.length,
      allTouches: touches,
    };
  }

  getFirstTouch(): UtmTouch | null {
    return this.loadTouches()[0] ?? null;
  }

  getLastTouch(): UtmTouch | null {
    const t = this.loadTouches();
    return t[t.length - 1] ?? null;
  }

  getBrevoAttributes(): Record<string, string> {
    const data = this.getAttributionData();
    const first = data.firstTouch;
    const last = data.lastTouch;
    const attrs: Record<string, string> = {};
    if (first?.utm_source) attrs['FIRST_TOUCH_SOURCE'] = first.utm_source;
    if (first?.utm_medium) attrs['FIRST_TOUCH_MEDIUM'] = first.utm_medium;
    if (first?.utm_campaign) attrs['FIRST_TOUCH_CAMPAIGN'] = first.utm_campaign;
    if (last?.utm_source) attrs['LAST_TOUCH_SOURCE'] = last.utm_source;
    if (last?.utm_medium) attrs['LAST_TOUCH_MEDIUM'] = last.utm_medium;
    if (last?.utm_campaign) attrs['LAST_TOUCH_CAMPAIGN'] = last.utm_campaign;
    attrs['TOUCH_COUNT'] = String(data.touchCount);
    return attrs;
  }

  private captureCurrentTouch(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const params = new URLSearchParams(window.location.search);
    const source = params.get('utm_source');
    if (!source) return;

    const touch: UtmTouch = {
      utm_source: source,
      utm_medium: params.get('utm_medium') ?? undefined,
      utm_campaign: params.get('utm_campaign') ?? undefined,
      utm_term: params.get('utm_term') ?? undefined,
      utm_content: params.get('utm_content') ?? undefined,
      timestamp: Date.now(),
      page: window.location.pathname,
    };

    const touches = this.loadTouches();
    const last = touches[touches.length - 1];
    // Deduplicate: skip if same source/campaign within 30 min
    if (last && last.utm_source === touch.utm_source && last.utm_campaign === touch.utm_campaign
        && (touch.timestamp - last.timestamp) < 1800000) return;

    touches.push(touch);
    if (touches.length > MAX_TOUCHES) touches.splice(0, touches.length - MAX_TOUCHES);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(touches));
    } catch {
      // storage full — ignore
    }
  }

  private loadTouches(): UtmTouch[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as UtmTouch[]) : [];
    } catch {
      return [];
    }
  }
}
