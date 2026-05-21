import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  inject,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
  ElementRef,
  ViewChild,
  Renderer2,
  signal,
  OnDestroy,
  Signal,
  effect,
} from '@angular/core';
import { SearchUiService } from '@core/services/search-ui.service';
import { DirectionService } from '@core/services/direction.service';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { RouterLink, Router } from '@angular/router';
import { map, switchMap, timer, fromEvent, merge, takeUntil, Subject, filter, startWith } from 'rxjs';
import { Card } from '@shared/components/card/card';
import { AnimateOnScroll } from '@shared/directives/animate-on-scroll';
import { DataService, Technology, Testimonial, Project, Solution, Product, ProcessStep, Partner, BlogPost } from '@core/services/data.service';
import { Seo } from '@core/services/seo';
import { AnalyticsService } from '@core/services/analytics.service';
import { ToastService } from '@core/services/toast.service';
import { ScrollEngineService } from '@core/services/scroll-engine.service';
import { SwiperOptions } from 'swiper/types';
import { toSignal } from '@angular/core/rxjs-interop';
import { DigitalMaturitySelector } from './components/digital-maturity-selector/digital-maturity-selector';
import { VideoModal } from '@shared/components/video-modal/video-modal';
import { BookingModal } from '@shared/components/booking-modal/booking-modal';
import { ExitIntentModal } from './components/exit-intent-modal/exit-intent-modal';
import { ImageComparisonComponent } from '@shared/components/image-comparison/image-comparison';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';
import { RoiCalculatorComponent } from '@shared/components/roi-calculator/roi-calculator.component';
import { PictureComponent } from '@shared/components/picture/picture';
import { computed } from '@angular/core';
import { PersonalizationService } from '@core/services/personalization.service';
import { FeatureFlagService } from '@core/services/feature-flag.service';
import { OnboardingFlowService } from '@core/services/onboarding-flow.service';

// Swiper Web Components
import { Pagination, Autoplay, EffectCoverflow, EffectFade, Navigation } from 'swiper/modules';
import { register } from 'swiper/element/bundle';
import { triggerTick } from '@shared/utils/haptic-feedback';

register();

