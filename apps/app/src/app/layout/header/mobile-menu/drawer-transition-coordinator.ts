import { NgZone, Renderer2, ChangeDetectorRef } from '@angular/core';
import { DrawerState, DRAWER_TRANSITION_DURATION_MS } from './mobile-menu.constants';

export interface TransitionConfig {
  getMenuElement: () => HTMLElement | null;
  getOverlayElement: () => HTMLElement | null;
  prefersReducedMotion: () => boolean;
  getDrawerTransition: () => string;
  onStateChange: (state: DrawerState) => void;
  onUpdateTranslate: (translateX: number) => void;
  onRegisterOverlay: () => void;
  onUnregisterOverlay: () => void;
  onTriggerHaptic: () => void;
  onA11yOpen: () => void;
  onA11yClose: () => void;
  onA11yInitialFocus: () => void;
  onTransitionComplete?: () => void;
}

export class DrawerTransitionCoordinator {
  private transitionEndUnlisten: (() => void) | null = null;
  private transitionFallbackTimer: ReturnType<typeof setTimeout> | null = null;
  private _currentState: DrawerState = DrawerState.CLOSED;

  // Contador de generación: incrementa en cada nueva transición animada.
  // Los callbacks del timer/listener capturan el valor en su creación y lo
  // comparan al ejecutarse; si difiere, el callback es obsoleto y se descarta.
  // Esto previene la race condition donde un timer antiguo completa una
  // transición nueva incorrectamente (BUG-03).
  private transitionGeneration = 0;

  get currentState(): DrawerState {
    return this._currentState;
  }

  constructor(
    private config: TransitionConfig,
    private renderer: Renderer2,
    private ngZone: NgZone,
    private cdRef: ChangeDetectorRef
  ) {}

  public transitionTo(
    newState: DrawerState,
    options: { immediate?: boolean; targetTranslateX?: number } = {}
  ): void {
    if (this._currentState === newState && !options.immediate) return;

    const previousState = this._currentState;
    this._currentState = newState;

    // Incrementar la generación en cada cambio de estado, incluso si no es animado.
    // Esto asegura que cualquier callback pendiente (timer o listener) de una
    // transición anterior sea invalidado inmediatamente (BUG-03).
    this.transitionGeneration++;

    this.config.onStateChange(newState);

    switch (newState) {
      case DrawerState.OPENING: {
        this.config.onUpdateTranslate(0);
        this.config.onRegisterOverlay();
        this.config.onTriggerHaptic();
        this.config.onA11yOpen();

        const overlay = this.config.getOverlayElement();
        if (overlay) {
          overlay.classList.add('visible');
          this.renderer.setStyle(overlay, '--mm-overlay-progress', '1.000');
        }

        this.handleTransitionEnd(DrawerState.OPEN, () => {
          this.config.onA11yInitialFocus();
        });
        break;
      }

      case DrawerState.CLOSING: {
        if (options.targetTranslateX !== undefined) {
          this.config.onUpdateTranslate(options.targetTranslateX);
        }
        this.config.onUnregisterOverlay();
        this.config.onTriggerHaptic();
        this.config.onA11yClose();

        const overlayClose = this.config.getOverlayElement();
        if (overlayClose) {
          overlayClose.classList.remove('visible');
          this.renderer.removeStyle(overlayClose, '--mm-overlay-progress');
        }
        this.handleTransitionEnd(DrawerState.CLOSED);
        break;
      }

      case DrawerState.DRAGGING: {
        this.clearTransitionListeners();

        // Cuando un gesto de apertura arranca (CLOSED → DRAGGING via edge-swipe)
        // o una animación de cierre es interrumpida (CLOSING → DRAGGING),
        // revelar el overlay para que el usuario vea el progreso.
        const needsOverlay =
          previousState === DrawerState.CLOSED ||
          previousState === DrawerState.CLOSING;

        if (needsOverlay) {
          const overlayDrag = this.config.getOverlayElement();
          if (overlayDrag) {
            overlayDrag.classList.add('visible');
          }
        }
        break;
      }

      case DrawerState.OPEN:
      case DrawerState.CLOSED:
        this.clearTransitionListeners();
        break;
    }

    this.cdRef.markForCheck();
  }

  private clearTransitionListeners(): void {
    if (this.transitionEndUnlisten) {
      this.transitionEndUnlisten();
      this.transitionEndUnlisten = null;
    }
    if (this.transitionFallbackTimer !== null) {
      clearTimeout(this.transitionFallbackTimer);
      this.transitionFallbackTimer = null;
    }
  }

  private handleTransitionEnd(targetState: DrawerState, callback?: () => void): void {
    this.clearTransitionListeners();

    const menuElement = this.config.getMenuElement();
    if (!menuElement) {
      this.completeTransition(targetState, callback);
      return;
    }

    const reducedMotion = this.config.prefersReducedMotion();

    // Capturar la generación actual: si cambia antes de que este callback
    // se ejecute, significa que una nueva transición arrancó y este callback
    // es obsoleto — debe ignorarse.
    const generation = ++this.transitionGeneration;

    if (!reducedMotion) {
      this.transitionEndUnlisten = this.renderer.listen(
        menuElement,
        'transitionend',
        (event: TransitionEvent) => {
          if (event.propertyName !== 'transform' || event.target !== menuElement) return;
          if (this.transitionGeneration !== generation) return;
          this.clearTransitionListeners();
          this.ngZone.run(() => {
            this.completeTransition(targetState, callback);
          });
        }
      );
    }

    this.transitionFallbackTimer = setTimeout(() => {
      this.transitionFallbackTimer = null;
      if (this.transitionEndUnlisten) {
        this.transitionEndUnlisten();
        this.transitionEndUnlisten = null;
      }
      // Descartar si una transición más reciente ya tomó el control.
      if (this.transitionGeneration !== generation) return;
      this.ngZone.run(() => {
        this.completeTransition(targetState, callback);
      });
    }, reducedMotion ? 0 : DRAWER_TRANSITION_DURATION_MS + 100);
  }

  private completeTransition(targetState: DrawerState, callback?: () => void): void {
    if (
      this._currentState !== DrawerState.OPENING &&
      this._currentState !== DrawerState.CLOSING
    ) {
      return;
    }
    this._currentState = targetState;
    this.config.onStateChange(targetState);
    callback?.();
    this.config.onTransitionComplete?.();
    this.cdRef.markForCheck();
  }

  public destroy(): void {
    this.clearTransitionListeners();
    // Nulificar config para liberar las referencias a callbacks del componente
    // padre y evitar memory leaks en SSR o en entornos de testing.
    (this as unknown as { config: TransitionConfig | null }).config = null;
    (this as unknown as { renderer: Renderer2 | null }).renderer = null;
    (this as unknown as { ngZone: NgZone | null }).ngZone = null;
    (this as unknown as { cdRef: ChangeDetectorRef | null }).cdRef = null;
  }
}
