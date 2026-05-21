import {
  Component,
  Input,
  ElementRef,
  inject,
  PLATFORM_ID,
  AfterViewChecked,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BlogPost, Solution } from '@core/services/data.service';
import { LucideAngularModule } from 'lucide-angular';
import { AnimateOnScroll } from '@shared/directives/animate-on-scroll';
import { DirectionService } from '@core/services/direction.service';

import { Pagination, Navigation, A11y } from 'swiper/modules';
import { register } from 'swiper/element/bundle';
register();

@Component({
  selector: 'app-related-content',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, LucideAngularModule, AnimateOnScroll],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './related-content.html',
  styleUrls: ['./related-content.scss'],
})
export class RelatedContentComponent implements AfterViewChecked {
  @Input() items: (BlogPost | Solution)[] = [];
  @Input() type: 'blog' | 'solution' = 'blog';
  @Input() title = 'RELATED.TITLE';

  public directionService = inject(DirectionService);
  private platformId = inject(PLATFORM_ID);
  private el = inject(ElementRef);
  private swiperReady = false;

  getItemLink(item: any): string[] {
    return this.type === 'blog' ? ['/blog', item.slug] : ['/solutions', item.slug];
  }

  getItemImage(item: any): string {
    return item.heroImage || item.imageUrl || '';
  }

  getTitleKey(item: any): string {
    return this.type === 'blog'
      ? `BLOG.${(item as BlogPost).key}_TITLE`
      : `SOLUTIONS.${(item as Solution).key}_TITLE`;
  }

  getDescKey(item: any): string {
    return this.type === 'blog'
      ? `BLOG.${(item as BlogPost).key}_EXCERPT`
      : `SOLUTIONS.${(item as Solution).key}_DESC`;
  }

  getTechs(item: any): string[] {
    if (this.type === 'solution') {
      return ((item as Solution).technologies || []).slice(0, 4);
    }
    return ((item as BlogPost).tags || []).slice(0, 3);
  }

  getIcon(item: any): string {
    return this.type === 'solution' ? (item as Solution).icon : 'FileText';
  }

  ngAfterViewChecked(): void {
    if (!isPlatformBrowser(this.platformId) || this.swiperReady) return;
    const swiperEl = this.el.nativeElement.querySelector('swiper-container');
    if (!swiperEl) return;
    const slides = swiperEl.querySelectorAll('swiper-slide');
    if (slides.length === 0 || typeof swiperEl.initialize !== 'function') return;

    this.swiperReady = true;

    const prevEl = this.el.nativeElement.querySelector('.rc-nav-prev');
    const nextEl = this.el.nativeElement.querySelector('.rc-nav-next');

    Object.assign(swiperEl, {
      modules: [Pagination, Navigation, A11y],
      grabCursor: true,
      spaceBetween: 24,
      slidesPerView: 1.15,
      pagination: { clickable: true, dynamicBullets: true },
      navigation: prevEl && nextEl ? { prevEl, nextEl } : false,
      allowTouchMove: this.items.length > 1,
      watchOverflow: false,
      breakpoints: {
        600: { slidesPerView: 1.6, spaceBetween: 20 },
        768: { slidesPerView: 2.1, spaceBetween: 24 },
        1024: {
          slidesPerView: Math.min(this.items.length, 4),
          spaceBetween: 28,
          allowTouchMove: this.items.length > 4,
        },
      },
    });

    swiperEl.initialize();
  }
}
