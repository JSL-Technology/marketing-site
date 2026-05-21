import { Component, Inject, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { AnimateOnScroll } from '@shared/directives/animate-on-scroll';
import { Subscription } from 'rxjs';

@Component({
  selector: 'jsl-not-found',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslateModule, LucideAngularModule, AnimateOnScroll],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss'
})
export class NotFound implements OnDestroy {
  public currentLang: string;
  public searchQuery = '';
  private langSub: Subscription;

  public illustrationUrl = 'assets/imgs/illustrations/404.svg';

  suggestedPages = [
    { route: 'solutions',  icon: 'Layers',    labelKey: 'HEADER.SERVICES'   },
    { route: 'products',   icon: 'Package',   labelKey: 'HEADER.PRODUCTS'   },
    { route: 'projects',   icon: 'Briefcase', labelKey: 'HEADER.PROJECTS'   },
    { route: 'blog',       icon: 'BookOpen',  labelKey: 'HEADER.BLOG'       },
    { route: 'about-us',   icon: 'Users',     labelKey: 'HEADER.ABOUT'      },
    { route: 'contact',    icon: 'Mail',      labelKey: 'HEADER.CONTACT'    },
  ];

  constructor(
    @Inject(TranslateService) private translate: TranslateService,
    private router: Router,
  ) {
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || 'es';
    this.langSub = this.translate.onLangChange.subscribe(e => this.currentLang = e.lang);
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/', this.currentLang, 'blog'], {
        queryParams: { q: this.searchQuery.trim() }
      });
    }
  }

  ngOnDestroy() { this.langSub?.unsubscribe(); }
}
