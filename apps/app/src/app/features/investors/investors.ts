import { Component, Inject, OnDestroy } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { AnimateOnScroll } from '@shared/directives/animate-on-scroll';
import { CtaComponent } from '@shared/components/cta/cta';
import { Subscription } from 'rxjs';

@Component({
  selector: 'jsl-investors',
  standalone: true,
  imports: [TranslateModule, LucideAngularModule, AnimateOnScroll, CtaComponent],
  templateUrl: './investors.html',
  styleUrl: './investors.scss'
})
export class Investors implements OnDestroy {
  currentLang: string;
  private langSub: Subscription;

  highlights = [
    { icon: 'TrendingUp', key: 'GROWTH'     },
    { icon: 'Globe',      key: 'GLOBAL'     },
    { icon: 'Layers',     key: 'PORTFOLIO'  },
    { icon: 'ShieldCheck', key: 'GOVERNANCE' },
  ];

  stats = [
    { valueKey: 'INVESTORS.STAT_YEARS_VAL',   labelKey: 'INVESTORS.STAT_YEARS'   },
    { valueKey: 'INVESTORS.STAT_GROWTH_VAL',  labelKey: 'INVESTORS.STAT_GROWTH'  },
    { valueKey: 'INVESTORS.STAT_CLIENTS_VAL', labelKey: 'INVESTORS.STAT_CLIENTS' },
    { valueKey: 'INVESTORS.STAT_REVENUE_VAL', labelKey: 'INVESTORS.STAT_REVENUE' },
  ];

  constructor(@Inject(TranslateService) private translate: TranslateService) {
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || 'es';
    this.langSub = this.translate.onLangChange.subscribe(e => this.currentLang = e.lang);
  }

  ngOnDestroy() { this.langSub?.unsubscribe(); }
}
