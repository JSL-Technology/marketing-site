import { Component, OnInit, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CookieService } from 'ngx-cookie-service';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { ALL_ICONS } from '@core/constants/icons';
import { OnboardingFlowService } from '@core/services/onboarding-flow.service';

@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [CommonModule, TranslateModule, LucideAngularModule],
  templateUrl: './cookie-banner.html',
  styleUrls: ['./cookie-banner.scss']
})
export class CookieBannerComponent implements OnInit {
  isVisible = signal(false);
  readonly icons = ALL_ICONS;

  private cookieService = inject(CookieService);
  private onboardingFlow = inject(OnboardingFlowService);

  constructor() {
    // Reactive visibility based on onboarding flow
    effect(() => {
      if (this.onboardingFlow.isCookiesStep()) {
        // Slight delay to ensure smooth entry
        setTimeout(() => this.isVisible.set(true), 600);
      } else {
        this.isVisible.set(false);
      }
    });
  }

  ngOnInit(): void {
    // Logic moved to effect/service coordination
  }

  accept(): void {
    this.cookieService.set('cookie-consent', 'true', { expires: 365, path: '/' });
    this.isVisible.set(false);
    this.onboardingFlow.completeCookies();
  }

  decline(): void {
    this.cookieService.set('cookie-consent', 'false', { expires: 365, path: '/' });
    this.isVisible.set(false);
    this.onboardingFlow.completeCookies();
  }
}
