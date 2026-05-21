import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { FeatureFlagService } from './feature-flag.service';
import { FEATURE_FLAGS } from '../constants/tokens';
import { PLATFORM_ID } from '@angular/core';

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        FeatureFlagService,
        { provide: FEATURE_FLAGS, useValue: { test_flag: true } },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(FeatureFlagService);
  });

  it('should assign variants deterministically', () => {
    // @ts-ignore
    service.clientId = 'user_0';
    const v0 = service.getVariant('test_exp');

    // @ts-ignore
    service.clientId = 'user_0';
    const v0_again = service.getVariant('test_exp');

    expect(v0).toBe(v0_again);

    // @ts-ignore
    service.clientId = 'user_1';
    const v1 = service.getVariant('test_exp');

    // One of them should be defined
    expect(v1).toBeDefined();
  });
});
