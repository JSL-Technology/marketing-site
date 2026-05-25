import { Component, HostListener, Inject, PLATFORM_ID, OnInit, OnDestroy, inject } from '@angular/core';
import { map, filter } from 'rxjs';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, NavigationStart } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CookieService } from 'ngx-cookie-service';
import { Header } from './layout/header/header';
import { Footer } from './layout/footer/footer';
import { Seo } from './core/services/seo';
import { AnalyticsService } from './core/services/analytics.service';
import { DirectionService } from './core/services/direction.service';
import { ChatBubbleComponent } from './shared/components/chat-bubble/chat-bubble';
import { BreadcrumbsComponent } from './shared/components/breadcrumbs/breadcrumbs';
import { WhatsAppButtonComponent } from './shared/components/whatsapp-button/whatsapp-button';
import { SUPPORTED_LANGUAGES } from '@core/constants/languages';
import { ToastComponent } from './shared/components/toast/toast';
import { ToastService } from './core/services/toast.service';
import { CookieBannerComponent } from './shared/components/cookie-banner/cookie-banner';
import { ScrollEngineService } from './core/services/scroll-engine.service';
import { MenuService } from './core/services/menu.service';
import { LanguageSuggestionComponent } from './shared/components/language-suggestion/language-suggestion';
import { ClarityService } from './core/services/clarity.service';
import { MetaPixelService } from './core/services/meta-pixel.service';
import Lenis from 'lenis';

