import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, CUSTOM_ELEMENTS_SCHEMA, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Card } from '@shared/components/card/card';
import { AnimateOnScroll } from '@shared/directives/animate-on-scroll';
import { DataService } from '@core/services/data.service';
import { CtaComponent } from '@shared/components/cta/cta';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { PaginationComponent } from '@shared/components/pagination/pagination';
import { Seo } from '@core/services/seo';
import { ScrollEngineService } from '@core/services/scroll-engine.service';
import { take } from 'rxjs/operators';

// Swiper modules
import { Pagination, Autoplay, Navigation, EffectFade } from 'swiper/modules';

@Component({
  selector: 'jsl-blog',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    Card,
    AnimateOnScroll,
    CtaComponent,
    RouterLink,
    LucideAngularModule,
    PaginationComponent
  ],
  templateUrl: './blog.html',
  styleUrl: './blog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Blog implements OnInit, AfterViewInit {
  @ViewChild('featuredSwiper') swiperElement!: ElementRef;
  private swiperRegistered = signal(false);

  private platformId = inject(PLATFORM_ID);
  private translate = inject(TranslateService);
  private dataService = inject(DataService);
  private seoService = inject(Seo);
  private scrollEngine = inject(ScrollEngineService);

  public currentLang: string;

  // Pagination settings
  public currentPage = signal(1);
  public itemsPerPage = 6;

  // 1. Señal base de todos los posts
  private allPosts = toSignal(this.dataService.getBlogPosts(), {
    initialValue: [],
  });

  // 2. Señales para los filtros
  public searchTerm = signal('');
  public selectedTag = signal<string | null>(null);

  // 3. Señal computada para obtener todos los tags únicos
  public allTags = computed(() => {
    const tags = this.allPosts().flatMap((post) => post.tags);
    return [...new Set(tags)]; // Devuelve un array de tags únicos
  });

  // 4. Señal computada para los posts filtrados
  private filteredPosts = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const tag = this.selectedTag();

    // Reset pagination when filters change
    // Note: We can't set signals inside computed. We should handle this in the set methods.

    // Obtener claves de traducción para la búsqueda
    const titleKeys = this.allPosts().map((p) => `BLOG.${p.key}_TITLE`);
    const excerptKeys = this.allPosts().map((p) => `BLOG.${p.key}_EXCERPT`);
    const translations = this.translate.instant([...titleKeys, ...excerptKeys]);

    return this.allPosts().filter((post) => {
      // Búsqueda por Tag
      const tagMatch = !tag || post.tags.includes(tag);

      // Búsqueda por Término
      const title = translations[`BLOG.${post.key}_TITLE`]?.toLowerCase() || '';
      const excerpt = translations[`BLOG.${post.key}_EXCERPT`]?.toLowerCase() || '';
      const termMatch =
        term === '' || title.includes(term) || excerpt.includes(term);

      return tagMatch && termMatch;
    });
  });

  // 5. Señal computada para los artículos destacados
  public featuredPosts = computed(() =>
    this.filteredPosts().filter((p) => p.featured),
  );

  // 6. Señal computada para los posts regulares (todos menos los destacados)
  public regularPosts = computed(() => {
    const featured = this.featuredPosts();
    const featuredSlugs = new Set(featured.map(p => p.slug));
    return this.filteredPosts().filter((p) => !featuredSlugs.has(p.slug));
  });

  public featuredSwiperConfig = {
    modules: [Pagination, Autoplay, Navigation, EffectFade],
    slidesPerView: 1,
    effect: 'fade',
    fadeEffect: {
      crossFade: true
    },
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    pagination: {
      clickable: true,
      dynamicBullets: true,
    },
    navigation: true,
    grabCursor: true
  };

  // 7. Paginated posts
  public paginatedPosts = computed(() => {
    const posts = this.regularPosts();
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    return posts.slice(startIndex, startIndex + this.itemsPerPage);
  });

  public totalItems = computed(() => this.regularPosts().length);

  constructor() {
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || 'es';

    if (isPlatformBrowser(this.platformId)) {
      import('swiper/element/bundle').then(({ register }) => {
        register();
        this.swiperRegistered.set(true);
      });
    }

    effect(() => {
      if (this.swiperRegistered() && this.featuredPosts().length > 0) {
        setTimeout(() => {
          if (this.swiperElement) {
            const swiperEl = this.swiperElement.nativeElement;
            if (!swiperEl.swiper && typeof swiperEl.initialize === 'function') {
              Object.assign(swiperEl, this.featuredSwiperConfig);
              swiperEl.initialize();
            }
          }
        }, 50);
      }
    });
  }

  ngOnInit() {
    this.translate.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
      this.syncBlogStructuredData();
    });

    this.dataService.getBlogPosts().pipe(take(1)).subscribe(() => this.syncBlogStructuredData());
  }

  ngAfterViewInit() {}

  private syncBlogStructuredData(): void {
    const posts = this.allPosts();
    if (!posts.length) return;

    const baseUrl = this.seoService.getBaseUrl();
    const blogUrl = `${baseUrl}/${this.currentLang}/blog`;
    const itemListElements = posts.map((post, index) => {
      const titleKey = `BLOG.${post.key}_TITLE`;
      const excerptKey = `BLOG.${post.key}_EXCERPT`;
      const title = this.translate.instant(titleKey);
      const excerpt = this.translate.instant(excerptKey);
      const postUrl = `${baseUrl}/${this.currentLang}/blog/${post.slug}`;

      return {
        '@type': 'BlogPosting',
        position: index + 1,
        headline: title !== titleKey ? title : post.slug,
        description: excerpt !== excerptKey ? excerpt : undefined,
        url: postUrl,
        datePublished: post.date,
        dateModified: post.date,
        author: {
          '@type': 'Person',
          name: 'JSL Technology Team',
        },
      };
    });

    this.seoService.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'JSL Technology Blog',
      url: blogUrl,
      itemListElement: itemListElements,
    });
  }

  // --- MÉTODOS PARA ACTUALIZAR FILTROS ---

  selectTag(tag: string | null): void {
    if (this.selectedTag() === tag) {
      this.selectedTag.set(null); // Deseleccionar
    } else {
      this.selectedTag.set(tag); // Seleccionar nuevo tag
    }
    this.currentPage.set(1);
  }

  onSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.searchTerm.set(term);
    this.currentPage.set(1);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.scrollEngine.scrollTo(0, { immediate: true });
    this.updatePaginationLinks(page);
  }

  private updatePaginationLinks(page: number): void {
    const totalPages = Math.ceil(this.totalItems() / this.itemsPerPage);
    const base = `/${this.currentLang}/blog`;
    const params = new URLSearchParams();
    if (this.searchTerm()) params.set('q', this.searchTerm());
    if (this.selectedTag()) params.set('tag', this.selectedTag()!);
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const sep = queryStr ? '&' : '?';
    const prev = page > 1 ? `${base}${queryStr}${sep}page=${page - 1}` : undefined;
    const next = page < totalPages ? `${base}${queryStr}${sep}page=${page + 1}` : undefined;
    this.seoService.setPaginationLinks(prev, next);
  }
}
