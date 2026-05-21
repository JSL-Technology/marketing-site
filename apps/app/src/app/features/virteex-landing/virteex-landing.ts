import { Component, Inject, OnDestroy } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { AnimateOnScroll } from '@shared/directives/animate-on-scroll';
import { CtaComponent } from '@shared/components/cta/cta';
import { Subscription } from 'rxjs';

@Component({
  selector: 'jsl-virteex-landing',
  standalone: true,
  imports: [TranslateModule, LucideAngularModule, RouterLink, AnimateOnScroll, CtaComponent],
  templateUrl: './virteex-landing.html',
  styleUrl: './virteex-landing.scss'
})
export class VirteexLanding implements OnDestroy {
  private langSub: Subscription;
  public currentLang: string;

  stats = [
    { valueKey: 'VIRTEEX.STAT_USERS_VAL',    labelKey: 'VIRTEEX.STAT_USERS'    },
    { valueKey: 'VIRTEEX.STAT_COUNTRIES_VAL', labelKey: 'VIRTEEX.STAT_COUNTRIES' },
    { valueKey: 'VIRTEEX.STAT_MODULES_VAL',   labelKey: 'VIRTEEX.STAT_MODULES'  },
    { valueKey: 'VIRTEEX.STAT_UPTIME_VAL',    labelKey: 'VIRTEEX.STAT_UPTIME'   },
  ];

  features = [
    { icon: 'Database',    key: 'ERP'        },
    { icon: 'ShoppingCart', key: 'POS'       },
    { icon: 'Smartphone',  key: 'MOBILE'     },
    { icon: 'Globe',       key: 'ECOMMERCE'  },
    { icon: 'BarChart3',   key: 'ANALYTICS'  },
    { icon: 'ShieldCheck', key: 'SECURITY'   },
  ];

  modules = [
    { icon: 'CircleDollarSign', key: 'FINANCE'  },
    { icon: 'Truck',            key: 'SCM'       },
    { icon: 'Users',            key: 'HRMS'      },
    { icon: 'Target',           key: 'CRM'       },
    { icon: 'Receipt',          key: 'BILLING'   },
  ];

  constructor(@Inject(TranslateService) private translate: TranslateService) {
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || 'es';
    this.langSub = this.translate.onLangChange.subscribe(e => this.currentLang = e.lang);
  }

  ngOnDestroy() { this.langSub?.unsubscribe(); }
}
