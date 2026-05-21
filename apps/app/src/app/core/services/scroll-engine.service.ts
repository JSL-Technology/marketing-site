import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import Lenis from 'lenis';

export interface ScrollToOptions {
  offset?: number;
  immediate?: boolean;
  duration?: number;
  easing?: (t: number) => number;
  onComplete?: (lenis: any) => void;
}

// Interface to handle Lenis typing issues if necessary
interface LenisWithScrollTo extends Lenis {
  scrollTo(target: number | string | HTMLElement, options?: any): void;
  stop(): void;
  start(): void;
}

@Injectable({
  providedIn: 'root',
})
export class ScrollEngineService {
  private lenisSubject = new BehaviorSubject<LenisWithScrollTo | null>(null);
  private readySubject = new BehaviorSubject<boolean>(false);
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (!this.isBrowser) {
      this.readySubject.next(true);
    }
  }

  /**
   * Registers the Lenis instance and marks the engine as ready.
   */
  setLenis(lenis: Lenis): void {
    this.lenisSubject.next(lenis as LenisWithScrollTo);
    this.readySubject.next(true);
  }

  /** Pauses smooth scrolling (e.g. when an overlay is open). */
  stop(): void {
    this.lenisSubject.value?.stop();
  }

  /** Resumes smooth scrolling after an overlay closes. */
  start(): void {
    this.lenisSubject.value?.start();
  }

  /**
   * Observable that emits true when the scroll engine is ready to receive commands.
   */
  isReady$(): Observable<boolean> {
    return this.readySubject.asObservable();
  }

  /**
   * Unified scrollTo method that uses Lenis if available, or native window.scrollTo as fallback.
   */
  scrollTo(target: number | string | HTMLElement, options?: ScrollToOptions): void {
    if (!this.isBrowser) return;

    const lenis = this.lenisSubject.value;
    if (lenis) {
      // Lenis scrollTo supports number, string (selector), or HTMLElement
      lenis.scrollTo(target, {
        offset: options?.offset,
        immediate: options?.immediate,
        duration: options?.duration,
        easing: options?.easing,
        onComplete: options?.onComplete,
      });
    } else {
      let top = 0;
      if (typeof target === 'number') {
        top = target;
      } else {
        const el = typeof target === 'string' ? document.getElementById(target) : target;
        if (el) {
          const rect = el.getBoundingClientRect();
          top = rect.top + window.scrollY;
        }
      }

      window.scrollTo({
        top: top + (options?.offset || 0),
        behavior: options?.immediate ? 'auto' : 'smooth',
      });

      if (options?.onComplete) {
        if (options.immediate) {
          options.onComplete(null);
        } else {
          // Simple approximation for native smooth scroll completion
          setTimeout(() => options.onComplete?.(null), (options.duration || 1) * 1000);
        }
      }
    }
  }

  /**
   * Returns the combined height of fixed/sticky headers to use as offset.
   */
  getHeaderOffset(): number {
    if (!this.isBrowser) return 0;

    // We look for the main header component.
    // In this project it seems to be 'jsl-header'.
    const header = document.querySelector('jsl-header');
    if (header) {
      // If the header has a specific height or we can take its offsetHeight
      return (header as HTMLElement).offsetHeight;
    }

    return 0;
  }
}
