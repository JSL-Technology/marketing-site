import { Component, Inject, OnInit, OnDestroy, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { AnimateOnScroll } from '@shared/directives/animate-on-scroll';
import { AnalyticsService } from '@core/services/analytics.service';
import { MetaPixelService } from '@core/services/meta-pixel.service';
import { Subscription } from 'rxjs';

interface ServiceConfig {
  caseStudyKey: string;
  caseStudyRoute: string;
  insightKey: string;
}

const SERVICE_CONFIG: Record<string, ServiceConfig> = {
  web_dev:     { caseStudyKey: 'THANK_YOU.CASE_WEB',     caseStudyRoute: 'solutions/web-development',  insightKey: 'THANK_YOU.INSIGHT_WEB'     },
  mobile_dev:  { caseStudyKey: 'THANK_YOU.CASE_MOBILE',  caseStudyRoute: 'solutions/mobile-apps',      insightKey: 'THANK_YOU.INSIGHT_MOBILE'  },
  desktop_dev: { caseStudyKey: 'THANK_YOU.CASE_DESKTOP', caseStudyRoute: 'solutions/desktop-apps',     insightKey: 'THANK_YOU.INSIGHT_DESKTOP' },
  erp:         { caseStudyKey: 'THANK_YOU.CASE_ERP',     caseStudyRoute: 'solutions/erp',              insightKey: 'THANK_YOU.INSIGHT_ERP'     },
  ai_ml:       { caseStudyKey: 'THANK_YOU.CASE_AI',      caseStudyRoute: 'solutions/ai-ml',            insightKey: 'THANK_YOU.INSIGHT_AI'      },
};
const DEFAULT_CONFIG: ServiceConfig = {
  caseStudyKey: 'THANK_YOU.CASE_DEFAULT',
  caseStudyRoute: 'solutions',
  insightKey: 'THANK_YOU.INSIGHT_DEFAULT',
};

@Component({
  selector: 'app-thank-you',
  standalone: true,
  imports: [RouterLink, TranslateModule, LucideAngularModule, AnimateOnScroll],
  templateUrl: './thank-you.html',
  styleUrls: ['./thank-you.scss']
})
export class ThankYou implements OnInit, OnDestroy {
  currentLang: string;
  private langSub: Subscription;

  selectedService = signal<string>('');
  whitepaperDownloaded = signal<boolean>(false);

  serviceConfig = computed<ServiceConfig>(() => {
    return SERVICE_CONFIG[this.selectedService()] ?? DEFAULT_CONFIG;
  });

  nextSteps = [
    { icon: 'Mail',      key: 'CHECK_EMAIL' },
    { icon: 'Calendar',  key: 'SCHEDULE'    },
    { icon: 'BookOpen',  key: 'READ_BLOG'   },
  ];

  socials = [
    { icon: 'Linkedin',  href: 'https://linkedin.com/company/jsl-technology', label: 'LinkedIn' },
    { icon: 'Twitter',   href: 'https://twitter.com/jsltechnology',            label: 'Twitter'  },
    { icon: 'Instagram', href: 'https://instagram.com/jsltechnology',          label: 'Instagram'},
  ];

  constructor(
    @Inject(TranslateService) private translate: TranslateService,
    @Inject(PLATFORM_ID) private platformId: object,
    private analytics: AnalyticsService,
    private metaPixel: MetaPixelService,
  ) {
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || 'es';
    this.langSub = this.translate.onLangChange.subscribe(e => this.currentLang = e.lang);
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const service = sessionStorage.getItem('jsl_last_service') ?? '';
      this.selectedService.set(service);
      const downloaded = sessionStorage.getItem('jsl_whitepaper_downloaded') === 'true'
        || localStorage.getItem('jsl_whitepaper_downloaded') === 'true';
      this.whitepaperDownloaded.set(downloaded);
    }

    this.analytics.trackConversion('contact_form_complete');
    this.analytics.trackEvent('generate_lead', { method: 'contact_form' });
    this.metaPixel.trackCompleteRegistration({ content_name: 'contact_form' });
  }

  ngOnDestroy() { this.langSub?.unsubscribe(); }
}
