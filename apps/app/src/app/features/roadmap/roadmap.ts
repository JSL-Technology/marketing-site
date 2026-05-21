import { Component, Inject, OnDestroy, signal, computed } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { AnimateOnScroll } from '@shared/directives/animate-on-scroll';
import { TimelineComponent, TimelineItem } from '@shared/components/timeline/timeline';
import { CtaComponent } from '@shared/components/cta/cta';
import { Subscription } from 'rxjs';

@Component({
  selector: 'jsl-roadmap',
  standalone: true,
  imports: [TranslateModule, LucideAngularModule, RouterLink, AnimateOnScroll, TimelineComponent, CtaComponent],
  templateUrl: './roadmap.html',
  styleUrl: './roadmap.scss'
})
export class Roadmap implements OnDestroy {
  currentLang: string;
  private langSub: Subscription;

  activeFilter = signal<string>('all');

  filters = [
    { key: 'all',        labelKey: 'ROADMAP.FILTER_ALL'       },
    { key: 'completed',  labelKey: 'ROADMAP.FILTER_COMPLETED'  },
    { key: 'current',    labelKey: 'ROADMAP.FILTER_CURRENT'    },
    { key: 'planned',    labelKey: 'ROADMAP.FILTER_PLANNED'    },
  ];

  allItems: TimelineItem[] = [
    { date: 'Q4 2024', titleKey: 'ROADMAP.ITEM_AI_TITLE',      descKey: 'ROADMAP.ITEM_AI_DESC',      status: 'planned'   },
    { date: 'Q3 2024', titleKey: 'ROADMAP.ITEM_POS_TITLE',     descKey: 'ROADMAP.ITEM_POS_DESC',     status: 'current'   },
    { date: 'Q2 2024', titleKey: 'ROADMAP.ITEM_PAY_TITLE',     descKey: 'ROADMAP.ITEM_PAY_DESC',     status: 'completed' },
    { date: 'Q1 2024', titleKey: 'ROADMAP.ITEM_CLOUD_TITLE',   descKey: 'ROADMAP.ITEM_CLOUD_DESC',   status: 'completed' },
    { date: 'Q4 2023', titleKey: 'ROADMAP.ITEM_ERP_TITLE',     descKey: 'ROADMAP.ITEM_ERP_DESC',     status: 'completed' },
  ];

  filteredItems = computed(() => {
    const filter = this.activeFilter();
    return filter === 'all' ? this.allItems : this.allItems.filter(i => i.status === filter);
  });

  setFilter(key: string) { this.activeFilter.set(key); }

  constructor(@Inject(TranslateService) private translate: TranslateService) {
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || 'es';
    this.langSub = this.translate.onLangChange.subscribe(e => this.currentLang = e.lang);
  }

  ngOnDestroy() { this.langSub?.unsubscribe(); }
}
