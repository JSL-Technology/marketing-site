import { Component, Inject, OnDestroy, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { TitleCasePipe } from '@angular/common';
import { CtaComponent } from '@shared/components/cta/cta';
import { AnimateOnScroll } from '@shared/directives/animate-on-scroll';
import { RouterLink } from '@angular/router';
import { DataService, Partner } from '@core/services/data.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';

@Component({
  selector: 'jsl-partners',
  standalone: true,
  imports: [TranslateModule, LucideAngularModule, TitleCasePipe, CtaComponent, AnimateOnScroll, RouterLink],
  templateUrl: './partners.html',
  styleUrl: './partners.scss'
})
export class Partners implements OnDestroy {
  private data = inject(DataService);
  currentLang: string;
  private langSub: Subscription;

  allPartners = toSignal(this.data.getPartners(), { initialValue: [] as Partner[] });

  technologyPartners = [
    { name: 'AWS',       logo: 'assets/imgs/logos/aws.svg',          tier: 'advanced', desc: 'PARTNERS_PAGE.AWS_DESC'    },
    { name: 'Microsoft', logo: 'assets/imgs/logos/microsoft.svg',    tier: 'gold',     desc: 'PARTNERS_PAGE.MSFT_DESC'   },
    { name: 'Google',    logo: 'assets/imgs/logos/google-cloud.svg', tier: 'member',   desc: 'PARTNERS_PAGE.GCP_DESC'    },
    { name: 'Docker',    logo: 'assets/imgs/logos/docker.svg',       tier: 'member',   desc: 'PARTNERS_PAGE.DOCKER_DESC' },
  ];

  benefits = [
    { icon: 'TrendingUp', key: 'REVENUE'   },
    { icon: 'Users',      key: 'SUPPORT'   },
    { icon: 'Award',      key: 'TRAINING'  },
    { icon: 'Globe',      key: 'MARKETING' },
    { icon: 'Code',       key: 'API'       },
    { icon: 'Handshake',  key: 'DEDICATED' },
  ];

  constructor(@Inject(TranslateService) private translate: TranslateService) {
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || 'es';
    this.langSub = this.translate.onLangChange.subscribe(e => this.currentLang = e.lang);
  }

  ngOnDestroy() { this.langSub?.unsubscribe(); }
}
