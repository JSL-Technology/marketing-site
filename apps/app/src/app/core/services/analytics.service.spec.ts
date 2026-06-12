import { provideRouter } from '@angular/router';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AnalyticsService } from './analytics.service';
import { Router } from '@angular/router';

import { DOCUMENT } from '@angular/common';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let routerSpy: any;

  beforeEach(() => {
    routerSpy = { url: '/en/home', events: { pipe: () => ({ subscribe: () => {} }) } };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideZonelessChangeDetection(),
        AnalyticsService,
        { provide: Router, useValue: routerSpy },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DOCUMENT, useValue: document }
      ]
    });
    service = TestBed.inject(AnalyticsService);

    // Mock gtag
    (window as any).gtag = jasmine.createSpy('gtag');
    // @ts-ignore
    service.initialized = true;
  });

  it('should include lead_id in enriched events when set', () => {
    service.setLeadId('test-lead-123');
    service.trackEvent('test_event');

    expect((window as any).gtag).toHaveBeenCalledWith('event', 'test_event', jasmine.objectContaining({
      lead_id: 'test-lead-123'
    }));
  });

  it('should calculate elapsed time for forms correctly', (done) => {
    service.startFormTimer('test_form');
    setTimeout(() => {
      const elapsed = service.getFormElapsedTime('test_form');
      expect(elapsed).toBeGreaterThanOrEqual(1);
      done();
    }, 1100);
  });
});