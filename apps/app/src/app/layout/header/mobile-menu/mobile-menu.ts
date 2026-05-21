import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  ViewEncapsulation,
  PLATFORM_ID,
  OnDestroy,
  Renderer2,
  NgZone,
  AfterViewInit,
  ChangeDetectorRef,
  inject,
  HostListener,
  effect,
  EffectRef,
  ChangeDetectionStrategy,
  DestroyRef,
  ViewChild,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { DirectionService } from '@core/services/direction.service';
import { MenuService, MenuCloseReason } from '@core/services/menu.service';
import { OverlayManagerService } from '@core/services/overlay-manager.service';
import { AnalyticsService } from '@core/services/analytics.service';
import { GestureBusService } from '@core/services/gesture-bus.service';
import { MobileMenuGestures, MobileMenuGestureConfig } from './mobile-menu-gestures';
import { DrawerTransitionCoordinator } from './drawer-transition-coordinator';
import { MobileMenuQuickAccess } from './mobile-menu-quick-access';
import { MobileMenuSearch } from './mobile-menu-search';
import { MobileMenuSection } from './mobile-menu-section';
import { MobileMenuSearchController } from './mobile-menu-search.controller';
import {
  getMobileMenuSections,
  MobileMenuSectionData,
  MOBILE_MENU_MAX_WIDTH,
  DRAWER_TRANSITION,
  DRAWER_TRANSITION_DURATION_MS,
  DRAWER_EASING,
  MOBILE_BREAKPOINT_PX,
  GESTURE_EDGE_THRESHOLD,
  GESTURE_VELOCITY_THRESHOLD,
  GESTURE_ELASTIC_RESISTANCE,
  DrawerState,
  SOCIAL_LINKS,
} from './mobile-menu.constants';
import { MobileMenuAccessibility } from './mobile-menu-accessibility';
import { BreakpointService } from '@core/services/breakpoint.service';

// Debounce en ms para el anuncio de resultados en la región ARIA live.
// Evita anuncios intermedios mientras el usuario escribe la búsqueda (A11Y-03).
const ARIA_ANNOUNCE_DEBOUNCE_MS = 400;

@Component({
  selector: 'jsl-mobile-menu',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    FormsModule,
    TranslateModule,
    LucideAngularModule,
    MobileMenuQuickAccess,
    MobileMenuSearch,
    MobileMenuSection,
  ],
  providers: [MobileMenuSearchController],
  templateUrl: './mobile-menu.html',
  styleUrl: './mobile-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ViewEncapsulation.None es intencional: el SCSS del menú está organizado bajo
  // .mobile-menu-container para evitar colisiones de nombres, y los sub-componentes
  // del menú comparten esos estilos. Cambiar a Emulated requeriría refactorizar
  // el SCSS completo del sistema del menú.
  encapsulation: ViewEncapsulation.None,
})
export class MobileMenu implements OnDestroy, AfterViewInit {
  private directionService      = inject(DirectionService);
  private menuService           = inject(MenuService);
  private overlayManagerService = inject(OverlayManagerService);
  private breakpointService     = inject(BreakpointService);
  private analyticsService      = inject(AnalyticsService);
  private gestureBus            = inject(GestureBusService);
  private translate             = inject(TranslateService);
  private el                    = inject(ElementRef);
  private renderer              = inject(Renderer2);
  private ngZone                = inject(NgZone);
  private cdRef                 = inject(ChangeDetectorRef);
  private destroyRef            = inject(DestroyRef);
  private router                = inject(Router);
  private platformId            = inject(PLATFORM_ID);

  protected searchController = inject(MobileMenuSearchController);

  public currentLang: string;
  private isBrowser: boolean;

  // Cached MediaQueryList for prefers-reduced-motion (created once, not on every call)
  private reducedMotionMQL: MediaQueryList | null = null;

  // ── Drawer animation state ──────────────────────────────────────────────────
  public menuTranslateX      = -MOBILE_MENU_MAX_WIDTH;
  public menuScaleX          = 1;
  public menuTransformOrigin = 'left';
  public menuTransition      = DRAWER_TRANSITION;
  private menuWidth          = MOBILE_MENU_MAX_WIDTH;
  public drawerState: DrawerState = DrawerState.CLOSED;

