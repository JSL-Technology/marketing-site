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
  selector: 'jsl-about-us',
  standalone: true,
  imports: [TranslateModule, LucideAngularModule, RouterLink, AnimateOnScroll, CtaComponent],
  templateUrl: './about-us.html',
  styleUrl: './about-us.scss'
})
export class AboutUs implements OnDestroy {
  currentLang: string;
  private langSub: Subscription;

  private dataService = inject(DataService);
  public teamMembers = toSignal(this.dataService.getTeamMembers(), { initialValue: [] });

  coreValues = [
    { key: 'MISSION', icon: 'Target' },
    { key: 'VISION',  icon: 'Eye'    },
    { key: 'VALUES',  icon: 'Gem'    },
  ];

  stats = [
    { valueKey: 'ABOUT.STAT_YEARS_VAL',    labelKey: 'ABOUT.STAT_YEARS'    },
    { valueKey: 'ABOUT.STAT_PROJECTS_VAL', labelKey: 'ABOUT.STAT_PROJECTS' },
    { valueKey: 'ABOUT.STAT_COUNTRIES_VAL', labelKey: 'ABOUT.STAT_COUNTRIES' },
    { valueKey: 'ABOUT.STAT_TEAM_VAL',     labelKey: 'ABOUT.STAT_TEAM'     },
  ];

  awards = [
    { icon: 'Award',   key: 'CLUTCH'  },
    { icon: 'Star',    key: 'GOOGLE'  },
    { icon: 'ThumbsUp', key: 'FORBES' },
  ];

  constructor(@Inject(TranslateService) private translate: TranslateService) {
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || 'es';
    this.langSub = this.translate.onLangChange.subscribe(e => this.currentLang = e.lang);
  }

  ngOnDestroy() { this.langSub?.unsubscribe(); }
}
