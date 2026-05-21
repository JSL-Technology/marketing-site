import { Injectable, inject, PLATFORM_ID, InjectionToken } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ScrollEngineService } from './scroll-engine.service';

/**
 * CSS selector targeting the page regions that should become inert when any overlay
 * is active. Override at root level to adapt to different app layouts:
 *
 *   providers: [{ provide: OVERLAY_INERT_SELECTOR, useValue: 'main, app-footer' }]
 *
 * For fine-grained per-component control, use OverlayManagerService.registerInertTarget().
 */
export const OVERLAY_INERT_SELECTOR = new InjectionToken<string>(
  'OVERLAY_INERT_SELECTOR',
  { factory: () => 'main, jsl-footer, jsl-top-bar, .header__nav' }
);

@Injectable({
  providedIn: 'root',
})
export class OverlayManagerService {
  private platformId = inject(PLATFORM_ID);
  private readonly rootContentSelector = inject(OVERLAY_INERT_SELECTOR);
  private readonly scrollEngine = inject(ScrollEngineService);

  /** LIFO stack of active overlays with per-overlay behavior. */
  private overlayStack: Array<{ id: string; lockScroll: boolean }> = [];

  /** Elements registered at runtime via registerInertTarget(). */
  private readonly dynamicTargets = new Set<Element>();

  /**
   * Registers an active overlay and pushes it to the stack.
   * @param id Unique identifier for the overlay.
   */
  register(id: string, options?: { lockScroll?: boolean }): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.unregister(id);
    this.overlayStack.push({ id, lockScroll: options?.lockScroll ?? true });
    this.updateInertState();
  }

  /**
   * Unregisters an active overlay and removes it from the stack.
   * @param id Unique identifier for the overlay.
   */
  unregister(id: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.overlayStack = this.overlayStack.filter(item => item.id !== id);
    this.updateInertState();
  }

  /**
   * Returns the ID of the topmost active overlay.
   */
  getActiveOverlayId(): string | null {
    return this.overlayStack.length > 0 ? this.overlayStack[this.overlayStack.length - 1].id : null;
  }

  /**
   * Dynamically registers a DOM element to be made inert while any overlay is open.
   * Returns an unregister function — call it from ngOnDestroy to avoid leaks.
   *
   * @example
   *   private readonly unregister = this.overlayManager.registerInertTarget(this.el.nativeElement);
   *   ngOnDestroy() { this.unregister(); }
   */
  registerInertTarget(el: Element): () => void {
    if (!isPlatformBrowser(this.platformId)) return () => {};

    this.dynamicTargets.add(el);
    if (this.overlayStack.length > 0) {
      el.setAttribute('inert', '');
    }

    return () => {
      this.dynamicTargets.delete(el);
      el.removeAttribute('inert');
    };
  }

  /**
   * Updates the 'inert' attribute on background elements and locks/unlocks scroll
   * based on the overlay stack state.
   */
  private updateInertState(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const hasActiveOverlays = this.overlayStack.length > 0;
    const shouldLockScroll = this.overlayStack.some((overlay) => overlay.lockScroll);

    // Scroll-lock: solo cuando hay overlays que lo requieren.
    if (shouldLockScroll) {
      document.documentElement.classList.add('scroll-locked');
      this.scrollEngine.stop();
    } else {
      document.documentElement.classList.remove('scroll-locked');
      this.scrollEngine.start();
    }

    document.querySelectorAll(this.rootContentSelector).forEach((target) => {
      if (hasActiveOverlays) target.setAttribute('inert', '');
      else target.removeAttribute('inert');
    });

    this.dynamicTargets.forEach((target) => {
      if (hasActiveOverlays) target.setAttribute('inert', '');
      else target.removeAttribute('inert');
    });
  }
}