@Component({
  selector: 'jsl-home',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    LucideAngularModule,
    RouterLink,
    Card,
    AnimateOnScroll,
    DigitalMaturitySelector,
    VideoModal,
    BookingModal,
    ExitIntentModal,
    ImageComparisonComponent,
    SkeletonLoaderComponent,
    RoiCalculatorComponent,
    PictureComponent
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  public canOfferingsPrev = signal(false);
  public canOfferingsNext = signal(true);
  public canProjectsPrev = signal(false);
  public canProjectsNext = signal(true);
  public canInsightsPrev = signal(false);
  public canInsightsNext = signal(true);
  public heroSwiperConfig: SwiperOptions = {
    modules: [EffectFade, Autoplay, Pagination, Navigation],
    effect: 'fade',
    fadeEffect: {
      crossFade: true,
    },
    pagination: {
      clickable: true,
      dynamicBullets: true,
    },
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    loop: true,
    speed: 800,
    grabCursor: false,
    allowTouchMove: false,
    simulateTouch: false,
    // ← CRÍTICO: Configuración de navegación CORRECTA
    navigation: {
      nextEl: '.hero-swiper-button-next',
      prevEl: '.hero-swiper-button-prev',
    },
  };

  public offeringsSwiperConfig: SwiperOptions = {
    modules: [Navigation, Pagination],
    watchSlidesProgress: true,
    slidesPerView: 1.3,
    centeredSlides: false,
    spaceBetween: 12,
    grabCursor: true,
    loop: false,
    speed: 360,
    touchRatio: 1,
    resistanceRatio: 0.6,
    threshold: 8,
    shortSwipes: true,
    longSwipes: true,
    longSwipesRatio: 0.03,
    longSwipesMs: 100,
    followFinger: true,
    touchReleaseOnEdges: false,
    pagination: { clickable: true, dynamicBullets: true },
    navigation: {
      nextEl: '.offerings-swiper-button-next',
      prevEl: '.offerings-swiper-button-prev',
    },
    breakpoints: {
      768: {
        slidesPerView: 4,
        spaceBetween: 24,
        centeredSlides: false,
        speed: 480,
      },
      1024: {
        slidesPerView: 4,
        spaceBetween: 28,
        centeredSlides: false,
        speed: 480,
      },
    },
  };

  public logoSwiperConfig: SwiperOptions = {
    modules: [Autoplay],
    slidesPerView: 2,
    spaceBetween: 30,
    loop: true,
    speed: 3000, // Velocidad constante para efecto marquee
    autoplay: {
      delay: 0,
      disableOnInteraction: false,
      pauseOnMouseEnter: false,
    },
    allowTouchMove: false, // Deshabilitar interacción manual para marquee puro
    breakpoints: {
      640: {
        slidesPerView: 3,
        spaceBetween: 40,
      },
      768: {
        slidesPerView: 4,
        spaceBetween: 50,
      },
      1024: {
        slidesPerView: 5,
        spaceBetween: 60,
      },
      1280: {
        slidesPerView: 6,
        spaceBetween: 70,
      },
    },
  };

  public testimonialSwiperConfig: SwiperOptions = {
    modules: [Pagination, Autoplay, EffectCoverflow],
    effect: 'coverflow',
    coverflowEffect: {
      rotate: 50,
      stretch: 0,
      depth: 100,
      modifier: 1,
      slideShadows: true,
    },
    spaceBetween: 30,
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: 'auto',
    loop: true,
    autoplay: {
      delay: 7000,
      disableOnInteraction: false,
    },
    pagination: {
      clickable: true,
    },
  };

  public insightsSwiperConfig: SwiperOptions = {
    modules: [Navigation, Pagination],
    watchSlidesProgress: true,
    slidesPerView: 1.2,
    centeredSlides: false,
    spaceBetween: 16,
    slidesOffsetBefore: 16,
    slidesOffsetAfter: 16,
    grabCursor: true,
    loop: false,
    speed: 400,
    touchRatio: 1.1,
    resistanceRatio: 0.85,
    threshold: 10,
    pagination: { clickable: true, dynamicBullets: true },
    navigation: {
      nextEl: '.insights-swiper-button-next',
      prevEl: '.insights-swiper-button-prev',
    },
    breakpoints: {
      640: {
        slidesPerView: 2,
        spaceBetween: 20,
        centeredSlides: false,
        speed: 480,
        slidesOffsetBefore: 0,
        slidesOffsetAfter: 0,
      },
      1024: {
        slidesPerView: 3,
        spaceBetween: 24,
        centeredSlides: false,
        speed: 480,
        slidesOffsetBefore: 0,
        slidesOffsetAfter: 0,
      },
      1440: {
        slidesPerView: 3,
        spaceBetween: 28,
        centeredSlides: false,
        slidesOffsetBefore: 0,
        slidesOffsetAfter: 0,
      },
    },
  };

  public projectsSwiperConfig: SwiperOptions = {
    modules: [Navigation, Pagination],
    watchSlidesProgress: true,
    slidesPerView: 1.08,
    centeredSlides: false,
    spaceBetween: 16,
    grabCursor: true,
    loop: false,
    speed: 480,
    touchRatio: 1.1,
    resistanceRatio: 0.85,
    threshold: 8,
    pagination: { clickable: true, dynamicBullets: true },
    navigation: {
      nextEl: '.projects-swiper-button-next',
      prevEl: '.projects-swiper-button-prev',
    },
    breakpoints: {
      640: {
        slidesPerView: 1.85,
        spaceBetween: 20,
        centeredSlides: false,
        speed: 480,
      },
      1024: {
        slidesPerView: 3,
        spaceBetween: 24,
        centeredSlides: false,
      },
      1440: {
        slidesPerView: 3,
        spaceBetween: 28,
        centeredSlides: false,
      },
    },
  };

  public currentLang: string;

  private translate = inject(TranslateService);
  private dataService = inject(DataService);
  private toastService = inject(ToastService);

  public currentMonth = computed(() => {
    const lang = this.personalizationService.currentLang();
    // Fallback to 'en-US' if Intl doesn't support the language string directly or for safety
    try {
      return new Intl.DateTimeFormat(lang, { month: 'long' }).format(new Date());
    } catch (e) {
      return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date());
    }
  });

  public stats = [
    { valueKey: 'HOME.STATS_PROJECTS', labelKey: 'HOME.STATS_PROJECTS_LABEL', icon: 'Award', subtitleKey: 'HOME.STATS_PROJECTS_SUB' },
    { valueKey: 'HOME.STATS_UPTIME', labelKey: 'HOME.STATS_UPTIME_LABEL', icon: 'ShieldCheck', subtitleKey: 'HOME.STATS_UPTIME_SUB' },
    { valueKey: 'HOME.STATS_COSTS', labelKey: 'HOME.STATS_COSTS_LABEL', icon: 'TrendingDown', subtitleKey: 'HOME.STATS_COSTS_SUB' },
    { valueKey: 'HOME.STATS_SUPPORT', labelKey: 'HOME.STATS_SUPPORT_LABEL', icon: 'ThumbsUp', subtitleKey: 'HOME.STATS_SUPPORT_SUB' },
  ];

  public teamMembers = [
    { nameKey: 'ABOUT.TEAM_MEMBER_1_NAME', roleKey: 'ABOUT.TEAM_MEMBER_1_ROLE', image: 'assets/imgs/Avif/img-1.avif' },
    { nameKey: 'ABOUT.TEAM_MEMBER_2_NAME', roleKey: 'ABOUT.TEAM_MEMBER_2_ROLE', image: 'assets/imgs/Avif/img-2.avif' },
    { nameKey: 'ABOUT.TEAM_MEMBER_3_NAME', roleKey: 'ABOUT.TEAM_MEMBER_3_ROLE', image: 'assets/imgs/Avif/photo-1517694712202-14dd9538aa97.avif' },
  ];

  public faqPreview = [
    { titleKey: 'FAQ.Q1_TITLE', descKey: 'FAQ.Q1_DESC', isOpen: false },
    { titleKey: 'FAQ.Q2_TITLE', descKey: 'FAQ.Q2_DESC', isOpen: false },
    { titleKey: 'FAQ.Q3_TITLE', descKey: 'FAQ.Q3_DESC', isOpen: false },
  ];

  public testimonials: Signal<Testimonial[]> = toSignal(this.dataService.getTestimonials(), { initialValue: [] as Testimonial[] });
  public projects: Signal<Project[]> = toSignal(this.dataService.getProjects(), { initialValue: [] as Project[] });

  // New filtering logic for projects
  public selectedProjectCategory = signal<string>('All');
  public projectCategories = ['All', 'Enterprise', 'Commerce', 'Mobile']; // Could be dynamic

  public filteredProjects = computed<Project[]>(() => {
    const allProjects = this.projects();
    const category = this.selectedProjectCategory();

    if (category === 'All') {
      // Personalization: If "All" is selected, but the user has a most visited category,
      // we could potentially boost those projects or show them first.
      const mostVisited = this.personalizationService.getMostVisitedCategory();
      if (mostVisited) {
        const matching = allProjects.filter(p => p.category.toLowerCase() === mostVisited.toLowerCase());
        const others = allProjects.filter(p => p.category.toLowerCase() !== mostVisited.toLowerCase());
        return [...matching, ...others];
      }
      return allProjects;
    }
    return allProjects.filter((project) => project.category === category);
  });

  public heroVariant = computed(() => {
    return this.featureFlagService.getVariant('home_hero_v2');
  });

  public personalizedHeroTitle = computed(() => {
    if (this.heroVariant() === 'B') {
      return 'HOME.HERO_B_TITLE';
    }
    return this.personalizationService.getPersonalizedHeroTitle('HOME.HERO1_TITLE');
  });

  public personalizedHeroCTA = computed(() => {
    if (this.heroVariant() === 'B') {
      return 'HOME.HERO_B_CTA';
    }
    const segment = this.personalizationService.userSegment();
    if (segment === 'startup') return 'HOME.CTA_STARTUP';
    if (segment === 'enterprise') return 'HOME.CTA_ENTERPRISE';
    return 'HEADER.ABOUT';
  });

  public personalizedHeroSubtitle = computed(() => {
    if (this.heroVariant() === 'B') {
      return 'HOME.HERO_B_SUBTITLE';
    }
    return 'HOME.HERO1_SUBTITLE';
  });

  public solutions: Signal<Solution[]> = toSignal(this.dataService.getSolutions(), { initialValue: [] as Solution[] });
  public products: Signal<Product[]> = toSignal(this.dataService.getProducts(), { initialValue: [] as Product[] });
  public processSteps: Signal<ProcessStep[]> = toSignal(this.dataService.getProcessSteps(), { initialValue: [] as ProcessStep[] });
  public partners: Signal<Partner[]> = toSignal(this.dataService.getPartners(), { initialValue: [] as Partner[] });

  // Modal signals
  public isVideoModalOpen = signal(false);
  public isBookingModalOpen = signal(false);
  public isExitModalOpen = signal(false);

  // Default video
  public demoVideoUrl = 'https://www.youtube.com/embed/LXb3EKWsInQ'; // Tech demo placeholder

  public techStack: Signal<Technology[]> = toSignal(
    this.dataService.getTechStack().pipe(
      map((categories) => {
        const allTechs: Technology[] = [];
        const seen = new Set<string>();
        categories.forEach((cat) => {
          cat.technologies.forEach((tech) => {
            if (!seen.has(tech.name)) {
              allTechs.push(tech);
              seen.add(tech.name);
            }
          });
        });
        return allTechs;
      })
    ),
    { initialValue: [] as Technology[] }
  );

  public latestBlogPosts: Signal<BlogPost[]> = toSignal(
    this.dataService.getBlogPosts().pipe(map((posts) => posts.slice(0, 3))),
    { initialValue: [] as BlogPost[] }
  );

  public activeTab = signal<'services' | 'products'>('services');

  public offeringItems = computed(() => {
    return this.activeTab() === 'services' ? this.solutions() : this.products();
  });
  public isReturningVisitor = signal(false);
  public isSubmitting = signal(false);
  public isLoading = signal(true); // For skeleton loader demo
  public showScrollIndicator = signal(true);
  public isMobileExitSheetOpen = signal(false);

  // Dynamic monthly social-proof stat: deterministic per year+month
  public socialProofCount = computed(() => {
    const now = new Date();
    const seed = now.getFullYear() * 100 + (now.getMonth() + 1);
    return 18 + (seed % 9); // 18–26, changes each month
  });

  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private document = inject(DOCUMENT);
  private router = inject(Router);
  private searchUiService = inject(SearchUiService);
  private seoService = inject(Seo);
  private analyticsService = inject(AnalyticsService);
  private scrollEngine = inject(ScrollEngineService);
  public personalizationService = inject(PersonalizationService);
  public featureFlagService = inject(FeatureFlagService);
  public onboardingFlow = inject(OnboardingFlowService);
  public directionService: DirectionService = inject(DirectionService);
  private unlistenExitIntent: (() => void) | null = null;
  private unlistenHeroMouseMove: (() => void) | null = null;
  private unlistenHeroMouseLeave: (() => void) | null = null;
  private unlistenOfferingsMouseMove: (() => void) | null = null;
  private unlistenOfferingsMouseLeave: (() => void) | null = null;
  private unlistenInsightsMouseMove: (() => void) | null = null;
  private unlistenInsightsMouseLeave: (() => void) | null = null;
  private unlistenProjectsMouseMove: (() => void) | null = null;
  private unlistenProjectsMouseLeave: (() => void) | null = null;
  private socialProofInterval: any;
  private isBrowser: boolean;
  private destroy$ = new Subject<void>();

  private platformId = inject(PLATFORM_ID);

  constructor() {
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || 'es';
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Effect to update projects swiper when filter changes
    effect(() => {
      // Access projects to track dependency
      const projects = this.filteredProjects();
      if (this.isBrowser) {
        setTimeout(() => {
          const projectsSwiperEl = this.el.nativeElement.querySelector('.featured-projects swiper-container');
          if (projectsSwiperEl && projectsSwiperEl.swiper) {
            projectsSwiperEl.swiper.update();
            projectsSwiperEl.swiper.slideTo(0);
            this.refreshSliderBoundaryState(projectsSwiperEl, this.canProjectsPrev, this.canProjectsNext);
          }
        }, 50);
      }
    });
  }

  ngOnInit() {
    this.translate.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
      // Re-generate schema on lang change if needed, but for now simple init
    });

    if (this.isBrowser) {
      this.analyticsService.trackExperimentExposure('home_hero_v2', this.heroVariant());
    }

    if (isPlatformBrowser(this.platformId)) {
      const scrollIndicatorSeen = localStorage.getItem('jsl_scroll_indicator_seen');
      if (scrollIndicatorSeen) {
        this.showScrollIndicator.set(false);
      }

      const visited = localStorage.getItem('jsl_visited');
      if (visited) {
        this.isReturningVisitor.set(true);
      } else {
        localStorage.setItem('jsl_visited', 'true');
      }

      // Simulate initial loading
      setTimeout(() => {
        this.isLoading.set(false);
        // El slider de offerings no existe en el DOM mientras se muestra el skeleton
        // por eso lo inicializamos cuando termina la carga simulada.
        setTimeout(() => this.initializeOfferingsSlider(), 0);
      }, 1500);
    }

    this.addSchemaData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.unlistenExitIntent) {
      this.unlistenExitIntent();
    }
    if (this.unlistenHeroMouseMove) {
      this.unlistenHeroMouseMove();
    }
    if (this.unlistenHeroMouseLeave) {
      this.unlistenHeroMouseLeave();
    }
    if (this.unlistenOfferingsMouseMove) {
      this.unlistenOfferingsMouseMove();
    }
    if (this.unlistenOfferingsMouseLeave) {
      this.unlistenOfferingsMouseLeave();
    }
    if (this.unlistenInsightsMouseMove) {
      this.unlistenInsightsMouseMove();
    }
    if (this.unlistenInsightsMouseLeave) {
      this.unlistenInsightsMouseLeave();
    }
    if (this.unlistenProjectsMouseMove) {
      this.unlistenProjectsMouseMove();
    }
    if (this.unlistenProjectsMouseLeave) {
      this.unlistenProjectsMouseLeave();
    }
    if (this.socialProofInterval) {
      clearInterval(this.socialProofInterval);
    }
  }

  setActiveTab(tab: 'services' | 'products') {
    this.activeTab.set(tab);
    if (this.isBrowser) {
      setTimeout(() => {
        const offeringsSwiperEl = this.el.nativeElement.querySelector('.offerings-section swiper-container');
        if (offeringsSwiperEl && offeringsSwiperEl.swiper) {
          offeringsSwiperEl.swiper.slideTo(0);
          this.refreshSliderBoundaryState(offeringsSwiperEl, this.canOfferingsPrev, this.canOfferingsNext);
        }
      }, 50);
    }
  }


  private initializeOfferingsSlider() {
    if (!this.isBrowser || this.isLoading()) return;

    const offeringsSwiperEl = this.el.nativeElement.querySelector('.offerings-section swiper-container');
    if (!offeringsSwiperEl) return;

    Object.assign(offeringsSwiperEl, this.offeringsSwiperConfig);

    if (!offeringsSwiperEl.swiper) {
      offeringsSwiperEl.initialize();
      this.setupOfferingsNavigationVisibility();
      this.bindSliderBoundaryState(
        offeringsSwiperEl,
        this.canOfferingsPrev,
        this.canOfferingsNext
      );
    } else {
      offeringsSwiperEl.swiper.update();
      this.refreshSliderBoundaryState(
        offeringsSwiperEl,
        this.canOfferingsPrev,
        this.canOfferingsNext
      );
    }
  }

  private bindSliderBoundaryState(
    swiperEl: any,
    canPrev: { set: (v: boolean) => void },
    canNext: { set: (v: boolean) => void }
  ) {
    const update = () => this.refreshSliderBoundaryState(swiperEl, canPrev, canNext);
    swiperEl.swiper?.on('slideChange', () => {
      update();
      triggerTick();
    });
    swiperEl.swiper?.on('reachBeginning', update);
    swiperEl.swiper?.on('reachEnd', update);
    swiperEl.swiper?.on('fromEdge', update);
    setTimeout(update, 0);
  }

  private refreshSliderBoundaryState(
    swiperEl: any,
    canPrev: { set: (v: boolean) => void },
    canNext: { set: (v: boolean) => void }
  ) {
    const swiper = swiperEl?.swiper;
    if (!swiper) return;
    canPrev.set(!swiper.isBeginning);
    canNext.set(!swiper.isEnd);
  }

  private addSchemaData() {
    const baseUrl = this.seoService.getBaseUrl();
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          'name': 'JSL Technology',
          'url': baseUrl,
          'logo': `${baseUrl}/logo.png`,
          'sameAs': [
            'https://www.linkedin.com/company/jsl-technology',
            'https://twitter.com/jsl_tech'
          ],
          'contactPoint': {
            '@type': 'ContactPoint',
            'telephone': '+1-809-264-1693',
            'contactType': 'customer service',
            'areaServed': 'Global',
            'availableLanguage': ['Spanish', 'English']
          }
        },
        {
          '@type': 'Service',
          'serviceType': 'Software Development',
          'provider': {
            '@type': 'Organization',
            'name': 'JSL Technology'
          },
          'areaServed': {
            '@type': 'Place',
            'name': 'Global'
          },
          'hasOfferCatalog': {
            '@type': 'OfferCatalog',
            'name': 'Software Solutions',
            'itemListElement': [
              {
                '@type': 'Offer',
                'itemOffered': {
                  '@type': 'Service',
                  'name': 'Web Development'
                }
              },
              {
                '@type': 'Offer',
                'itemOffered': {
                  '@type': 'Service',
                  'name': 'Mobile App Development'
                }
              },
              {
                '@type': 'Offer',
                'itemOffered': {
                  '@type': 'Service',
                  'name': 'ERP Implementation'
                }
              }
            ]
          }
        },
        {
          '@type': 'BreadcrumbList',
          'itemListElement': [{
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': `${baseUrl}/${this.currentLang}/`
          }]
        },
        {
          '@type': 'FAQPage',
          'mainEntity': this.faqPreview.map(faq => ({
            '@type': 'Question',
            'name': this.translate.instant(faq.titleKey),
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': this.translate.instant(faq.descKey)
            }
          }))
        }
      ]
    };

    this.seoService.setJsonLd(schema);

    // WebSite schema with SearchAction (Sitelinks Searchbox)
    this.seoService.setWebSiteSchema();

    // VideoObject schema for the demo reel
    this.seoService.setVideoSchema({
      name: 'JSL Technology — Product Demo Reel',
      description: 'Watch how JSL Technology builds custom ERP, POS, and mobile solutions that transform businesses worldwide.',
      thumbnailUrl: `${baseUrl}/assets/imgs/jsl-social-default.jpg`,
      uploadDate: '2025-10-01',
      duration: 'PT3M',
      embedUrl: this.demoVideoUrl,
    });

    // AggregateRating + Review schema from testimonial data
    const testimonialData = this.testimonials();
    if (testimonialData && testimonialData.length > 0) {
      const resolvedReviews = testimonialData.map((t: any) => ({
        authorName: this.translate.instant(t.nameKey),
        reviewBody: this.translate.instant(t.textKey),
        ratingValue: t.ratingValue ?? 5,
        datePublished: t.datePublished ?? '2025-10-01',
      }));
      this.seoService.setReviewSchema(resolvedReviews);
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    setTimeout(() => {
      // 1. Hero Slider
      const heroSwiperEl = this.el.nativeElement.querySelector('.hero-slider swiper-container');
      
      if (heroSwiperEl) {
        // ← CRÍTICO: Configuración SIMPLIFICADA y DIRECTA
        Object.assign(heroSwiperEl, {
          modules: [EffectFade, Autoplay, Pagination, Navigation],
          effect: 'fade',
          fadeEffect: { crossFade: true },
          pagination: { 
            clickable: true,
            dynamicBullets: true 
          },
          autoplay: {
            delay: 6000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          },
          loop: true,
          speed: 1000,
          grabCursor: true,
          allowTouchMove: true,
          simulateTouch: true,
          // ← CRÍTICO: Navegación correctamente configurada
          navigation: {
            nextEl: '.hero-swiper-button-next',
            prevEl: '.hero-swiper-button-prev',
            disabledClass: 'swiper-button-disabled',
          },
        });

        // Inicializar
        heroSwiperEl.initialize();
        this.setupHeroNavigationVisibility();

        // Iniciar autoplay
        setTimeout(() => {
          if (heroSwiperEl.swiper && heroSwiperEl.swiper.autoplay) {
            heroSwiperEl.swiper.autoplay.start();
          }
        }, 200);
      }

      // 2. Logo Slider (Tech Stack)
      const logoSwiperEl = this.el.nativeElement.querySelector('.tech-stack-slider swiper-container');

      if (logoSwiperEl) {
        Object.assign(logoSwiperEl, {
          modules: [Autoplay],
          slidesPerView: 2,
          spaceBetween: 30,
          loop: true,
          speed: 3000,
          autoplay: {
            delay: 0,
            disableOnInteraction: false,
            pauseOnMouseEnter: false,
          },
          allowTouchMove: false,
          breakpoints: {
            640: { slidesPerView: 3, spaceBetween: 40 },
            768: { slidesPerView: 4, spaceBetween: 50 },
            1024: { slidesPerView: 5, spaceBetween: 60 },
            1280: { slidesPerView: 6, spaceBetween: 70 },
          },
        });

        logoSwiperEl.initialize();

        setTimeout(() => {
          if (logoSwiperEl.swiper && logoSwiperEl.swiper.autoplay) {
            logoSwiperEl.swiper.autoplay.start();
          }
        }, 100);
      }

      // 3. Testimonial Slider
      const testimonialSwiperEl = this.el.nativeElement.querySelector(
        'swiper-container.testimonial-slider'
      );

      if (testimonialSwiperEl) {
        const prevBtn = this.el.nativeElement.querySelector('.testimonial-nav-btn--prev');
        const nextBtn = this.el.nativeElement.querySelector('.testimonial-nav-btn--next');

        Object.assign(testimonialSwiperEl, {
          modules: [Pagination, Autoplay, Navigation],
          effect: 'slide',
          slidesPerView: 1.1,
          spaceBetween: 16,
          grabCursor: true,
          centeredSlides: false,
          loop: true,
          speed: 500,
          autoplay: {
            delay: 6000,
            disableOnInteraction: true,
            pauseOnMouseEnter: true,
          },
          pagination: {
            clickable: true,
            dynamicBullets: true,
          },
          navigation: {
            nextEl: nextBtn,
            prevEl: prevBtn,
          },
          breakpoints: {
            640: { slidesPerView: 2, spaceBetween: 20 },
            1024: { slidesPerView: 3, spaceBetween: 24 },
          },
        });

        testimonialSwiperEl.initialize();
      }

      // 4. Offerings Slider
      this.initializeOfferingsSlider();

      // 4. Latest Insights Slider
      const insightsSwiperEl = this.el.nativeElement.querySelector('.latest-insights swiper-container');

      if (insightsSwiperEl) {
        Object.assign(insightsSwiperEl, this.insightsSwiperConfig);
        insightsSwiperEl.initialize();
        this.setupInsightsNavigationVisibility();
        this.bindSliderBoundaryState(insightsSwiperEl, this.canInsightsPrev, this.canInsightsNext);
      }

      // 5. Featured Projects Slider
      const projectsSwiperEl = this.el.nativeElement.querySelector('.featured-projects swiper-container');

      if (projectsSwiperEl) {
        Object.assign(projectsSwiperEl, this.projectsSwiperConfig);
        projectsSwiperEl.initialize();
        this.setupProjectsNavigationVisibility();
        this.bindSliderBoundaryState(projectsSwiperEl, this.canProjectsPrev, this.canProjectsNext);
      }

      // Setup Exit Intent (desktop)
      this.setupExitIntent();
      // Mobile exit-intent (scroll-up detection)
      this.setupMobileExitIntent();

      // Social proof toasts intentionally disabled by request.
      // Keep toast component/service available for other flows.

      // Desaparecer indicador de scroll después de 5 segundos
      setTimeout(() => {
        if (this.showScrollIndicator()) {
          this.showScrollIndicator.set(false);
          localStorage.setItem('jsl_scroll_indicator_seen', 'true');
        }
      }, 5000);

      this.setupIdleAnimation();
    }, 100); // Aumentado a 100ms para asegurar que el DOM esté listo
  }

  private startSocialProofSimulation() {
    if (!this.isBrowser) return;

    // Initial delay then periodic
    setTimeout(() => {
      this.showRandomSocialProof();
      this.socialProofInterval = setInterval(() => {
        this.showRandomSocialProof();
      }, 45000); // Every 45 seconds
    }, 10000); // Start 10s after load
  }

  private showRandomSocialProof() {
    const proofs = [
      { key: 'HOME.PROOF_1', type: 'info' }, // Someone from Madrid downloaded Whitepaper
      { key: 'HOME.PROOF_2', type: 'success' }, // New Enterprise client onboarded
      { key: 'HOME.PROOF_3', type: 'info' }, // 500+ developers joined the community
    ];
    const random = proofs[Math.floor(Math.random() * proofs.length)];
    // this.toastService.show(random.key, random.type, 4000);
    // Note: Since I don't have the keys in translation files yet, I will use hardcoded mock strings for now if keys are missing
    // But better to stick to keys. I will add keys to en.json later or use a fallback.

    // Using translated messages or fallbacks
    const messages = [
      this.translate.instant('HOME.PROOF_1') === 'HOME.PROOF_1' ? 'Someone from Madrid just downloaded the 2025 Whitepaper' : this.translate.instant('HOME.PROOF_1'),
      this.translate.instant('HOME.PROOF_2') === 'HOME.PROOF_2' ? 'New Enterprise client from FinTech sector just onboarded' : this.translate.instant('HOME.PROOF_2'),
      this.translate.instant('HOME.PROOF_3') === 'HOME.PROOF_3' ? 'JSL just deployed a new High-Performance Banking App' : this.translate.instant('HOME.PROOF_3'),
      'Visitor from London requested a consultation'
    ];
    const msg = messages[Math.floor(Math.random() * messages.length)];
    this.toastService.show(msg, 'info', 5000);
  }

  private setupExitIntent() {
    // Only on desktop
    if (window.innerWidth > 1024) {
      // Use a flag to show only once per session
      const hasShownExitModal = sessionStorage.getItem('jsl_exit_modal_shown');

      if (!hasShownExitModal) {
        this.unlistenExitIntent = this.renderer.listen(this.document, 'mouseleave', (event: MouseEvent) => {
          if (event.clientY <= 0) {
            this.openExitModal();
          }
        });
      }
    }
  }

  private setupMobileExitIntent(): void {
    if (window.innerWidth > 1024) return;
    if (sessionStorage.getItem('jsl_mobile_exit_shown')) return;

    let lastScrollY = window.scrollY;
    let lastScrollTime = Date.now();

    const onScroll = () => {
      const now = Date.now();
      const currentY = window.scrollY;
      const delta = lastScrollY - currentY; // positive = scrolling up
      const timeDelta = now - lastScrollTime;

      if (delta > 150 && timeDelta < 300 && currentY > 300) {
        sessionStorage.setItem('jsl_mobile_exit_shown', 'true');
        this.isMobileExitSheetOpen.set(true);
        this.analyticsService.trackEvent('exit_intent_mobile', { trigger: 'scroll_up', page: this.router.url });
        window.removeEventListener('scroll', onScroll);
      }

      lastScrollY = currentY;
      lastScrollTime = now;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    this.destroy$.subscribe(() => window.removeEventListener('scroll', onScroll));
  }

  closeMobileExitSheet(): void {
    this.isMobileExitSheetOpen.set(false);
  }

  private setupHeroNavigationVisibility(): void {
    const heroSlider = this.el.nativeElement.querySelector('.hero-slider') as HTMLElement | null;
    if (!heroSlider) return;

    const updateVisibility = (event: MouseEvent) => {
      const rect = heroSlider.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const pointerPercent = (x / rect.width) * 100;

      // UX: la visibilidad empieza a crecer ya desde el 40% hacia el borde izquierdo
      // y desde el 60% hacia el borde derecho (centro visual en 50%).
      const leftRatio = Math.max(0, Math.min(1, (40 - pointerPercent) / 40));
      const rightRatio = Math.max(0, Math.min(1, (pointerPercent - 60) / 40));

      heroSlider.style.setProperty('--hero-nav-left-visibility', leftRatio.toFixed(3));
      heroSlider.style.setProperty('--hero-nav-right-visibility', rightRatio.toFixed(3));
    };

    this.unlistenHeroMouseMove = this.renderer.listen(heroSlider, 'mousemove', updateVisibility);
    this.unlistenHeroMouseLeave = this.renderer.listen(heroSlider, 'mouseleave', () => {
      heroSlider.style.setProperty('--hero-nav-left-visibility', '0');
      heroSlider.style.setProperty('--hero-nav-right-visibility', '0');
    });

    // Estado inicial sutil
    heroSlider.style.setProperty('--hero-nav-left-visibility', '0');
    heroSlider.style.setProperty('--hero-nav-right-visibility', '0');
  }

  private setupOfferingsNavigationVisibility(): void {
    const offeringsSection = this.el.nativeElement.querySelector('.offerings-section') as HTMLElement | null;
    if (!offeringsSection) return;

    const updateVisibility = (event: MouseEvent) => {
      const rect = offeringsSection.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const pointerPercent = (x / rect.width) * 100;

      const leftRatio = Math.max(0, Math.min(1, (30 - pointerPercent) / 30));
      const rightRatio = Math.max(0, Math.min(1, (pointerPercent - 70) / 30));

      offeringsSection.style.setProperty('--offerings-nav-left-visibility', leftRatio.toFixed(3));
      offeringsSection.style.setProperty('--offerings-nav-right-visibility', rightRatio.toFixed(3));
    };

    this.unlistenOfferingsMouseMove = this.renderer.listen(offeringsSection, 'mousemove', updateVisibility);
    this.unlistenOfferingsMouseLeave = this.renderer.listen(offeringsSection, 'mouseleave', () => {
      offeringsSection.style.setProperty('--offerings-nav-left-visibility', '0');
      offeringsSection.style.setProperty('--offerings-nav-right-visibility', '0');
    });

    offeringsSection.style.setProperty('--offerings-nav-left-visibility', '0');
    offeringsSection.style.setProperty('--offerings-nav-right-visibility', '0');
  }

  private setupInsightsNavigationVisibility(): void {
    const insightsSection = this.el.nativeElement.querySelector('.latest-insights') as HTMLElement | null;
    if (!insightsSection) return;

    const updateVisibility = (event: MouseEvent) => {
      const rect = insightsSection.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const pointerPercent = (x / rect.width) * 100;

      const leftRatio = Math.max(0, Math.min(1, (30 - pointerPercent) / 30));
      const rightRatio = Math.max(0, Math.min(1, (pointerPercent - 70) / 30));

      insightsSection.style.setProperty('--insights-nav-left-visibility', leftRatio.toFixed(3));
      insightsSection.style.setProperty('--insights-nav-right-visibility', rightRatio.toFixed(3));
    };

    this.unlistenInsightsMouseMove = this.renderer.listen(insightsSection, 'mousemove', updateVisibility);
    this.unlistenInsightsMouseLeave = this.renderer.listen(insightsSection, 'mouseleave', () => {
      insightsSection.style.setProperty('--insights-nav-left-visibility', '0');
      insightsSection.style.setProperty('--insights-nav-right-visibility', '0');
    });

    insightsSection.style.setProperty('--insights-nav-left-visibility', '0');
    insightsSection.style.setProperty('--insights-nav-right-visibility', '0');
  }

  private setupProjectsNavigationVisibility(): void {
    const projectsSection = this.el.nativeElement.querySelector('.featured-projects') as HTMLElement | null;
    if (!projectsSection) return;

    const updateVisibility = (event: MouseEvent) => {
      const rect = projectsSection.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const pointerPercent = (x / rect.width) * 100;

      const leftRatio = Math.max(0, Math.min(1, (30 - pointerPercent) / 30));
      const rightRatio = Math.max(0, Math.min(1, (pointerPercent - 70) / 30));

      projectsSection.style.setProperty('--projects-nav-left-visibility', leftRatio.toFixed(3));
      projectsSection.style.setProperty('--projects-nav-right-visibility', rightRatio.toFixed(3));
    };

    this.unlistenProjectsMouseMove = this.renderer.listen(projectsSection, 'mousemove', updateVisibility);
    this.unlistenProjectsMouseLeave = this.renderer.listen(projectsSection, 'mouseleave', () => {
      projectsSection.style.setProperty('--projects-nav-left-visibility', '0');
      projectsSection.style.setProperty('--projects-nav-right-visibility', '0');
    });

    projectsSection.style.setProperty('--projects-nav-left-visibility', '0');
    projectsSection.style.setProperty('--projects-nav-right-visibility', '0');
  }

  getStars(count: number): any[] {
    return new Array(count);
  }

  toggleFaq(index: number) {
    this.faqPreview[index].isOpen = !this.faqPreview[index].isOpen;
  }

  openVideoModal() {
    this.isVideoModalOpen.set(true);
  }

  closeVideoModal() {
    this.isVideoModalOpen.set(false);
  }

  onHeroCtaClick(slide: number, ctaType: 'primary' | 'secondary' = 'primary'): void {
    this.analyticsService.trackEvent('hero_cta_click', { slide, cta_type: ctaType });
  }

  openBookingModal() {
    this.isBookingModalOpen.set(true);
    this.analyticsService.trackEvent('booking_modal_open', { source: 'home' });
  }

  closeBookingModal() {
    this.isBookingModalOpen.set(false);
  }

  openExitModal() {
    if (!sessionStorage.getItem('jsl_exit_modal_shown')) {
      this.isExitModalOpen.set(true);
      sessionStorage.setItem('jsl_exit_modal_shown', 'true');
    }
  }

  closeExitModal() {
    this.isExitModalOpen.set(false);
  }

  onExitModalConfirm() {
    this.closeExitModal();
    this.downloadLeadMagnet();
  }

  setProjectCategory(category: string) {
    this.selectedProjectCategory.set(category);
  }

  openSearch() {
    this.searchUiService.open();
  }

  onPrevNav() {
    if (!this.isBrowser) return;
    const heroSwiperEl = this.el.nativeElement.querySelector('.hero-slider swiper-container');
    heroSwiperEl?.swiper?.slidePrev();
  }

  onNextNav() {
    if (!this.isBrowser) return;
    const heroSwiperEl = this.el.nativeElement.querySelector('.hero-slider swiper-container');
    heroSwiperEl?.swiper?.slideNext();
  }

  onPrevOfferings() {
    if (!this.isBrowser) return;
    const offeringsSwiperEl = this.el.nativeElement.querySelector('.offerings-section swiper-container');
    offeringsSwiperEl?.swiper?.slidePrev();
  }

  onNextOfferings() {
    if (!this.isBrowser) return;
    const offeringsSwiperEl = this.el.nativeElement.querySelector('.offerings-section swiper-container');
    offeringsSwiperEl?.swiper?.slideNext();
  }

  onPrevInsights() {
    if (!this.isBrowser) return;
    const insightsSwiperEl = this.el.nativeElement.querySelector('.latest-insights swiper-container');
    insightsSwiperEl?.swiper?.slidePrev();
  }

  onNextInsights() {
    if (!this.isBrowser) return;
    const insightsSwiperEl = this.el.nativeElement.querySelector('.latest-insights swiper-container');
    insightsSwiperEl?.swiper?.slideNext();
  }

  onPrevProjects() {
    if (!this.isBrowser) return;
    const projectsSwiperEl = this.el.nativeElement.querySelector('.featured-projects swiper-container');
    projectsSwiperEl?.swiper?.slidePrev();
  }

  onNextProjects() {
    if (!this.isBrowser) return;
    const projectsSwiperEl = this.el.nativeElement.querySelector('.featured-projects swiper-container');
    projectsSwiperEl?.swiper?.slideNext();
  }

  private setupIdleAnimation() {
    if (!this.isBrowser) return;

    // Solo una vez por sesión
    const hasAnimated = sessionStorage.getItem('jsl_home_idle_animated');
    if (hasAnimated) return;

    const interactions$ = merge(
      fromEvent(this.document, 'mousemove'),
      fromEvent(this.document, 'mousedown'),
      fromEvent(this.document, 'keydown'),
      fromEvent(this.document, 'touchstart'),
      fromEvent(window, 'scroll')
    ).pipe(startWith(null));

    // Esperar 8 segundos de inactividad para sugerir scroll antes
    interactions$
      .pipe(
        switchMap(() => timer(8000)),
        takeUntil(this.destroy$),
        // Solo si el usuario está al inicio de la página y onboarding permite
        filter(() => window.scrollY < 50 && this.onboardingFlow.canShowSecondaryUI())
      )
      .subscribe(() => {
        this.runScrollPeekAnimation();
      });
  }

  private easeOutBounce = (x: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (x < 1 / d1) {
      return n1 * x * x;
    } else if (x < 2 / d1) {
      return n1 * (x -= 1.5 / d1) * x + 0.75;
    } else if (x < 2.5 / d1) {
      return n1 * (x -= 2.25 / d1) * x + 0.9375;
    } else {
      return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }
  };

  private runScrollPeekAnimation() {
    if (!this.isBrowser || sessionStorage.getItem('jsl_home_idle_animated')) return;

    const peekAmount = window.innerWidth < 768 ? 80 : 150;

    sessionStorage.setItem('jsl_home_idle_animated', 'true');

    // Funciones de easing personalizadas para un efecto más natural
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    // Misma animación, pero más rápida
    this.scrollEngine.scrollTo(peekAmount, {
      duration: 1.0,
      easing: easeOutCubic,
      onComplete: () => {
        // Pausa breve y vuelta arriba con rebote, en menor tiempo.
        setTimeout(() => {
          this.scrollEngine.scrollTo(0, {
            duration: 1.8,
            easing: this.easeOutBounce,
          });
        }, 400);
      }
    });
  }

  downloadLeadMagnet() {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);

    // Simular descarga con delay
    setTimeout(() => {
      this.toastService.show(
        'HOME.LEAD_MAGNET_SENT',
        'success',
        5000
      );
      this.isSubmitting.set(false);
    }, 2000);
  }
}
