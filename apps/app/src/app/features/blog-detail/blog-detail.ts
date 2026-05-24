// blog-detail.ts
import {
  Component,
  OnInit,
  OnDestroy,
  ViewEncapsulation,
  inject,
  ChangeDetectionStrategy,
  CUSTOM_ELEMENTS_SCHEMA,
  AfterViewChecked,
  AfterViewInit,
  ElementRef,
  Inject,
  PLATFORM_ID,
  ViewChild,
  HostListener,
  signal,
  WritableSignal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { Subscription, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { DataService, BlogPost, TeamMember } from '@core/services/data.service';
import { Title } from '@angular/platform-browser';
import { AnimateOnScroll } from '@shared/directives/animate-on-scroll';
import { CtaComponent } from '@shared/components/cta/cta';
import { WhitepaperDownloadComponent } from '@shared/components/whitepaper-download/whitepaper-download';
import { Card } from '@shared/components/card/card';
import { Seo } from '@core/services/seo';
import { DirectionService } from '@core/services/direction.service';
import { SocialShareComponent } from '@shared/components/social-share/social-share';
import { ScrollEngineService } from '@core/services/scroll-engine.service';

// Swiper Web Components
import { Pagination, Autoplay, Navigation, FreeMode } from 'swiper/modules';
import { register } from 'swiper/element/bundle';
register();

@Component({
  selector: 'jsl-blog-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    RouterLink,
    LucideAngularModule,
    AnimateOnScroll,
    CtaComponent,
    WhitepaperDownloadComponent,
    Card,
    SocialShareComponent
  ],
  templateUrl: './blog-detail.html',
  styleUrl: './blog-detail.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BlogDetail
  implements OnInit, OnDestroy, AfterViewChecked, AfterViewInit
{
  public translate = inject(TranslateService);
  private route = inject(ActivatedRoute);
  private dataService = inject(DataService);
  private titleService = inject(Title);
  private el = inject(ElementRef);
  @Inject(PLATFORM_ID) private platformId = inject(PLATFORM_ID);
  private seoService = inject(Seo);
  public directionService = inject(DirectionService);
  private scrollEngine = inject(ScrollEngineService);

  @ViewChild('copyTooltip') copyTooltip!: ElementRef;
  @ViewChild('bannerImage') bannerImage!: ElementRef;

  public currentLang = 'es';
  public post$: Observable<BlogPost | undefined>;
  public relatedPosts$: Observable<BlogPost[]>;
  public author$: Observable<TeamMember | undefined>;

  public scrollProgress = 0;
  private langSub: Subscription | undefined;
  private postData: BlogPost | undefined;
  private highlighted = false;
  private swiperInitialized = false;

  // Social Engagement State
  public likes = signal(124);
  public isLiked = signal(false);
  public viewCount = signal(1240);
  public showTopShareMenu = signal(false);
  public showSideShareMenu = signal(false);
  public isListening = signal(false);
  public showCommentsModal = signal(false);

  // Comments state
  public comments = signal([
    { author: 'Marcos R.', date: new Date(), text: 'Excelente artículo, el SSR en Angular ha mejorado muchísimo.' },
    { author: 'Elena M.', date: new Date(), text: 'Muy buena explicación sobre la hidratación no destructiva.' }
  ]);
  public newCommentText = '';

  private utterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.currentLang =
      this.translate.currentLang || this.translate.defaultLang || 'es';

    this.post$ = this.route.paramMap.pipe(
      switchMap((params) => {
        this.highlighted = false;
        this.scrollProgress = 0;
        this.swiperInitialized = false;
        const slug = params.get('slug');
        return slug ? this.dataService.getPostBySlug(slug) : of(undefined);
      })
    );

    this.relatedPosts$ = this.post$.pipe(
      switchMap((post) => {
        if (!post) return of([]);
        return this.dataService.getRelatedPosts(post.slug, post.tags || []);
      })
    );

    this.author$ = this.post$.pipe(
      switchMap((post) => {
        if (!post) return of(undefined);
        return this.dataService.getTeamMemberByKey(post.authorKey);
      })
    );
  }

  // Función para truncar texto (reemplaza el pipe truncate)
  truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // Scroll progress calculation
  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (!isPlatformBrowser(this.platformId)) return;

    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
    
    this.scrollProgress = Math.min(100, Math.max(0, scrollPercent));
  }

  scrollToTop() {
    if (isPlatformBrowser(this.platformId)) {
      this.scrollEngine.scrollTo(0, { immediate: true });
    }
  }

  // Social Interactions
  toggleLike() {
    if (this.isLiked()) {
      this.likes.update(v => v - 1);
      this.isLiked.set(false);
    } else {
      this.likes.update(v => v + 1);
      this.isLiked.set(true);
    }
  }

  toggleTopShareMenu() {
    this.showTopShareMenu.update(v => !v);
    if (this.showTopShareMenu()) this.showSideShareMenu.set(false);
  }

  toggleSideShareMenu() {
    this.showSideShareMenu.update(v => !v);
    if (this.showSideShareMenu()) this.showTopShareMenu.set(false);
  }

  async sharePost(post: BlogPost) {
    if (!isPlatformBrowser(this.platformId)) return;

    const shareData = {
      title: this.translate.instant('BLOG.' + post.key + '_TITLE'),
      text: this.translate.instant('BLOG.' + post.key + '_EXCERPT'),
      url: window.location.href,
    };

    const canUseWebShare =
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      (!navigator.canShare || navigator.canShare(shareData));

    if (canUseWebShare) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        console.error('Error sharing with Web Share API:', error);
      }
    }

    // Fallback conservado: modal con opciones sociales para navegadores sin soporte.
    this.showSideShareMenu.set(true);
    this.showTopShareMenu.set(false);
  }

  toggleCommentsModal() {
    this.showCommentsModal.update(v => !v);
  }

  // Text to Speech
  toggleListen() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.isListening()) {
      window.speechSynthesis.cancel();
      this.isListening.set(false);
    } else {
      const content = this.el.nativeElement.querySelector('.content-body')?.innerText || '';
      if (!content) return;

      this.utterance = new SpeechSynthesisUtterance(content);
      this.utterance.lang = this.translate.currentLang === 'es' ? 'es-ES' : 'en-US';
      this.utterance.onend = () => this.isListening.set(false);

      window.speechSynthesis.speak(this.utterance);
      this.isListening.set(true);
    }
  }

  // Comments
  submitComment() {
    if (!this.newCommentText.trim()) return;

    this.comments.update(prev => [
      {
        author: 'Guest User',
        date: new Date(),
        text: this.newCommentText
      },
      ...prev
    ]);
    this.newCommentText = '';
  }

  handleCommentKeydown(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'Enter') {
      this.submitComment();
    }
  }

  // Image load handler
  onImageLoad() {
    if (this.bannerImage?.nativeElement) {
      this.bannerImage.nativeElement.classList.add('loaded');
    }
  }

  // Copy link functionality
  copyLink() {
    if (!isPlatformBrowser(this.platformId)) return;

    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      const tooltip = this.copyTooltip?.nativeElement;
      if (tooltip) {
        const originalText = tooltip.textContent;
        tooltip.textContent = '¡Copiado!';
        
        setTimeout(() => {
          tooltip.textContent = originalText;
        }, 2000);
      }
    });
  }

  ngAfterViewInit(): void {}

  // Prism code highlighting + Swiper initialization (after slides are rendered)
  ngAfterViewChecked(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (!this.highlighted) {
      const hasContent = this.el.nativeElement.querySelector('.blog-content p');
      if (hasContent) {
        import('prismjs').then(Prism => {
          setTimeout(() => {
            const prismModule = (Prism as any).default || Prism;
            prismModule.highlightAll();
            this.highlighted = true;
          }, 500);
        }).catch(err => console.error('Error loading PrismJS', err));
      }
    }

    if (!this.swiperInitialized) {
      const swiperEl = this.el.nativeElement.querySelector('swiper-container');
      const slides = swiperEl?.querySelectorAll('swiper-slide');
      if (swiperEl && slides && slides.length > 0 && typeof swiperEl.initialize === 'function') {
        this.swiperInitialized = true;
        Object.assign(swiperEl, {
          modules: [Pagination, Autoplay, Navigation, FreeMode],
          spaceBetween: 24,
          slidesPerView: 'auto',
          centeredSlides: false,
          grabCursor: true,
          freeMode: true,
          pagination: { clickable: true, dynamicBullets: true },
          breakpoints: {
            320: { slidesPerView: 1.2, spaceBetween: 16 },
            480: { slidesPerView: 1.5, spaceBetween: 20 },
            768: { slidesPerView: 2.2, spaceBetween: 24 },
            1024: { slidesPerView: 3, spaceBetween: 30 },
            1400: { slidesPerView: 3.5, spaceBetween: 30 },
          },
        });
        swiperEl.initialize();
      }
    }
  }

  ngOnInit(): void {
    this.langSub = this.translate.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
      this.updateMetadata();
    });

    this.post$.subscribe((post) => {
      this.postData = post;
      this.updateMetadata();
    });

    // Initialize scroll progress
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.onWindowScroll(), 100);
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && typeof window.speechSynthesis !== 'undefined') {
      window.speechSynthesis.cancel();
    }
    this.langSub?.unsubscribe();
  }

  private updateMetadata(): void {
    if (!this.postData) return;

    // Claves para la traducción
    const titleKey = `BLOG.${this.postData.key}_TITLE`;
    const excerptKey = `BLOG.${this.postData.key}_EXCERPT`;

    // URLs
    const baseUrl = this.seoService.getBaseUrl();
    const postUrl = `${baseUrl}/${this.currentLang}/blog/${this.postData.slug}`;

    let imageUrl = this.postData.imageUrl;
    
    if (imageUrl && !imageUrl.startsWith('http')) {
      const assetsIndex = imageUrl.indexOf('assets/');
      if (assetsIndex > -1) {
        const relativePath = imageUrl.substring(assetsIndex);
        imageUrl = `${baseUrl}/${relativePath}`;
      }
    }

    // Traducir título y descripción
    this.translate.get([titleKey, excerptKey, 'COMMON.BREADCRUMB_HOME', 'HEADER.BLOG', 'COMMON.DEFAULT_DESCRIPTION']).subscribe(translations => {
      const translatedTitle = (translations[titleKey] && translations[titleKey] !== titleKey)
        ? translations[titleKey]
        : 'JSL Technology Blog';
      const translatedDesc = (translations[excerptKey] && translations[excerptKey] !== excerptKey)
        ? translations[excerptKey]
        : (translations['COMMON.DEFAULT_DESCRIPTION'] || 'Expert software development and digital transformation solutions.');

      const title = `${translatedTitle} | JSL Technology Blog`;
      this.seoService.updateTitleAndDescription(title, translatedDesc);

      // --- Breadcrumbs Schema ---
      this.seoService.setBreadcrumbs([
        { name: translations['COMMON.BREADCRUMB_HOME'], item: `/${this.currentLang}/home` },
        { name: translations['HEADER.BLOG'], item: `/${this.currentLang}/blog` },
        { name: translatedTitle, item: `/${this.currentLang}/blog/${this.postData?.slug}` }
      ]);
      this.seoService.updateCanonicalTag(postUrl);
      this.seoService.updateSocialTags(
        title,
        translatedDesc,
        postUrl,
        imageUrl,
        'article',
        translations[titleKey] || translatedTitle
      );

      // --- article:* Open Graph meta tags ---
      this.seoService.updateArticleTags({
        publishedTime: this.postData?.date || '',
        modifiedTime: this.postData?.date || '',
        author: `${baseUrl}/en/about-us`,
        section: (this.postData?.tags && this.postData.tags.length > 0)
          ? this.postData.tags[0]
          : 'Technology',
        tags: this.postData?.tags || [],
      });

      // --- Datos Estructurados: Article ---
      const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        'headline': translatedTitle,
        'description': translatedDesc,
        'image': imageUrl,
        'datePublished': this.postData?.date,
        'dateModified': this.postData?.date,
        'author': {
          '@type': 'Organization',
          'name': 'JSL Technology',
          'url': baseUrl
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'JSL Technology',
          'logo': {
            '@type': 'ImageObject',
            'url': `${baseUrl}/logo.png`
          }
        },
        'url': postUrl,
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': postUrl
        }
      };
      this.seoService.setJsonLd(articleSchema, 'article-schema');
    });
  }

  trackBySlug(index: number, post: BlogPost): string {
    return post.slug;
  }
}
