import { Component, Inject, OnDestroy } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { CtaComponent } from '@shared/components/cta/cta';
import { AnimateOnScroll } from '@shared/directives/animate-on-scroll';
import { Subscription } from 'rxjs';

@Component({
  selector: 'jsl-life-at-jsl',
  standalone: true,
  imports: [TranslateModule, LucideAngularModule, RouterLink, CtaComponent, AnimateOnScroll],
  templateUrl: './life-at-jsl.html',
  styleUrl: './life-at-jsl.scss'
})
export class LifeAtJsl implements OnDestroy {
  currentLang: string;
  private langSub: Subscription;

  moments = [
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&q=80&w=800',
  ];

  benefits = [
    { key: 'REMOTE',    icon: 'Globe'      },
    { key: 'HEALTH',    icon: 'HeartPulse' },
    { key: 'LEARNING',  icon: 'Brain'      },
    { key: 'HARDWARE',  icon: 'Laptop'     },
    { key: 'FLEXIBLE',  icon: 'Clock'      },
    { key: 'TRAVEL',    icon: 'Plane'      },
  ];

  readonly cultureStats = [
    { key: 'TEAM_MEMBERS'  },
    { key: 'NATIONALITIES' },
    { key: 'GLASSDOOR'     },
    { key: 'RETENTION'     },
  ];

  values = [
    { key: 'OWNERSHIP',   icon: 'Target'    },
    { key: 'EXCELLENCE',  icon: 'Star'      },
    { key: 'COMMUNITY',   icon: 'Heart'     },
    { key: 'INNOVATION',  icon: 'Lightbulb' },
  ];

  constructor(@Inject(TranslateService) private translate: TranslateService) {
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || 'es';
    this.langSub = this.translate.onLangChange.subscribe(e => this.currentLang = e.lang);
  }

  ngOnDestroy() { this.langSub?.unsubscribe(); }
}
