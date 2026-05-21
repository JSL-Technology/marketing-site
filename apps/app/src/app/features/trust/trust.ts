import { Component, Inject, OnDestroy } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { AnimateOnScroll } from '@shared/directives/animate-on-scroll';
import { CtaComponent } from '@shared/components/cta/cta';
import { Subscription } from 'rxjs';

@Component({
  selector: 'jsl-trust',
  standalone: true,
  imports: [TranslateModule, LucideAngularModule, RouterLink, AnimateOnScroll, CtaComponent],
  templateUrl: './trust.html',
  styleUrls: ['./trust.scss']
})
export class Trust implements OnDestroy {
  currentLang: string;
  private langSub: Subscription;

  securityPillars = [
    { icon: 'Lock',       key: 'ENCRYPTION'  },
    { icon: 'HardDrive',  key: 'BACKUPS'     },
    { icon: 'Server',     key: 'DRP'         },
    { icon: 'ShieldCheck', key: 'COMPLIANCE' },
    { icon: 'Eye',        key: 'MONITORING'  },
    { icon: 'Users',      key: 'ACCESS'      },
  ];

  certifications = [
    { key: 'SOC2',  icon: 'ShieldCheck', desc: 'SECURITY_CENTER.CERT_SOC2_DESC'  },
    { key: 'ISO',   icon: 'Award',       desc: 'SECURITY_CENTER.CERT_ISO_DESC'   },
    { key: 'GDPR',  icon: 'Scale',       desc: 'SECURITY_CENTER.CERT_GDPR_DESC'  },
    { key: 'HIPAA', icon: 'HeartPulse',  desc: 'SECURITY_CENTER.CERT_HIPAA_DESC' },
  ];

  constructor(@Inject(TranslateService) private translate: TranslateService) {
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || 'es';
    this.langSub = this.translate.onLangChange.subscribe(e => this.currentLang = e.lang);
  }

  ngOnDestroy() { this.langSub?.unsubscribe(); }
}
