import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { OverlayManagerService } from './overlay-manager.service';
import { CookieService } from 'ngx-cookie-service';

export enum OnboardingStep {
  IDLE = 'IDLE',
  COOKIES = 'COOKIES',
  LANGUAGE = 'LANGUAGE',
  READY = 'READY'
}

@Injectable({
  providedIn: 'root'
})
export class OnboardingFlowService {
  private platformId = inject(PLATFORM_ID);
  private overlayManager = inject(OverlayManagerService);
  private cookieService = inject(CookieService);

  private currentStepSignal = signal<OnboardingStep>(OnboardingStep.IDLE);
  readonly currentStep = this.currentStepSignal.asReadonly();

  readonly isCookiesStep = computed(() => this.currentStep() === OnboardingStep.COOKIES);
  readonly isLanguageStep = computed(() => this.currentStep() === OnboardingStep.LANGUAGE);
  readonly isReady = computed(() => this.currentStep() === OnboardingStep.READY);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Start flow after a small initial delay to allow app stability
      setTimeout(() => this.initFlow(), 500);
    }
  }

  private initFlow() {
    const hasConsent = this.cookieService.check('cookie-consent');
    if (!hasConsent) {
      this.currentStepSignal.set(OnboardingStep.COOKIES);
    } else {
      this.moveToLanguageStep();
    }
  }

  completeCookies() {
    if (this.currentStep() === OnboardingStep.COOKIES) {
      this.moveToLanguageStep();
    }
  }

  private moveToLanguageStep() {
    this.currentStepSignal.set(OnboardingStep.LANGUAGE);
  }

  completeLanguage() {
    if (this.currentStep() === OnboardingStep.LANGUAGE) {
      this.currentStepSignal.set(OnboardingStep.READY);
    }
  }

  /**
   * Home scroll hint or other secondary UI should check this before firing.
   */
  canShowSecondaryUI(): boolean {
    return this.currentStep() === OnboardingStep.READY &&
           this.overlayManager.getActiveOverlayId() === null;
  }
}
