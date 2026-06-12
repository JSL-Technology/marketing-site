import { TestBed } from '@angular/core/testing';
import { OnboardingFlowService, OnboardingStep } from './onboarding-flow.service';
import { CookieService } from 'ngx-cookie-service';
import { OverlayManagerService } from './overlay-manager.service';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';

describe('OnboardingFlowService', () => {
  let service: OnboardingFlowService;
  let cookieServiceSpy: jasmine.SpyObj<CookieService>;
  let overlayManagerSpy: jasmine.SpyObj<OverlayManagerService>;

  beforeEach(() => {
    jasmine.clock().install();
    cookieServiceSpy = jasmine.createSpyObj('CookieService', ['check', 'set']);
    overlayManagerSpy = jasmine.createSpyObj('OverlayManagerService', ['getActiveOverlayId']);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        OnboardingFlowService,
        { provide: CookieService, useValue: cookieServiceSpy },
        { provide: OverlayManagerService, useValue: overlayManagerSpy },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should start with IDLE and transition to COOKIES if no consent', () => {
    cookieServiceSpy.check.and.returnValue(false);
    service = TestBed.inject(OnboardingFlowService);

    expect(service.currentStep()).toBe(OnboardingStep.IDLE);

    jasmine.clock().tick(501);
    expect(service.currentStep()).toBe(OnboardingStep.COOKIES);
  });

  it('should transition to LANGUAGE if consent already exists', () => {
    cookieServiceSpy.check.and.returnValue(true);
    service = TestBed.inject(OnboardingFlowService);

    jasmine.clock().tick(501);
    expect(service.currentStep()).toBe(OnboardingStep.LANGUAGE);
  });

  it('should move from COOKIES to LANGUAGE when completeCookies is called', () => {
    cookieServiceSpy.check.and.returnValue(false);
    service = TestBed.inject(OnboardingFlowService);
    jasmine.clock().tick(501);

    service.completeCookies();
    expect(service.currentStep()).toBe(OnboardingStep.LANGUAGE);
  });

  it('should move from LANGUAGE to READY when completeLanguage is called', () => {
    cookieServiceSpy.check.and.returnValue(true);
    service = TestBed.inject(OnboardingFlowService);
    jasmine.clock().tick(501);

    service.completeLanguage();
    expect(service.currentStep()).toBe(OnboardingStep.READY);
  });

  it('canShowSecondaryUI should return true only when READY and no overlays', () => {
    cookieServiceSpy.check.and.returnValue(true);
    service = TestBed.inject(OnboardingFlowService);
    jasmine.clock().tick(501);
    service.completeLanguage();

    overlayManagerSpy.getActiveOverlayId.and.returnValue(null);
    expect(service.canShowSecondaryUI()).toBe(true);

    overlayManagerSpy.getActiveOverlayId.and.returnValue('some-overlay');
    expect(service.canShowSecondaryUI()).toBe(false);
  });
});
