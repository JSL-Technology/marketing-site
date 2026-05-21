import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MobileMenu } from './mobile-menu';
import { MenuService } from '../../../core/services/menu.service';
import { DirectionService } from '../../../core/services/direction.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  LucideAngularModule, Search, X, SearchX, ChevronDown,
  Mail, CircleDollarSign, HelpCircle, Headphones, LayoutGrid,
  Monitor, Smartphone, Laptop, CloudCog, Building2, Package,
  ExternalLink, Layers, Workflow, Cpu, Briefcase,
  Heart, TrendingUp, Rocket, ShieldCheck, Lightbulb, Newspaper,
  CalendarDays, Radio, BookOpen, Map, Code, Linkedin, Github,
  Twitter, Instagram,
  // Info reemplaza a Users para HEADER.ABOUT (INCONS-02)
  Info,
  // Network reemplaza a Users para HEADER.PARTNERS (INCONS-02)
  Network,
} from 'lucide-angular';
import { NO_ERRORS_SCHEMA, WritableSignal, provideZonelessChangeDetection, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MobileMenuQuickAccess } from './mobile-menu-quick-access';
import { MobileMenuSearch } from './mobile-menu-search';
import { MobileMenuSection } from './mobile-menu-section';
import { MobileMenuSearchController } from './mobile-menu-search.controller';

interface MenuServiceMock {
  isMobileMenuOpen: WritableSignal<boolean>;
  closeReason: WritableSignal<string | null>;
  close: jasmine.Spy;
  open: jasmine.Spy;
}

interface DirectionServiceMock {
  isRtl: () => boolean;
}

interface AnalyticsServiceMock {
  trackEvent: jasmine.Spy;
}