  // ── ARIA live region ────────────────────────────────────────────────────────
  // Texto anunciado por screen readers al cambiar resultados de búsqueda.
  // Se actualiza con debounce para no interrumpir al usuario mientras escribe.
  public ariaAnnouncement = signal('');
  private ariaAnnounceTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Throttled Haptic ────────────────────────────────────────────────────────
  private lastHapticTime = 0;
  private readonly HAPTIC_COOLDOWN_MS = 200;

  private transitionCoordinator!: DrawerTransitionCoordinator;

  // ── Referencia al effect reactivo (para posible cancelación manual) ──────────
  private menuStateEffect: EffectRef | null = null;

  // ── DOM references ──────────────────────────────────────────────────────────
  @ViewChild('menuElement')    private menuElementRef!: ElementRef<HTMLElement>;
  @ViewChild('overlayElement') private overlayElementRef!: ElementRef<HTMLElement>;

  private get menuElement(): HTMLElement | null {
    return this.menuElementRef?.nativeElement || null;
  }

  private get overlayElement(): HTMLElement | null {
    return this.overlayElementRef?.nativeElement || null;
  }

  private resizeObserver: ResizeObserver | null = null;

  // Non-passive touchmove handler — registered with { passive: false } so preventDefault() works.
  // @HostListener registers document listeners as passive in modern browsers, silently ignoring
  // preventDefault() and producing intervention warnings in the console.
  private readonly boundTouchMove = (event: TouchEvent): void => {
    if (
      event.cancelable &&
      this.gestureHandler?.getIsDragging() &&
      this.gestureHandler.getIsHorizontalGesture()
    ) {
      event.preventDefault();
    }
  };

  // ── Search / debounce ────────────────────────────────────────────────────────
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Gesture handler ─────────────────────────────────────────────────────────
  private gestureHandler: MobileMenuGestures | null = null;
  private gestureConfig: MobileMenuGestureConfig | null = null;
  private a11y: MobileMenuAccessibility;

  // ── View data ────────────────────────────────────────────────────────────────
  public currentYear = new Date().getFullYear();
  public menuSections: MobileMenuSectionData[] = [];
  public readonly menuTitleId  = 'mobile-menu-title';
  public readonly socialLinks  = SOCIAL_LINKS;

  // ── Computed state accessors ─────────────────────────────────────────────────

  get isMobileMenuOpen(): boolean {
    return this.menuService.isMobileMenuOpen();
  }

  get isDrawerClosed(): boolean {
    return this.drawerState === DrawerState.CLOSED;
  }

