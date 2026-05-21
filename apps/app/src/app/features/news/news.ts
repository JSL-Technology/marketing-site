import { Component, Inject, OnDestroy, computed, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { CtaComponent } from '@shared/components/cta/cta';
import { AnimateOnScroll } from '@shared/directives/animate-on-scroll';
import { DataService, BlogPost } from '@core/services/data.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';

@Component({
  selector: 'jsl-news',
  standalone: true,
  imports: [TranslateModule, LucideAngularModule, RouterLink, DatePipe, TitleCasePipe, CtaComponent, AnimateOnScroll],
  templateUrl: './news.html',
  styleUrl: './news.scss'
})
export class News implements OnDestroy {
  private data = inject(DataService);
  currentLang: string;
  private langSub: Subscription;

  allPosts = toSignal(this.data.getBlogPosts(), { initialValue: [] as BlogPost[] });

  featuredPost = computed(() => this.allPosts().find(p => p.featured) ?? this.allPosts()[0]);
  recentPosts  = computed(() => this.allPosts().filter(p => !p.featured).slice(0, 6));

  pressHighlights = [
    { outlet: 'Forbes',           date: 'Feb 2025', titleKey: 'NEWS_PAGE.PRESS_ITEM_1' },
    { outlet: 'TechCrunch',       date: 'Jan 2025', titleKey: 'NEWS_PAGE.PRESS_ITEM_2' },
    { outlet: 'Business Insider', date: 'Nov 2024', titleKey: 'NEWS_PAGE.PRESS_ITEM_3' },
  ];

  constructor(@Inject(TranslateService) private translate: TranslateService) {
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || 'es';
    this.langSub = this.translate.onLangChange.subscribe(e => this.currentLang = e.lang);
  }

  ngOnDestroy() { this.langSub?.unsubscribe(); }
}
