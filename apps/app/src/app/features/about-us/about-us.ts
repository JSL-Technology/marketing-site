import { Component, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { AnimateOnScroll } from '@shared/directives/animate-on-scroll';
import { DataService } from '@core/services/data.service';
import { CtaComponent } from '@shared/components/cta/cta';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'jsl-about-us',
  standalone: true,
  imports: [TranslateModule, LucideAngularModule, RouterLink, AnimateOnScroll, CtaComponent],
  templateUrl: './about-us.html',
  styleUrl: './about-us.scss'
})
export class AboutUs {
  private readonly translate = inject(TranslateService);
  private readonly dataService = inject(DataService);

  public currentLang = signal<string>(
    this.translate.currentLang || this.translate.defaultLang || 'es'
  );
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

  constructor() {
    this.translate.onLangChange
      .pipe(takeUntilDestroyed())
      .subscribe(e => this.currentLang.set(e.lang));
  }
}
