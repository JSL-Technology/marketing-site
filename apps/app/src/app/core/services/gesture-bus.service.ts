import { Injectable, NgZone, OnDestroy, inject, PLATFORM_ID, isDevMode } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AnalyticsService } from './analytics.service';

export interface GestureHandler {
  name: string;
  priority: number;
  onPointerDown?: (event: PointerEvent) => boolean | void;
  onPointerMove?: (event: PointerEvent) => void;
  onPointerUp?: (event: PointerEvent) => void;
  onPointerCancel?: (event: PointerEvent) => void;
}

@Injectable({
  providedIn: 'root',
})
export class GestureBusService implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private isBrowser = isPlatformBrowser(this.platformId);
  private analytics = inject(AnalyticsService);

  private handlers: GestureHandler[] = [];
  private activeHandler: GestureHandler | null = null;
  private activePointerId: number | null = null;

  constructor() {
    if (this.isBrowser) {
      this.ngZone.runOutsideAngular(() => {
        // Use non-passive listeners for pointer events to ensure we can prevent
        // default browser actions if needed.
        document.addEventListener('pointerdown',   this.handlePointerDown,   { capture: true, passive: false });
        document.addEventListener('pointermove',   this.handlePointerMove,   { capture: true, passive: false });
        document.addEventListener('pointerup',     this.handlePointerUp,     { capture: true, passive: false });
        document.addEventListener('pointercancel', this.handlePointerCancel, { capture: true, passive: false });
      });
    }
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;
    document.removeEventListener('pointerdown',   this.handlePointerDown,   { capture: true });
    document.removeEventListener('pointermove',   this.handlePointerMove,   { capture: true });
    document.removeEventListener('pointerup',     this.handlePointerUp,     { capture: true });
    document.removeEventListener('pointercancel', this.handlePointerCancel, { capture: true });
    this.handlers = [];
    this.activeHandler = null;
    this.activePointerId = null;
  }

  registerHandler(handler: GestureHandler): () => void {
    this.handlers.push(handler);
    this.handlers.sort((a, b) => b.priority - a.priority);

    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
      if (this.activeHandler === handler) {
        this.activeHandler = null;
        this.activePointerId = null;
      }
    };
  }

  private handlePointerDown = (event: PointerEvent): void => {
    // If we already have an active handler and a different pointer starts,
    // we ignore it to prevent multi-touch from killing an active gesture.
    if (this.activeHandler !== null && this.activePointerId !== null) {
      return;
    }

    for (const handler of this.handlers) {
      if (handler.onPointerDown) {
        if (handler.onPointerDown(event)) {
          this.activeHandler = handler;
          this.activePointerId = event.pointerId;

          // Pointer capture ensures the element continues to receive pointer events
          // even if the pointer moves outside its boundaries, which is critical
          // for smooth drawer gestures on mobile.
          try {
            (event.target as HTMLElement)?.setPointerCapture(event.pointerId);
          } catch (e) {
            // setPointerCapture puede fallar en algunos elementos o condiciones.
            // En dev mode lo logueamos; en producción el gesto continúa sin captura
            // (puede perder tracking si el puntero sale del viewport).
            if (isDevMode()) {
              console.warn('[GestureBus] setPointerCapture failed:', e);
            }
          }
          break;
        }
      }
    }
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (this.activeHandler && event.pointerId === this.activePointerId) {
      this.activeHandler.onPointerMove?.(event);
    }
  };

  private handlePointerUp = (event: PointerEvent): void => {
    if (this.activeHandler && event.pointerId === this.activePointerId) {
      this.activeHandler.onPointerUp?.(event);
      this.activeHandler = null;
      this.activePointerId = null;
    }
  };

  private handlePointerCancel = (event: PointerEvent): void => {
    if (this.activeHandler && event.pointerId === this.activePointerId) {
      this.activeHandler.onPointerCancel?.(event);
      this.activeHandler = null;
      this.activePointerId = null;
    }
  };
}
