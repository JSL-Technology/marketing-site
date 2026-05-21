import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { AnimateOnScroll } from '@shared/directives/animate-on-scroll';
import { CtaComponent } from '@shared/components/cta/cta';
import { DataService, FaqItem } from '@core/services/data.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { Seo } from '@core/services/seo';

@Component({
  selector: 'jsl-faq',
  standalone: true,
  imports: [TranslateModule, LucideAngularModule, AnimateOnScroll, CtaComponent, FormsModule],
  templateUrl: './faq.html',
  styleUrl: './faq.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Faq implements OnInit, OnDestroy {
  private dataService = inject(DataService);
  private translate = inject(TranslateService);
  private seoService = inject(Seo);

  public openQuestionIndex = signal<number | null>(null);
  public activeCategory = signal<string>('all');
  public searchQuery = signal<string>('');
  public currentLang = toSignal(this.translate.onLangChange);

  private langSub: Subscription | undefined;

  allItems = toSignal(this.dataService.getFaqItems(), { initialValue: [] as FaqItem[] });

  categories = [
    { key: 'all',       labelKey: 'FAQ.CAT_ALL',       icon: 'LayoutGrid' },
    { key: 'services',  labelKey: 'FAQ.CAT_SERVICES',  icon: 'Zap'        },
    { key: 'pricing',   labelKey: 'FAQ.CAT_PRICING',   icon: 'DollarSign' },
    { key: 'process',   labelKey: 'FAQ.CAT_PROCESS',   icon: 'Settings'   },
    { key: 'technical', labelKey: 'FAQ.CAT_TECHNICAL', icon: 'Cpu'        },
  ];

  filteredItems = computed(() => {
    const cat = this.activeCategory();
    const query = this.searchQuery().toLowerCase();
    this.currentLang(); // Dependency to re-trigger on language change
    let items = this.allItems();

    if (cat !== 'all') {
      items = items.filter(i => i.category === cat);
    }

    if (query) {
      return items.filter(i => {
        const question = this.translate.instant(i.questionKey).toLowerCase();
        const answer = this.translate.instant(i.answerKey).toLowerCase();
        return question.includes(query) || answer.includes(query);
      });
    }

    return items;
  });

  ngOnInit() {
    this.langSub = this.translate.onLangChange.subscribe(() => this.updateFaqSchema());
    this.updateFaqSchema();
  }

  ngOnDestroy() { this.langSub?.unsubscribe(); }

  setCategory(key: string) {
    this.activeCategory.set(key);
    this.openQuestionIndex.set(null);
  }

  toggleQuestion(index: number) {
    this.openQuestionIndex.set(this.openQuestionIndex() === index ? null : index);
  }

  clearSearch() {
    this.searchQuery.set('');
  }

  private updateFaqSchema() {
    const items = this.allItems();
    if (!items.length) return;
    const keys = [...items.map(i => i.questionKey), ...items.map(i => i.answerKey)];
    this.translate.get(keys).subscribe(t => {
      this.seoService.setJsonLd({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map(item => ({
          '@type': 'Question',
          name: t[item.questionKey],
          acceptedAnswer: { '@type': 'Answer', text: t[item.answerKey] }
        }))
      }, 'faq-schema');
    });
  }
}
