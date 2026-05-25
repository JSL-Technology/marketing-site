import { Injectable, Inject, PLATFORM_ID, Optional, isDevMode, DestroyRef, inject, OnDestroy } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GA_MEASUREMENT_ID } from '../constants/tokens';
import { EVENT_CATALOG, isKnownEvent, DeviceCategory } from './analytics-events';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService implements OnDestroy {
  private initialized = false;
  private currentLeadId: string | null = null;
  private interactionId: string = this.generateId('int');
  private eventQueue: Array<{ name: string; params: Record<string, unknown> }> = [];
  private formStartTimes: Record<string, number> = {};
  private scrollDepthReported = new Set<number>();
  private cwvInitialized = false;
  private readonly destroyRef = inject(DestroyRef);
  private performanceObservers: PerformanceObserver[] = [];
  private scrollDepthCleanups: Array<() => void> = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    @Inject(DOCUMENT) private document: Document,
    private router: Router,
    @Optional() @Inject(GA_MEASUREMENT_ID) private measurementId: string,
  ) {
    this.measurementId = measurementId || '';
  }

  init(): void {
    if (!isPlatformBrowser(this.platformId) || this.initialized || !this.measurementId.startsWith('G-')) return;
    this.loadGtagScript();
    this.trackPageViews();
    this.initialized = true;
    this.flushQueue();
    this.initScrollDepthTracking();
    this.initCwvTracking();
  }

  trackEvent(eventName: string, params: Record<string, unknown> = {}): string {
    const eventId = this.generateId('evt');
    const payload = { ...this.getCommonParams(), ...params, event_id: eventId, event_name: eventName };

    if (!this.validateEventPayload(eventName, payload)) {
      this.emitInternalError('error_event_schema_mismatch', { schema_issue: eventName });
    }

    if (!isPlatformBrowser(this.platformId) || !this.initialized) {
      this.eventQueue.push({ name: eventName, params: payload });
      return eventId;
    }

    this.dispatchEvent(eventName, payload);
    return eventId;
  }

  trackExperimentExposure(experimentName: string, variant: string): void {
    this.trackEvent('experiment_exposure', { experiment_name: experimentName, variant });
  }

  setLeadId(leadId: string): void { this.currentLeadId = leadId; }
  getLeadId(): string | null { return this.currentLeadId; }
  getInteractionId(): string { return this.interactionId; }

  startFormTimer(formName: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.formStartTimes[formName] = Date.now();
  }

  getFormElapsedTime(formName: string): number | null {
    const start = this.formStartTimes[formName];
    return start ? Math.floor((Date.now() - start) / 1000) : null;
  }

  trackConversion(label: string, value?: number): void {
    this.trackEvent('cta_click', { cta_name: label, cta_position: 'conversion', value });
  }

  getClientId(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const existing = localStorage.getItem('jsl_client_id');
    if (existing) return existing;
    const created = this.generateId('cid');
    localStorage.setItem('jsl_client_id', created);
    return created;
  }

  getDeviceCategory(): DeviceCategory {
    if (!isPlatformBrowser(this.platformId)) return 'unknown';
    const ua = navigator.userAgent.toLowerCase();
    if (/bot|spider|crawler/.test(ua)) return 'bot';
    if (/tablet|ipad/.test(ua)) return 'tablet';
    if (/mobile|android|iphone/.test(ua)) return 'mobile';
    return 'desktop';
  }

  // --- Scroll-depth tracking via IntersectionObserver ---
  initScrollDepthTracking(): void {
    if (!isPlatformBrowser(this.platformId) || typeof IntersectionObserver === 'undefined') return;

    // Clean up previous sentinels and observers
    this.cleanupScrollDepthSentinels();

    const milestones = [25, 50, 75, 90];
    milestones.forEach((pct) => {
      const sentinel = this.document.createElement('div');
      sentinel.setAttribute('aria-hidden', 'true');
      sentinel.style.cssText = 'position:absolute;left:0;width:1px;height:1px;pointer-events:none;';

      // Wait for body to be ready
      requestAnimationFrame(() => {
        const docHeight = Math.max(
          this.document.body.scrollHeight,
          this.document.documentElement.scrollHeight,
        );
        sentinel.style.top = `${Math.floor((pct / 100) * docHeight)}px`;
        this.document.body.appendChild(sentinel);

        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting && !this.scrollDepthReported.has(pct)) {
                this.scrollDepthReported.add(pct);
                this.trackEvent('scroll_depth', { percentile: pct });
                observer.disconnect();
              }
            });
          },
          { threshold: 0 },
        );
        observer.observe(sentinel);

        // Store cleanup
        this.scrollDepthCleanups.push(() => {
          try { observer.disconnect(); } catch { /* ignore */ }
          try { sentinel.remove(); } catch { /* ignore */ }
        });
      });
    });
  }

  private cleanupScrollDepthSentinels(): void {
    this.scrollDepthCleanups.forEach((cleanup) => cleanup());
    this.scrollDepthCleanups = [];
  }

  // --- Core Web Vitals via PerformanceObserver ---
  initCwvTracking(): void {
    if (!isPlatformBrowser(this.platformId) || this.cwvInitialized) return;
    this.cwvInitialized = true;

    // LCP
    this.observePerformanceEntry('largest-contentful-paint', (entries) => {
      const last = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
      const value = last.renderTime || last.loadTime || last.startTime;
      this.trackEvent('cwv_metric', { metric_name: 'LCP', value: Math.round(value), unit: 'ms' });
    });

    // CLS
    let clsValue = 0;
    this.observePerformanceEntry('layout-shift', (entries) => {
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) clsValue += entry.value;
      });
    });
    // Report CLS on page hide
    this.document.addEventListener('visibilitychange', () => {
      if (this.document.visibilityState === 'hidden') {
        this.trackEvent('cwv_metric', { metric_name: 'CLS', value: parseFloat(clsValue.toFixed(4)), unit: 'score' });
      }
    }, { once: true });

    // FID
    this.observePerformanceEntry('first-input', (entries) => {
      const first = entries[0] as PerformanceEntry & { processingStart: number };
      const value = first.processingStart - first.startTime;
      this.trackEvent('cwv_metric', { metric_name: 'FID', value: Math.round(value), unit: 'ms' });
    });

    // FCP via navigation timing
    this.observePerformanceEntry('paint', (entries) => {
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.trackEvent('cwv_metric', { metric_name: 'FCP', value: Math.round(entry.startTime), unit: 'ms' });
        }
      });
    });
  }

  private observePerformanceEntry(type: string, callback: (entries: PerformanceEntry[]) => void): void {
    try {
      if (!PerformanceObserver.supportedEntryTypes?.includes(type)) return;
      const observer = new PerformanceObserver((list) => callback(list.getEntries()));
      observer.observe({ type, buffered: true });
      this.performanceObservers.push(observer);
    } catch {
      // browser doesn't support this entry type
    }
  }

  ngOnDestroy(): void {
    this.performanceObservers.forEach((obs) => {
      try { obs.disconnect(); } catch { /* ignore */ }
    });
    this.performanceObservers = [];
    this.cleanupScrollDepthSentinels();
  }

  private getCommonParams(): Record<string, unknown> {
    const route = this.router.url || '/';
    const lang = route.split('/')[1] || 'en';
    const utms = this.getUtms();
    return {
      interaction_id: this.interactionId,
      lang,
      route,
      segment: isPlatformBrowser(this.platformId) ? localStorage.getItem('jsl_user_segment') ?? 'unknown' : 'unknown',
      source: utms.utm_source ?? 'direct',
      device: this.getDeviceCategory(),
      lead_id: this.currentLeadId,
      ...utms,
    };
  }

  private getUtms(): Record<string, string> {
    if (!isPlatformBrowser(this.platformId)) return {};
    const params = new URLSearchParams(window.location.search);
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    return keys.reduce((acc, key) => {
      const value = params.get(key);
      if (value) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
  }

  private validateEventPayload(eventName: string, params: Record<string, unknown>): boolean {
    if (!isKnownEvent(eventName)) return true;
    const required = ['event_id', 'event_name', 'lang', 'route', 'segment', 'source', 'device'];
    const missingRequired = required.filter((k) => params[k] === undefined || params[k] === null || params[k] === '');
    const missingCatalog = (EVENT_CATALOG[eventName] ?? []).filter((k) => params[k] === undefined || params[k] === null || params[k] === '');
    const ok = missingRequired.length === 0 && missingCatalog.length === 0;
    if (!ok && isDevMode()) {
      console.warn(`[Analytics] mismatch in ${eventName}`, { missingRequired, missingCatalog });
    }
    return ok;
  }

  private dispatchEvent(name: string, params: Record<string, unknown>): void {
    try {
      if (typeof window.gtag === 'function') window.gtag('event', name, params);
      if (isDevMode()) console.log('[Analytics]', name, params);
    } catch {
      // fail silently
    }
  }

  private emitInternalError(eventName: 'error_tracking_missing' | 'error_event_schema_mismatch', params: Record<string, unknown>): void {
    if (!isPlatformBrowser(this.platformId) || !this.initialized) return;
    this.dispatchEvent(eventName, { ...this.getCommonParams(), ...params, event_id: this.generateId('evt'), event_name: eventName });
  }

  private flushQueue(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.eventQueue.splice(0).forEach((item) => this.dispatchEvent(item.name, item.params));
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  private loadGtagScript(): void {
    const existingScript = this.document.getElementById('gtag-script');
    if (existingScript || !isPlatformBrowser(this.platformId)) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: any[]) { window.dataLayer.push(args); };
    window.gtag('js', new Date());
    window.gtag('config', this.measurementId, { send_page_view: false });
    const script = this.document.createElement('script');
    script.id = 'gtag-script'; script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    this.document.head.appendChild(script);
  }

  private trackPageViews(): void {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((event) => {
      // Reset scroll depth on navigation
      this.scrollDepthReported.clear();
      this.cleanupScrollDepthSentinels();
      this.initScrollDepthTracking();
      this.trackEvent('funnel_landing_view', { page_location: `${this.document.location.origin}${event.urlAfterRedirects}` });
    });
  }
}
