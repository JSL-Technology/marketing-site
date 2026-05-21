import { Component, Inject, OnDestroy, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { AnimateOnScroll } from '@shared/directives/animate-on-scroll';
import { DataService } from '@core/services/data.service';
import { CtaComponent } from '@shared/components/cta/cta';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';

@Component({
  selector: 'jsl-products',
  standalone: true,
  imports: [TranslateModule, LucideAngularModule, RouterLink, AnimateOnScroll, CtaComponent],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class Products implements OnDestroy {
  private dataService = inject(DataService);
  private langSub: Subscription;

  public currentLang: string;
  public products = toSignal(this.dataService.getProducts(), { initialValue: [] });

  stats = [
    { icon: 'Zap',       valueKey: 'PRODUCTS.STAT_UPTIME_VAL',    labelKey: 'PRODUCTS.STAT_UPTIME'    },
    { icon: 'Globe',     valueKey: 'PRODUCTS.STAT_COUNTRIES_VAL', labelKey: 'PRODUCTS.STAT_COUNTRIES' },
    { icon: 'Users',     valueKey: 'PRODUCTS.STAT_USERS_VAL',     labelKey: 'PRODUCTS.STAT_USERS'     },
    { icon: 'BarChart3', valueKey: 'PRODUCTS.STAT_GROWTH_VAL',    labelKey: 'PRODUCTS.STAT_GROWTH'    },
  ];

  whyItems = [
    { icon: 'Layers',     titleKey: 'PRODUCTS.WHY_MODULAR_TITLE', descKey: 'PRODUCTS.WHY_MODULAR_DESC' },
    { icon: 'Globe',      titleKey: 'PRODUCTS.WHY_GLOBAL_TITLE',  descKey: 'PRODUCTS.WHY_GLOBAL_DESC'  },
    { icon: 'ShieldCheck', titleKey: 'PRODUCTS.WHY_SECURE_TITLE', descKey: 'PRODUCTS.WHY_SECURE_DESC'  },
    { icon: 'Zap',        titleKey: 'PRODUCTS.WHY_FAST_TITLE',   descKey: 'PRODUCTS.WHY_FAST_DESC'    },
  ];

  constructor(@Inject(TranslateService) private translate: TranslateService) {
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || 'es';
    this.langSub = this.translate.onLangChange.subscribe(e => this.currentLang = e.lang);
  }

  ngOnDestroy() { this.langSub?.unsubscribe(); }
}
