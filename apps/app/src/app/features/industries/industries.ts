import { Component, Inject, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { AnimateOnScroll } from '@shared/directives/animate-on-scroll';
import { CtaComponent } from '@shared/components/cta/cta';
import { Subscription } from 'rxjs';

interface IndustryLink {
  routeParts: string[];
  labelKey: string;
}

interface Industry {
  key: string;
  icon: string;
  image: string;
  relatedLinks: IndustryLink[];
}

@Component({
  selector: 'jsl-industries',
  standalone: true,
  imports: [RouterLink, TranslateModule, LucideAngularModule, AnimateOnScroll, CtaComponent],
  templateUrl: './industries.html',
  styleUrl: './industries.scss'
})
export class Industries implements OnDestroy {
  public currentLang: string;
  private langSub: Subscription;

  industries: Industry[] = [
    {
      key: 'RETAIL',
      icon: 'ShoppingCart',
      image: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?fit=crop&w=600&q=80',
      relatedLinks: [
        { routeParts: ['products', 'jsl-pos'],        labelKey: 'PRODUCTS.POS_TITLE'     },
        { routeParts: ['solutions', 'web-development'], labelKey: 'SOLUTIONS.WEB_TITLE'   },
      ]
    },
    {
      key: 'LOGISTICS',
      icon: 'Truck',
      image: 'https://images.unsplash.com/photo-1577412637208-51bbf66c2d42?fit=crop&w=600&q=80',
      relatedLinks: [
        { routeParts: ['products', 'virtex'],                      labelKey: 'PRODUCTS.ERP_TITLE'    },
        { routeParts: ['projects', 'erp-logistics-optimization'],  labelKey: 'PROJECTS.CASE_ERP_TITLE' },
      ]
    },
    {
      key: 'FINTECH',
      icon: 'Landmark',
      image: 'https://images.unsplash.com/photo-1560520031-3a4dc4e0a9C6?fit=crop&w=600&q=80',
      relatedLinks: [
        { routeParts: ['solutions', 'web-development'], labelKey: 'SOLUTIONS.WEB_TITLE'    },
        { routeParts: ['solutions', 'cloud-architecture'], labelKey: 'SOLUTIONS.CLOUD_TITLE' },
      ]
    },
    {
      key: 'HEALTH',
      icon: 'HeartPulse',
      image: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?fit=crop&w=600&q=80',
      relatedLinks: [
        { routeParts: ['solutions', 'mobile-apps'],   labelKey: 'SOLUTIONS.MOBILE_TITLE'   },
        { routeParts: ['security'],                   labelKey: 'HEADER.SECURITY'           },
      ]
    }
  ];

  constructor(@Inject(TranslateService) private translate: TranslateService) {
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || 'es';
    this.langSub = this.translate.onLangChange.subscribe(e => this.currentLang = e.lang);
  }

  buildRoute(routeParts: string[]): string[] {
    return ['/', this.currentLang, ...routeParts];
  }

  ngOnDestroy() { this.langSub?.unsubscribe(); }
}
