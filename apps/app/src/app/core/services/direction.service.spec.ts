import { TestBed } from '@angular/core/testing';
import { DirectionService } from './direction.service';
import { TranslateService } from '@ngx-translate/core';
import { EventEmitter, provideZonelessChangeDetection, PLATFORM_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildMocks() {
  const onLangChangeEmitter = new EventEmitter<any>();
  const translateServiceMock = {
    currentLang: 'en',
    getDefaultLang: () => 'en',
    onLangChange: onLangChangeEmitter,
  };
  const documentMock = {
    documentElement: { setAttribute: jasmine.createSpy('setAttribute') },
    body: {
      setAttribute: jasmine.createSpy('setAttribute'),
      style: { setProperty: jasmine.createSpy('setProperty') },
    },
  };
  return { onLangChangeEmitter, translateServiceMock, documentMock };
}

function emitLang(emitter: EventEmitter<any>, lang: string) {
  emitter.emit({ lang, translations: {} });
}

function lastCallFor(spy: jasmine.Spy, attr: string): string | null {
  const calls = spy.calls.all().filter((c: any) => c.args[0] === attr);
  return calls.length ? calls[calls.length - 1].args[1] : null;
}

// ─── Suite ──────────────────────────────────────────────────────────────────

describe('DirectionService', () => {
  let service: DirectionService;
  let translateServiceMock: ReturnType<typeof buildMocks>['translateServiceMock'];
  let documentMock: ReturnType<typeof buildMocks>['documentMock'];
  let onLangChangeEmitter: EventEmitter<any>;

  beforeEach(() => {
    const mocks = buildMocks();
    onLangChangeEmitter = mocks.onLangChangeEmitter;
    translateServiceMock = mocks.translateServiceMock;
    documentMock = mocks.documentMock;

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        DirectionService,
        { provide: TranslateService, useValue: translateServiceMock },
        { provide: DOCUMENT, useValue: documentMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    service = TestBed.inject(DirectionService);
  });

  // ── Creation ───────────────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── Initial state (English default) ───────────────────────────────────────

  it('initialises isRtl signal to false for English default lang', () => {
    expect(service.isRtl()).toBeFalse();
  });

  it('sets dir="ltr" on documentElement for English default lang', () => {
    expect(documentMock.documentElement.setAttribute)
      .toHaveBeenCalledWith('dir', 'ltr');
  });

  it('sets lang="en" on documentElement for English default lang', () => {
    expect(documentMock.documentElement.setAttribute)
      .toHaveBeenCalledWith('lang', 'en');
  });

  // ── Switching to each supported RTL language ───────────────────────────────

  const RTL_LANGS = [
    { code: 'ar', name: 'Arabic'  },
    { code: 'he', name: 'Hebrew'  },
    { code: 'fa', name: 'Persian' },
    { code: 'ur', name: 'Urdu'    },
  ];

  RTL_LANGS.forEach(({ code, name }) => {
    describe(`when language changes to ${name} (${code})`, () => {
      beforeEach(() => emitLang(onLangChangeEmitter, code));

      it(`sets isRtl signal to true`, () => {
        expect(service.isRtl()).toBeTrue();
      });

      it(`sets dir="rtl" on documentElement`, () => {
        expect(lastCallFor(documentMock.documentElement.setAttribute, 'dir'))
          .toBe('rtl');
      });

      it(`sets lang="${code}" on documentElement`, () => {
        expect(lastCallFor(documentMock.documentElement.setAttribute, 'lang'))
          .toBe(code);
      });
    });
  });

  // ── Switching to LTR languages ─────────────────────────────────────────────

  const LTR_LANGS = ['en', 'es', 'pt', 'fr', 'de', 'it', 'ja', 'ko', 'zh', 'ht'];

  LTR_LANGS.forEach((code) => {
    it(`keeps isRtl false when language is ${code}`, () => {
      emitLang(onLangChangeEmitter, code);
      expect(service.isRtl()).toBeFalse();
    });
  });

  // ── RTL → LTR round-trip ──────────────────────────────────────────────────

  it('flips back to ltr after switching RTL → LTR', () => {
    emitLang(onLangChangeEmitter, 'ar');
    expect(service.isRtl()).toBeTrue();

    emitLang(onLangChangeEmitter, 'en');
    expect(service.isRtl()).toBeFalse();
    expect(lastCallFor(documentMock.documentElement.setAttribute, 'dir'))
      .toBe('ltr');
  });

  it('handles multiple consecutive RTL language switches correctly', () => {
    emitLang(onLangChangeEmitter, 'ar');
    emitLang(onLangChangeEmitter, 'he');
    emitLang(onLangChangeEmitter, 'fa');

    expect(service.isRtl()).toBeTrue();
    expect(lastCallFor(documentMock.documentElement.setAttribute, 'lang'))
      .toBe('fa');
  });

  it('handles multiple consecutive LTR language switches correctly', () => {
    emitLang(onLangChangeEmitter, 'ar'); // go RTL first
    emitLang(onLangChangeEmitter, 'es');
    emitLang(onLangChangeEmitter, 'fr');

    expect(service.isRtl()).toBeFalse();
    expect(lastCallFor(documentMock.documentElement.setAttribute, 'lang'))
      .toBe('fr');
  });

  // ── syncDirection called directly ──────────────────────────────────────────

  it('syncDirection() works correctly when called directly with an RTL lang', () => {
    service.syncDirection('ar');
    expect(service.isRtl()).toBeTrue();
    expect(lastCallFor(documentMock.documentElement.setAttribute, 'dir'))
      .toBe('rtl');
  });

  it('syncDirection() works correctly when called directly with a LTR lang', () => {
    service.syncDirection('ar'); // force RTL first
    service.syncDirection('de');
    expect(service.isRtl()).toBeFalse();
    expect(lastCallFor(documentMock.documentElement.setAttribute, 'dir'))
      .toBe('ltr');
  });

  // ── SSR safety ────────────────────────────────────────────────────────────
  // In the test environment isPlatformBrowser() returns false, so body
  // mutations are skipped. This test confirms the service does NOT throw
  // when running outside a browser (e.g. during SSR prerendering).

  it('does not throw when environment is not a browser (SSR safety)', () => {
    expect(() => {
      emitLang(onLangChangeEmitter, 'ar');
      emitLang(onLangChangeEmitter, 'en');
    }).not.toThrow();
  });

  // ── Signal reactivity ─────────────────────────────────────────────────────

  it('isRtl signal is readable synchronously after each lang change', () => {
    const results: boolean[] = [];

    emitLang(onLangChangeEmitter, 'ar'); results.push(service.isRtl());
    emitLang(onLangChangeEmitter, 'en'); results.push(service.isRtl());
    emitLang(onLangChangeEmitter, 'he'); results.push(service.isRtl());
    emitLang(onLangChangeEmitter, 'es'); results.push(service.isRtl());

    expect(results).toEqual([true, false, true, false]);
  });
});
