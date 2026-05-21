import { Component, Inject, OnDestroy, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Card } from '@shared/components/card/card';
import { AnimateOnScroll } from '@shared/directives/animate-on-scroll';
import { DataService } from '@core/services/data.service';
import { CtaComponent } from '@shared/components/cta/cta';
import { LucideAngularModule } from 'lucide-angular';
import { toSignal } from '@angular/core/rxjs-interop';
import { ScrollEngineService } from '@core/services/scroll-engine.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'jsl-solutions',
  standalone: true,
  imports: [TranslateModule, LucideAngularModule, Card, AnimateOnScroll, CtaComponent],
  templateUrl: './solutions.html',
  styleUrl: './solutions.scss',
})
export class Solutions implements OnDestroy {
  private dataService = inject(DataService);
  private scrollEngine = inject(ScrollEngineService);
  private langSub: Subscription;

  public currentLang: string;
  public solutions = toSignal(this.dataService.getSolutions(), { initialValue: [] });

  stats = [
    { icon: 'Briefcase', valueKey: 'SOLUTIONS.STAT_PROJECTS_VAL',    labelKey: 'SOLUTIONS.STAT_PROJECTS'    },
    { icon: 'Users',     valueKey: 'SOLUTIONS.STAT_CLIENTS_VAL',     labelKey: 'SOLUTIONS.STAT_CLIENTS'     },
    { icon: 'Globe',     valueKey: 'SOLUTIONS.STAT_COUNTRIES_VAL',   labelKey: 'SOLUTIONS.STAT_COUNTRIES'   },
    { icon: 'Award',     valueKey: 'SOLUTIONS.STAT_SATISFACTION_VAL', labelKey: 'SOLUTIONS.STAT_SATISFACTION' },
  ];

  scrollToGrid() {
    const grid = document.getElementById('solutions-grid');
    if (grid) {
      this.scrollEngine.scrollTo(grid, { immediate: true });
    }
  }

  constructor(@Inject(TranslateService) private translate: TranslateService) {
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || 'es';
    this.langSub = this.translate.onLangChange.subscribe(e => this.currentLang = e.lang);
  }

  ngOnDestroy() { this.langSub?.unsubscribe(); }
}