  constructor() {
    this.currentLang = this.translate.getCurrentLang() || this.translate.defaultLang || 'es';
    this.isBrowser   = isPlatformBrowser(this.platformId);
    this.a11y        = new MobileMenuAccessibility(this.el, this.isBrowser);

    if (this.isBrowser) {
      this.reducedMotionMQL = window.matchMedia('(prefers-reduced-motion: reduce)');
    }

    this.initializeCoordinator();

    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      this.currentLang = event.lang;
      this.initMenuSections();
      this.cdRef.markForCheck();
    });

    // Guardar la referencia del effect para que pueda ser cancelado
    // manualmente si fuera necesario en el futuro (p.ej., en tests).
    this.menuStateEffect = effect(() => {
      const isOpen   = this.menuService.isMobileMenuOpen();
      const isMobile = this.breakpointService.isMobile();

      if (this.gestureHandler) {
        this.gestureHandler.setEdgeSwipeEnabled(isMobile && !isOpen);
      }

      if (isOpen && !isMobile) {
        this.ngZone.run(() => this.closeMobileMenu('system'));
        return;
      }

      if (isOpen) {
        this.openDrawer();
      } else {
        this.closeDrawer();
      }
    });

    this.initMenuSections();
  }

  private initMenuSections(): void {
    this.menuSections = getMobileMenuSections(this.currentLang);
    this.searchController.setMenuSections(this.menuSections);
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.initializeMenu();
      this.setupGestures();
      this.setupResizeObserver();
      this.ngZone.runOutsideAngular(() => {
        document.addEventListener('touchmove', this.boundTouchMove, { passive: false });
      });
    }
  }

  ngOnDestroy(): void {
    this.menuStateEffect?.destroy();
    this.cleanup();
  }

  // ── Initialisation ──────────────────────────────────────────────────────────

  private initializeCoordinator(): void {
    this.transitionCoordinator = new DrawerTransitionCoordinator(
      {
        getMenuElement:    () => this.menuElement,
        getOverlayElement: () => this.overlayElement,
        prefersReducedMotion: () => this.prefersReducedMotion(),
        getDrawerTransition:  () => this.getDrawerTransition(),
        onStateChange: (state) => {
          this.drawerState = state;
          if (state === DrawerState.OPENING || state === DrawerState.CLOSING) {
            this.menuTransition = this.getDrawerTransition();
          } else if (state === DrawerState.DRAGGING) {
            this.menuTransition = 'none';
          }
        },
        onUpdateTranslate: (translateX) => {
          this.menuTranslateX = translateX;
          this.menuScaleX     = 1;
        },
        onRegisterOverlay:   () => this.overlayManagerService.register('mobile-menu', { lockScroll: false }),
        onUnregisterOverlay: () => this.overlayManagerService.unregister('mobile-menu'),
        onTriggerHaptic:     () => this.triggerThrottledHaptic(),
        onA11yOpen: () => {
          this.a11y.saveFocus();
          this.a11y.startObserving();
        },
        onA11yClose: () => {
          this.a11y.restoreFocus();
          this.a11y.stopObserving();
        },
        onA11yInitialFocus: () => {
          this.a11y.refreshFocusableElements();
          this.a11y.setInitialFocus();
        },
      },
      this.renderer,
      this.ngZone,
      this.cdRef
    );
  }

  private initializeMenu(): void {
    this.setSharedTokens();
    if (this.menuElement) {
      this.updateMenuWidth();
    }
  }

  private setSharedTokens(): void {
    const host = this.el.nativeElement;
    this.renderer.setStyle(host, '--mm-drawer-max-width', `${MOBILE_MENU_MAX_WIDTH}px`);
    this.renderer.setStyle(host, '--mm-mobile-breakpoint', `${MOBILE_BREAKPOINT_PX}px`);
    this.renderer.setStyle(host, '--mm-drawer-duration', `${DRAWER_TRANSITION_DURATION_MS}ms`);
    this.renderer.setStyle(host, '--mm-drawer-easing', DRAWER_EASING);
  }

  private setupResizeObserver(): void {
    if (!this.menuElement || !this.isBrowser) return;

    // Crear el ResizeObserver fuera de la Angular zone para evitar que cada
    // evento de resize triggeree change detection. Solo entramos a la zone
    // cuando hay un cambio real de ancho que requiere actualizar la vista.
    this.ngZone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === this.menuElement) {
            this.ngZone.run(() => this.updateMenuWidth());
          }
        }
      });
      this.resizeObserver!.observe(this.menuElement!);
    });
  }

  private updateMenuWidth(): void {
    if (!this.menuElement) return;

    const newWidth = this.menuElement.offsetWidth || MOBILE_MENU_MAX_WIDTH;
    if (this.menuWidth === newWidth) return;

    this.menuWidth = newWidth;

    if (this.gestureConfig) {
      this.gestureConfig.menuWidth = this.menuWidth;
    }

    if (this.drawerState === DrawerState.CLOSED) {
      this.menuTranslateX = this.directionService.isRtl() ? this.menuWidth : -this.menuWidth;
    }

    this.cdRef.markForCheck();
  }

  private setupGestures(): void {
    this.gestureConfig = {
      menuWidth:         this.menuWidth,
      elasticResistance: GESTURE_ELASTIC_RESISTANCE,
      edgeThreshold:     GESTURE_EDGE_THRESHOLD,
      velocityThreshold: GESTURE_VELOCITY_THRESHOLD,
      isRtl:       () => this.directionService.isRtl(),
      isOpen:      () => this.isMobileMenuOpen,
      isAnimating: () =>
        this.drawerState === DrawerState.OPENING || this.drawerState === DrawerState.CLOSING,
      isTargetInsideMenu: (target: HTMLElement) => !!this.menuElement?.contains(target),
      isTargetToggleButton: (target: HTMLElement) => target.closest('.jsl-mm-toggle') !== null,
      getCurrentTranslateX: () => this.menuTranslateX,

      onUpdateTranslate: (translateX, progress, scaleX, transformOrigin) => {
        this.menuTranslateX      = translateX;
        this.menuScaleX          = scaleX ?? 1;
        this.menuTransformOrigin = transformOrigin ?? (this.directionService.isRtl() ? 'right' : 'left');

        if (progress !== null) {
          this.transitionTo(DrawerState.DRAGGING);
          this.updateOverlayVisual(progress);
          if (this.menuElement) this.renderer.addClass(this.menuElement, 'dragging');
        } else {
          this.menuTransition = this.getDrawerTransition();
          if (this.menuElement) this.renderer.removeClass(this.menuElement, 'dragging');
        }
        this.cdRef.markForCheck();
      },

      onOpen: () => {
        if (this.menuService.isMobileMenuOpen()) {
          this.openDrawer();
          return;
        }
        this.menuService.open();
      },
      onClose: () => {
        if (this.menuService.isMobileMenuOpen()) {
          this.menuService.close('gesture');
          return;
        }
        this.closeDrawer();
      },
      onStopTransition: () => this.stopTransition(),
      onToggleHaptic:   () => this.triggerThrottledHaptic(),
      onTrackMetric: (metric, data) =>
        this.analyticsService.trackEvent(`mobile_menu_${metric}`, data),
    };

    this.gestureHandler = new MobileMenuGestures(this.gestureConfig, this.ngZone, this.gestureBus);

    this.gestureHandler.setEdgeSwipeEnabled(
      this.breakpointService.isMobile() && !this.menuService.isMobileMenuOpen()
    );
  }

  // ── FSM State Transitions ───────────────────────────────────────────────────

  private transitionTo(newState: DrawerState, options: { immediate?: boolean } = {}): void {
    const targetTranslateX = newState === DrawerState.CLOSING
      ? (this.directionService.isRtl() ? this.menuWidth : -this.menuWidth)
      : undefined;

    this.transitionCoordinator.transitionTo(newState, { ...options, targetTranslateX });
  }

  // ── Open / close drawer ─────────────────────────────────────────────────────

  private openDrawer(): void {
    if (this.drawerState === DrawerState.OPEN || this.drawerState === DrawerState.OPENING) return;
    this.transitionTo(DrawerState.OPENING);
  }

  private closeDrawer(): void {
    if (this.drawerState === DrawerState.CLOSED || this.drawerState === DrawerState.CLOSING) return;
    this.transitionTo(DrawerState.CLOSING);
  }

  private prefersReducedMotion(): boolean {
    return this.isBrowser && (this.reducedMotionMQL?.matches ?? false);
  }

  private getDrawerTransition(): string {
    return this.prefersReducedMotion() ? 'none' : DRAWER_TRANSITION;
  }

  // ── Overlay helpers ─────────────────────────────────────────────────────────

  private clamp01(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  private updateOverlayVisual(progress: number): void {
    if (!this.overlayElement) return;
    const normalized = this.clamp01(progress);
    this.renderer.setStyle(this.overlayElement, '--mm-overlay-progress', normalized.toFixed(3));
  }

  // ── Public menu actions ─────────────────────────────────────────────────────

  closeMobileMenu(reason: MenuCloseReason = 'button', event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.menuService.close(reason);
  }

  // ── Pointer event delegation ────────────────────────────────────────────────

  private stopTransition(): void {
    this.transitionTo(DrawerState.DRAGGING);
    if (this.menuElement) void this.menuElement.offsetHeight; // force reflow para limpiar la transición CSS activa
    this.cdRef.markForCheck();
  }

  // ── Keyboard events ─────────────────────────────────────────────────────────

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.isBrowser || !this.isMobileMenuOpen) return;

    if (event.key === 'Escape') {
      this.closeMobileMenu('escape');
      event.preventDefault();
      return;
    }

    if (event.key === 'Tab') {
      this.a11y.trapFocus(event);
    }
  }

  // ── Search ─────────────────────────────────────────────────────────────────

  onSearchChange(query: string): void {
    this.searchController.onSearchChange(query);

    // refreshFocusableElements() is internally debounced (~2 frames) so calling
    // it here is safe and avoids the complexity of afterNextRender in event handlers.
    this.a11y.refreshFocusableElements();

    // Actualizar la región ARIA live con debounce para evitar anuncios
    // intermedios mientras el usuario escribe (A11Y-03).
    if (this.ariaAnnounceTimer !== null) clearTimeout(this.ariaAnnounceTimer);
    this.ariaAnnounceTimer = setTimeout(() => {
      this.ariaAnnounceTimer = null;
      const count = this.searchController.searchResultsCount();
      if (query) {
        const text = count > 0
          ? this.translate.instant('SEARCH.RESULTS_COUNT', { count })
          : this.translate.instant('SEARCH.NO_RESULTS_FOUND');
        this.ariaAnnouncement.set(text);
      } else {
        this.ariaAnnouncement.set('');
      }
    }, ARIA_ANNOUNCE_DEBOUNCE_MS);

    if (this.searchDebounceTimer !== null) clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.analyticsService.trackEvent('mobile_menu_search', {
        search_term:   query,
        results_count: this.searchController.searchResultsCount(),
      });
    }, 300);

    this.cdRef.markForCheck();
  }

  // ── Sections ────────────────────────────────────────────────────────────────

  toggleSection(section: string): void {
    this.searchController.toggleSection(section);
    if (this.searchController.isSectionExpanded(section)) {
      this.analyticsService.trackEvent('mobile_menu_expand_section', { section_id: section });
    }
    this.cdRef.markForCheck();
  }

  // ── Accessibility / Focus management ─────────────────────────────────────────

  onSentinelFocus(event: FocusEvent, type: 'start' | 'end'): void {
    this.a11y.handleSentinelFocus(event, type);
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  onMenuRouteNavigate(route: (string | number)[], source: string): void {
    this.closeMobileMenu('navigation');
    // Convertir todos los segmentos a string antes de navegar.
    // La interfaz InternalMenuLink permite (string | number)[] pero Angular
    // Router espera string[]; el cast directo ocultaría errores en runtime.
    this.router.navigate(route.map(String)).then((ok) => {
      if (!ok) {
        this.analyticsService.trackEvent('mobile_menu_navigation_failed', {
          source,
          route: route.join('/'),
        });
      }
    }).catch(() => {
      this.analyticsService.trackEvent('mobile_menu_navigation_failed', {
        source,
        route: route.join('/'),
      });
    });
  }

  // ── Haptic feedback ─────────────────────────────────────────────────────────

  private triggerThrottledHaptic(): void {
    if (!this.isBrowser) return;

    const now = Date.now();
    if (now - this.lastHapticTime < this.HAPTIC_COOLDOWN_MS) return;
    this.lastHapticTime = now;

    if (navigator.vibrate) {
      // navigator.userActivation no está disponible en todos los browsers
      // (ausente en Safari ≤ 16). Si no existe, se permite la vibración
      // solo si el browser soporta la API; si existe, se verifica la activación.
      const activation = navigator.userActivation;
      if (!activation || activation.isActive) {
        navigator.vibrate(5);
      }
    }
  }

  // ── Cleanup ─────────────────────────────────────────────────────────────────

  private cleanup(): void {
    if (this.gestureHandler) {
      this.gestureHandler.setEdgeSwipeEnabled(false);
      this.gestureHandler.destroy();
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.transitionCoordinator?.destroy();
    this.a11y.stopObserving();

    if (this.searchDebounceTimer !== null) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }

    if (this.ariaAnnounceTimer !== null) {
      clearTimeout(this.ariaAnnounceTimer);
      this.ariaAnnounceTimer = null;
    }

    if (!this.isBrowser) return;

    document.removeEventListener('touchmove', this.boundTouchMove);

    if (this.isMobileMenuOpen) {
      this.overlayManagerService.unregister('mobile-menu');
    }
  }
}
