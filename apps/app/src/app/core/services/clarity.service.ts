import { Injectable, Inject, PLATFORM_ID, Optional } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { CLARITY_PROJECT_ID } from '../constants/tokens';

declare global {
  interface Window {
    clarity: (command: string, ...args: any[]) => void;
  }
}

@Injectable({ providedIn: 'root' })
export class ClarityService {
  private loaded = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    @Inject(DOCUMENT) private document: Document,
    @Optional() @Inject(CLARITY_PROJECT_ID) private projectId: string,
  ) {
    this.projectId = projectId || '';
  }

  init(): void {
    if (!isPlatformBrowser(this.platformId) || this.loaded || !this.projectId) return;
    this.injectScript();
    this.loaded = true;
  }

  identify(userId: string, segment?: string): void {
    if (!isPlatformBrowser(this.platformId) || !this.loaded) return;
    try {
      if (typeof window.clarity === 'function') {
        window.clarity('identify', userId);
        if (segment) window.clarity('set', 'segment', segment);
      }
    } catch {
      // fail silently
    }
  }

  setTag(key: string, value: string): void {
    if (!isPlatformBrowser(this.platformId) || !this.loaded) return;
    try {
      if (typeof window.clarity === 'function') window.clarity('set', key, value);
    } catch {
      // fail silently
    }
  }

  private injectScript(): void {
    if (this.document.getElementById('clarity-script')) return;
    // Validate projectId to prevent script injection
    const ID_REGEX = /^[a-zA-Z0-9_-]{4,32}$/;
    if (!ID_REGEX.test(this.projectId)) {
      console.warn(`ClarityService: invalid projectId format — skipping injection`);
      return;
    }
    const script = this.document.createElement('script');
    script.id = 'clarity-script';
    script.async = true;
    script.innerHTML = [
      '(function(c,l,a,r,i,t,y){',
      'c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};',
      't=l.createElement(r);t.async=1;',
      't.src="https://www.clarity.ms/tag/"+i;',
      'y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);',
      `})(window,document,"clarity","script","${this.projectId}");`,
    ].join('');
    this.document.head.appendChild(script);
  }
}
