import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { LanguageSuggestionService } from './language-suggestion.service';
import { CookieService } from 'ngx-cookie-service';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { OnboardingFlowService } from './onboarding-flow.service';
import { PLATFORM_ID, signal, provideZonelessChangeDetection } from '@angular/core';

describe('LanguageSuggestionService', () => {
  let service: LanguageSuggestionService;
  let cookieServiceSpy: jasmine.SpyObj<CookieService>;
  let translateServiceSpy: jasmine.SpyObj<TranslateService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let onboardingFlowSpy: any;

  beforeEach(() => {
    cookieServiceSpy = jasmine.createSpyObj('CookieService', ['get', 'set', 'check']);
    translateServiceSpy = jasmine.createSpyObj('TranslateService', ['getLangs', 'use']);
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
    (routerSpy as any).url = '/es/home';

    onboardingFlowSpy = {
      isLanguageStep: signal(false),
      completeLanguage: jasmine.createSpy('completeLanguage')
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideZonelessChangeDetection(),
        LanguageSuggestionService,
        { provide: CookieService, useValue: cookieServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: OnboardingFlowService, useValue: onboardingFlowSpy },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    translateServiceSpy.getLangs.and.returnValue(['en', 'es']);
  });

  it('should complete language step if no suggestion is needed', () => {
    service = TestBed.inject(LanguageSuggestionService);

    // Mock navigator.languages to ensure no suggestion is triggered
    Object.defineProperty(navigator, 'languages', {
        get: () => ['es'],
        configurable: true
    });
    cookieServiceSpy.get.and.returnValue('es');

    (service as any).checkSuggestion();
    expect(onboardingFlowSpy.completeLanguage).toHaveBeenCalled();
  });
});