@Component({
  selector: 'jsl-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    Header,
    Footer,
    // BreadcrumbsComponent,
    // ChatBubbleComponent,
    WhatsAppButtonComponent,
    ToastComponent,
    CookieBannerComponent,
    LanguageSuggestionComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  title = 'jsl-technology-web';
  isScrolled = false;
  private isBrowser: boolean;
  private lenis: Lenis | null = null;
  private rafId: number | null = null;

  // Swipe blocker variables
  private edgeThreshold = 24;
  private minHorizontalMove = 20;
  private intentThreshold = 12;
  private startX = 0;
  private startY = 0;
  private maybeEdge = false;
  private touchId: number | null = null;
  private supportsPassive = false;
  private gestureIntent: 'unknown' | 'horizontal' | 'vertical' = 'unknown';

  // Listener handlers to allow proper removal
  private onTouchStartHandler = this.onTouchStart.bind(this);
  private onTouchMoveHandler = this.onTouchMove.bind(this);
  private onTouchEndHandler = this.onTouchEnd.bind(this);

  private readonly toastService = inject(ToastService);

  readonly hasToasts$ = this.toastService.toasts$.pipe(map((toasts) => toasts.length > 0));

  get shouldRenderCookieBanner(): boolean {
    return this.isBrowser && !this.cookieService.get('cookie-consent');
  }

  constructor(
    private translate: TranslateService,
    private seo: Seo,
    private analytics: AnalyticsService,
    private clarityService: ClarityService,
    private metaPixelService: MetaPixelService,
    private directionService: DirectionService, // Inject to initialize
    private scrollEngine: ScrollEngineService,
    private menuService: MenuService,
    @Inject(PLATFORM_ID) private platformId: object,
    private cookieService: CookieService,
    private router: Router,
  ) {
    this.seo.init();
    this.analytics.init();
    this.clarityService.init();
    this.metaPixelService.init();
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.translate.addLangs(SUPPORTED_LANGUAGES);

    if (this.isBrowser) {
      this.initializeLanguage();
      // Ejecutar al cargar la página
      this.updateScrollAndResize();
    }

    this.checkPassiveSupport();
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.initSwipeBlocker();
      this.initLenis();
      this.initScrollRestoration();
    }
  }

  private initScrollRestoration() {
    let previousUrl = this.router.url;

    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart))
      .subscribe((event: NavigationStart) => {
        if (this.isLanguageChangeOnly(previousUrl, event.url)) {
          return;
        }

        this.scrollEngine.scrollTo(0, { immediate: true });
      });

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        previousUrl = event.urlAfterRedirects || event.url;
      });
  }

  private isLanguageChangeOnly(prevUrl: string, currUrl: string): boolean {
    const prevParts = prevUrl.split('?')[0].split('/').filter(Boolean);
    const currParts = currUrl.split('?')[0].split('/').filter(Boolean);

    // If both have language prefix, ignore it for comparison
    const prevPath = prevParts.slice(1).join('/');
    const currPath = currParts.slice(1).join('/');

    // Check if query params changed
    const prevQuery = prevUrl.split('?')[1] || '';
    const currQuery = currUrl.split('?')[1] || '';

    return prevPath === currPath && prevQuery === currQuery;
  }

  ngOnDestroy() {
    if (this.lenis) {
      this.lenis.destroy();
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    if (this.isBrowser) {
      this.removeSwipeBlocker();
    }
  }

  private initLenis() {
    this.lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    this.scrollEngine.setLenis(this.lenis);

    const raf = (time: number) => {
      this.lenis?.raf(time);
      this.rafId = requestAnimationFrame(raf);
    };

    this.rafId = requestAnimationFrame(raf);
  }

  private checkPassiveSupport() {
    try {
      const opts = Object.defineProperty({}, 'passive', {
        get: () => { this.supportsPassive = true; return true; }
      });
      (window as any).addEventListener('testPassive', null, opts);
      (window as any).removeEventListener('testPassive', null, opts);
    } catch (e) { }
  }

  private initSwipeBlocker() {
    const addOpts = this.supportsPassive ? { passive: false } : false;

    document.addEventListener('touchstart', this.onTouchStartHandler, addOpts as any);
    document.addEventListener('touchmove', this.onTouchMoveHandler, addOpts as any);
    document.addEventListener('touchend', this.onTouchEndHandler, addOpts as any);
    document.addEventListener('touchcancel', this.onTouchEndHandler, addOpts as any);
  }

  private removeSwipeBlocker() {
    const addOpts = this.supportsPassive ? { passive: false } : false;

    document.removeEventListener('touchstart', this.onTouchStartHandler, addOpts as any);
    document.removeEventListener('touchmove', this.onTouchMoveHandler, addOpts as any);
    document.removeEventListener('touchend', this.onTouchEndHandler, addOpts as any);
    document.removeEventListener('touchcancel', this.onTouchEndHandler, addOpts as any);
  }

  /**
   * Returns true when a touch origin falls within the swipe-sensitive edge zone.
   * LTR: left edge (browser back gesture). RTL: right edge (mirrored back gesture).
   */
  static detectEdge(clientX: number, screenWidth: number, threshold: number, isRtl: boolean): boolean {
    return isRtl
      ? clientX >= screenWidth - threshold   // RTL: swipe in from right edge
      : clientX <= threshold;                // LTR: swipe in from left edge
  }

  /**
   * Returns true when the touch delta describes the gesture that should be blocked.
   * LTR: rightward horizontal swipe. RTL: leftward horizontal swipe.
   * Requires horizontal movement to strongly dominate over vertical (angular criteria).
   */
  static shouldBlockGesture(dx: number, dy: number, minHorizontalMove: number, isRtl: boolean): boolean {
    // Reemplazar |dx| > |dy| por relación angular: |dx| > |dy| * 1.5
    const horizontalDominates = Math.abs(dx) > Math.abs(dy) * 1.5;
    const towardsCenter = isRtl ? dx < -minHorizontalMove : dx > minHorizontalMove;
    return towardsCenter && horizontalDominates;
  }

  private onTouchStart(e: TouchEvent) {
    if (!e.touches || e.touches.length === 0) return;
    const t = e.touches[0];
    this.startX = t.clientX;
    this.startY = t.clientY;
    this.maybeEdge = App.detectEdge(
      this.startX,
      window.innerWidth,
      this.edgeThreshold,
      this.directionService.isRtl()
    );
    this.touchId = t.identifier;
    this.gestureIntent = 'unknown';
  }

  private onTouchMove(e: TouchEvent) {
    if (!this.maybeEdge || this.menuService.isMobileMenuOpen()) return;


    let t: Touch | null = null;
    if (e.touches && e.touches.length) {
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === this.touchId) {
          t = e.touches[i];
          break;
        }
      }
      if (!t) t = e.touches[0];
    } else {
      return;
    }

    const dx = t.clientX - this.startX;
    const dy = t.clientY - this.startY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Gesture intent lock: decide intent after a small threshold
    if (this.gestureIntent === 'unknown' && distance > this.intentThreshold) {
      this.gestureIntent = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
    }

    // Only block if intent is horizontal (or still evaluating but already meets block criteria)
    if (this.gestureIntent !== 'vertical') {
      if (App.shouldBlockGesture(dx, dy, this.minHorizontalMove, this.directionService.isRtl())) {
        try {
          if (e.cancelable) {
            e.preventDefault();
            e.stopPropagation();
          }
        } catch (err) {}
      }
    }
  }

  private onTouchEnd(e: TouchEvent) {
    this.maybeEdge = false;
    this.touchId = null;
    this.gestureIntent = 'unknown';
  }

  private initializeLanguage(): void {
    const langCookie = this.cookieService.get('lang');
    if (langCookie && this.translate.getLangs().includes(langCookie)) {
      this.translate.use(langCookie);
      return;
    }

    const browserLang = this.translate.getBrowserLang();
    const supportedLangs = this.translate.getLangs();
    const finalLang =
      browserLang && supportedLangs.includes(browserLang)
        ? browserLang
        : 'en';

    this.cookieService.set('lang', finalLang, { expires: 365, path: '/' });
    this.translate.use(finalLang);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Ejecutar al hacer scroll
    this.updateScrollAndResize();
  }

  @HostListener('window:resize', [])
  onWindowResize() {
    // Ejecutar al redimensionar la ventana
    this.updateScrollAndResize();
  }

  /**
   * Comprueba el estado del scroll y el tamaño de la ventana
   * para decidir si se aplica la clase 'is-scrolled'.
   */
  private updateScrollAndResize() {
    if (this.isBrowser) {
      const verticalOffset =
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      const isDesktop = window.innerWidth > 992; // El breakpoint de tu CSS

      if (isDesktop) {
        // Comportamiento para PC: aplicar clase solo al hacer scroll
        this.isScrolled = verticalOffset > 50;
      } else {
        // Comportamiento para Móvil: nunca aplicar la clase
        this.isScrolled = false;
      }
    }
  }
}
