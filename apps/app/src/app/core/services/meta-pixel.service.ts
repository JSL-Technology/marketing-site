import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

@Injectable({ providedIn: 'root' })
export class MetaPixelService {
  private loaded = false;
  private pixelId: string = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  init(): void {
    if (!isPlatformBrowser(this.platformId) || this.loaded) return;
    const env = (globalThis as any).__env;
    this.pixelId = env?.META_PIXEL_ID ?? '';
    if (!this.pixelId) return;
    this.injectScript();
    this.loaded = true;
    this.track('PageView');
  }

  track(event: string, params?: Record<string, unknown>): void {
    if (!isPlatformBrowser(this.platformId) || !this.loaded) return;
    try {
      if (typeof window.fbq === 'function') window.fbq('track', event, params);
    } catch {
      // fail silently
    }
  }

  trackLead(params?: { content_name?: string; content_category?: string; value?: number }): void {
    this.track('Lead', params);
  }

  trackCompleteRegistration(params?: { content_name?: string; value?: number }): void {
    this.track('CompleteRegistration', params);
  }

  private injectScript(): void {
    if (this.document.getElementById('meta-pixel-script')) return;
    const PIXEL_ID_REGEX = /^\d{10,20}$/;
    if (!PIXEL_ID_REGEX.test(this.pixelId)) {
      console.warn(`MetaPixelService: invalid pixelId format — skipping injection`);
      return;
    }
    const script = this.document.createElement('script');
    script.id = 'meta-pixel-script';
    script.async = true;
    script.innerHTML = [
      '!function(f,b,e,v,n,t,s)',
      '{if(f.fbq)return;n=f.fbq=function(){n.callMethod?',
      'n.callMethod.apply(n,arguments):n.queue.push(arguments)};',
      'if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version=\'2.0\';',
      'n.queue=[];t=b.createElement(e);t.async=!0;',
      't.src=v;s=b.getElementsByTagName(e)[0];',
      's.parentNode.insertBefore(t,s)}(window,document,\'script\',',
      '\'https://connect.facebook.net/en_US/fbevents.js\');',
      `fbq('init','${this.pixelId}');`,
    ].join('');
    this.document.head.appendChild(script);

    // Build noscript img using DOM APIs (avoid innerHTML interpolation)
    const noscript = this.document.createElement('noscript');
    const img = this.document.createElement('img');
    img.height = 1;
    img.width = 1;
    img.style.display = 'none';
    img.src = `https://www.facebook.com/tr?id=${encodeURIComponent(this.pixelId)}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    this.document.body?.appendChild(noscript);
  }
}
