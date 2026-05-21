import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { Seo } from './core/services/seo';
import { provideTranslateService } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

// Mock del SeoService
const mockSeoService = {
  init: jasmine.createSpy('init'),
};

describe('App', () => {
  beforeEach(async () => {
    mockSeoService.init.calls.reset();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslateService(),
        { provide: Seo, useValue: mockSeoService }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should initialize SeoService on creation', () => {
    TestBed.createComponent(App);
    expect(mockSeoService.init).toHaveBeenCalled();
  });
});

// ─── Swipe Blocker: direction-aware edge detection ────────────────────────────

describe('App.detectEdge', () => {
  const THRESHOLD = 24;
  const SCREEN = 375;

  describe('LTR mode', () => {
    it('detects left edge when clientX is within threshold', () => {
      expect(App.detectEdge(0, SCREEN, THRESHOLD, false)).toBeTrue();
      expect(App.detectEdge(24, SCREEN, THRESHOLD, false)).toBeTrue();
    });

    it('does NOT detect edge when clientX exceeds threshold', () => {
      expect(App.detectEdge(25, SCREEN, THRESHOLD, false)).toBeFalse();
      expect(App.detectEdge(100, SCREEN, THRESHOLD, false)).toBeFalse();
    });

    it('does NOT detect right edge in LTR', () => {
      expect(App.detectEdge(SCREEN - 5, SCREEN, THRESHOLD, false)).toBeFalse();
    });
  });

  describe('RTL mode', () => {
    it('detects right edge when clientX is within threshold from right', () => {
      expect(App.detectEdge(SCREEN, SCREEN, THRESHOLD, true)).toBeTrue();       // 375 >= 375-24=351
      expect(App.detectEdge(SCREEN - THRESHOLD, SCREEN, THRESHOLD, true)).toBeTrue(); // 351 >= 351
    });

    it('does NOT detect edge when clientX is left of the RTL threshold', () => {
      expect(App.detectEdge(SCREEN - THRESHOLD - 1, SCREEN, THRESHOLD, true)).toBeFalse(); // 350 < 351
      expect(App.detectEdge(0, SCREEN, THRESHOLD, true)).toBeFalse();
    });

    it('does NOT detect left edge in RTL', () => {
      expect(App.detectEdge(10, SCREEN, THRESHOLD, true)).toBeFalse();
    });
  });
});

// ─── Swipe Blocker: direction-aware gesture blocking ─────────────────────────

describe('App.shouldBlockGesture', () => {
  const MIN_MOVE = 20;

  describe('LTR mode — blocks rightward swipe', () => {
    it('blocks when rightward dx exceeds minHorizontalMove and horizontal dominates significantly', () => {
      expect(App.shouldBlockGesture(50, 5, MIN_MOVE, false)).toBeTrue();
      expect(App.shouldBlockGesture(21, 5, MIN_MOVE, false)).toBeTrue();
    });

    it('does NOT block when rightward dx equals or is below threshold', () => {
      expect(App.shouldBlockGesture(20, 5, MIN_MOVE, false)).toBeFalse();
      expect(App.shouldBlockGesture(15, 2, MIN_MOVE, false)).toBeFalse();
    });

    it('does NOT block leftward swipe in LTR', () => {
      expect(App.shouldBlockGesture(-50, 5, MIN_MOVE, false)).toBeFalse();
    });

    it('does NOT block when vertical movement dominates or is close', () => {
      // |dx| > |dy| * 1.5. If dx=50, dy=40 -> 50 > 60 is false.
      expect(App.shouldBlockGesture(50, 40, MIN_MOVE, false)).toBeFalse();
      expect(App.shouldBlockGesture(50, 100, MIN_MOVE, false)).toBeFalse();
    });

    it('blocks when horizontal ratio is exactly above 1.5', () => {
      expect(App.shouldBlockGesture(31, 20, MIN_MOVE, false)).toBeTrue(); // 31 > 30
      expect(App.shouldBlockGesture(30, 20, MIN_MOVE, false)).toBeFalse(); // 30 > 30 is false
    });
  });

  describe('RTL mode — blocks leftward swipe', () => {
    it('blocks when leftward dx exceeds minHorizontalMove and horizontal dominates significantly', () => {
      expect(App.shouldBlockGesture(-50, 5, MIN_MOVE, true)).toBeTrue();
      expect(App.shouldBlockGesture(-21, 5, MIN_MOVE, true)).toBeTrue();
    });

    it('does NOT block when leftward dx equals or is below threshold', () => {
      expect(App.shouldBlockGesture(-20, 5, MIN_MOVE, true)).toBeFalse();
      expect(App.shouldBlockGesture(-15, 2, MIN_MOVE, true)).toBeFalse();
    });

    it('does NOT block rightward swipe in RTL', () => {
      expect(App.shouldBlockGesture(50, 5, MIN_MOVE, true)).toBeFalse();
    });
  });
});