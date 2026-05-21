import { Component, Inject, OnDestroy, computed, signal, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Card } from '@shared/components/card/card';
import { AnimateOnScroll } from '@shared/directives/animate-on-scroll';
import { DataService } from '@core/services/data.service';
import { CtaComponent } from '@shared/components/cta/cta';
import { toSignal } from '@angular/core/rxjs-interop';
import { PaginationComponent } from '@shared/components/pagination/pagination';
import { ScrollEngineService } from '@core/services/scroll-engine.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'jsl-projects',
  standalone: true,
  imports: [TranslateModule, LucideAngularModule, RouterLink, Card, AnimateOnScroll, CtaComponent, PaginationComponent],
  templateUrl: './projects.html',
  styleUrl: './projects.scss'
})
export class Projects implements OnDestroy {
  private dataService = inject(DataService);
  private scrollEngine = inject(ScrollEngineService);
  private langSub: Subscription;

  public currentLang: string;
  public projects = toSignal(this.dataService.getProjects(), { initialValue: [] });

  public activeCategory = signal<string>('all');
  public categories = [
    { key: 'all',        labelKey: 'PROJECTS.FILTER_ALL'        },
    { key: 'Enterprise', labelKey: 'PROJECTS.FILTER_ENTERPRISE' },
    { key: 'Commerce',   labelKey: 'PROJECTS.FILTER_COMMERCE'   },
    { key: 'Mobile',     labelKey: 'PROJECTS.FILTER_MOBILE'     },
  ];

  public filteredProjects = computed(() => {
    const cat = this.activeCategory();
    return cat === 'all' ? this.projects() : this.projects().filter(p => p.category === cat);
  });

  public featuredProject = computed(() => this.projects()[0]);

  public currentPage = signal(1);
  public itemsPerPage = 6;

  public paginatedProjects = computed(() => {
    const all = this.filteredProjects();
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return all.slice(start, start + this.itemsPerPage);
  });

  constructor(@Inject(TranslateService) private translate: TranslateService) {
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || 'es';
    this.langSub = this.translate.onLangChange.subscribe(e => this.currentLang = e.lang);
  }

  setCategory(key: string) {
    this.activeCategory.set(key);
    this.currentPage.set(1);
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.scrollEngine.scrollTo(0, { immediate: true });
  }

  ngOnDestroy() { this.langSub?.unsubscribe(); }
}