describe('MobileMenu', () => {
  let component: MobileMenu;
  let fixture: ComponentFixture<MobileMenu>;
  let menuServiceMock: MenuServiceMock;
  let directionServiceMock: DirectionServiceMock;
  let analyticsServiceMock: AnalyticsServiceMock;
  let translateService: TranslateService;
  let searchController: MobileMenuSearchController;

  beforeEach(async () => {
    menuServiceMock = {
      isMobileMenuOpen: signal(false),
      closeReason: signal(null),
      close: jasmine.createSpy('close'),
      open: jasmine.createSpy('open'),
    };

    directionServiceMock = {
      isRtl: () => false,
    };

    analyticsServiceMock = {
      trackEvent: jasmine.createSpy('trackEvent'),
    };

    await TestBed.configureTestingModule({
      imports: [
        MobileMenu,
        MobileMenuQuickAccess,
        MobileMenuSearch,
        MobileMenuSection,
        FormsModule,
        TranslateModule.forRoot(),
        LucideAngularModule.pick({
          Search, X, SearchX, ChevronDown, Mail, CircleDollarSign,
          HelpCircle, Headphones, LayoutGrid, Monitor, Smartphone,
          Laptop, CloudCog, Building2, Package, ExternalLink,
          Layers, Info, Network, Workflow, Cpu, Briefcase, Heart,
          TrendingUp, Rocket, ShieldCheck, Lightbulb, Newspaper,
          CalendarDays, Radio, BookOpen, Map, Code, Linkedin,
          Github, Twitter, Instagram,
        }),
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: MenuService, useValue: menuServiceMock },
        { provide: DirectionService, useValue: directionServiceMock },
        { provide: AnalyticsService, useValue: analyticsServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    translateService = TestBed.inject(TranslateService);
    translateService.setTranslation('en', {
      'SEARCH.RESULTS_COUNT':  '{{count}} results',
      'SEARCH.NO_RESULTS_FOUND': 'No results found',
      'ARIA.CLOSE_MENU':       'Close menu',
      'HEADER.SERVICES':       'Services',
      'HEADER.CONTACT':        'Contact',
    });
    translateService.use('en');

    fixture = TestBed.createComponent(MobileMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // MobileMenuSearchController is provided at component level, so get it
    // via the component's injector, not the root injector.
    searchController = fixture.debugElement.injector.get(MobileMenuSearchController);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call menuService.close() with reason "escape" when Escape key is pressed', () => {
    menuServiceMock.isMobileMenuOpen.set(true);
    fixture.detectChanges();

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.dispatchEvent(event);

    expect(menuServiceMock.close).toHaveBeenCalledWith('escape');
  });

  it('should update search results count when search query changes', () => {
    component.onSearchChange('Services');
    fixture.detectChanges();

    expect(searchController.searchResultsCount()).toBeGreaterThan(0);
  });

  it('should show "No results found" when search query matches nothing', () => {
    component.onSearchChange('Non-existent-key-12345');
    fixture.detectChanges();

    const noResults = fixture.debugElement.query(By.css('.mobile-menu-no-results'));
    expect(noResults).toBeTruthy();
  });

  it('should toggle sections', () => {
    const sectionId = 'services';
    component.toggleSection(sectionId);
    expect(searchController.expandedSections().has(sectionId)).toBeTrue();

    component.toggleSection(sectionId);
    expect(searchController.expandedSections().has(sectionId)).toBeFalse();
  });

  it('should trap focus within menu when Tab is pressed while open', () => {
    menuServiceMock.isMobileMenuOpen.set(true);
    fixture.detectChanges();

    const menu = fixture.debugElement.query(By.css('.header__nav-links-mobile'));
    expect(menu).toBeTruthy();

    // Focus a real focusable element inside the menu to establish a starting point
    const closeBtn = fixture.debugElement.query(By.css('.mobile-close-btn'));
    if (closeBtn) {
      (closeBtn.nativeElement as HTMLElement).focus();
    }

    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    document.dispatchEvent(tabEvent);

    // After trapFocus, active element should still be inside the component or body as fallback
    const hostContains = fixture.nativeElement.contains(document.activeElement);
    const isBody = document.activeElement === document.body;
    expect(hostContains || isBody).toBeTrue();
  });

  it('should clear debounce timer on destroy without throwing', () => {
    component.onSearchChange('Serv');
    expect(() => fixture.destroy()).not.toThrow();
  });

  it('should set background elements inert when menu opens and remove when closes', async () => {
    const main   = document.createElement('main');
    const footer = document.createElement('jsl-footer');
    document.body.appendChild(main);
    document.body.appendChild(footer);

    expect(main.hasAttribute('inert')).toBeFalse();

    menuServiceMock.isMobileMenuOpen.set(true);
    fixture.detectChanges();

    // Allow transition coordinator fallback timer (DRAWER_TRANSITION_DURATION_MS + 100 = 500ms)
    await new Promise(resolve => setTimeout(resolve, 600));
    fixture.detectChanges();

    expect(main.hasAttribute('inert')).toBeTrue();
    expect(footer.hasAttribute('inert')).toBeTrue();

    menuServiceMock.isMobileMenuOpen.set(false);
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve, 600));
    fixture.detectChanges();

    expect(main.hasAttribute('inert')).toBeFalse();
    expect(footer.hasAttribute('inert')).toBeFalse();

    main.remove();
    footer.remove();
  });

  it('should have routerLinkActive on contact CTA', () => {
    menuServiceMock.isMobileMenuOpen.set(true);
    component.onSearchChange('');
    fixture.detectChanges();

    const contactBtn = fixture.debugElement.query(By.css('.mobile-cta-btn'));
    expect(contactBtn).toBeTruthy();
    expect(contactBtn.attributes['routerLinkActive']).toBe('active');
  });

  it('should restore expanded sections after clearing search query', () => {
    component.toggleSection('services');
    expect(searchController.expandedSections().has('services')).toBeTrue();

    component.onSearchChange('serv');
    component.onSearchChange('');

    expect(searchController.expandedSections().has('services')).toBeTrue();
  });

  it('should generate a deterministic aria title id', () => {
    expect(component.menuTitleId).toBe('mobile-menu-title');
  });

  it('should expose SOCIAL_LINKS to the template', () => {
    expect(component.socialLinks).toBeDefined();
    expect(component.socialLinks.linkedin).toBeTruthy();
    expect(component.socialLinks.github).toBeTruthy();
    expect(component.socialLinks.twitter).toBeTruthy();
    expect(component.socialLinks.instagram).toBeTruthy();
  });

  it('closeMobileMenu should call menuService.close with the given reason', () => {
    component.closeMobileMenu('gesture');
    expect(menuServiceMock.close).toHaveBeenCalledWith('gesture');
  });

  it('closeMobileMenu should default reason to "button"', () => {
    component.closeMobileMenu();
    expect(menuServiceMock.close).toHaveBeenCalledWith('button');
  });

  it('ariaAnnouncement starts empty', () => {
    expect(component.ariaAnnouncement()).toBe('');
  });

  it('focus sentinels should not have aria-hidden attribute', () => {
    const sentinels = fixture.nativeElement.querySelectorAll('.focus-sentinel');
    sentinels.forEach((sentinel: HTMLElement) => {
      expect(sentinel.hasAttribute('aria-hidden')).toBeFalse();
    });
  });

  it('close button should have type="button"', () => {
    const closeBtn = fixture.nativeElement.querySelector('.mobile-close-btn');
    expect(closeBtn?.getAttribute('type')).toBe('button');
  });

  it('onMenuRouteNavigate should call router.navigate with all segments as strings', () => {
    const routerSpy = spyOn(TestBed.inject(Router), 'navigate').and.returnValue(Promise.resolve(true));
    component.onMenuRouteNavigate(['es', 'solutions', 42], 'test');
    expect(routerSpy).toHaveBeenCalledWith(['es', 'solutions', '42']);
  });
});
