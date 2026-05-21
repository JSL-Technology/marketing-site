import { isRtlLanguage, RTL_LANGUAGES, SUPPORTED_LANGUAGES } from './languages';

describe('RTL_LANGUAGES registry', () => {
  it('contains Arabic (ar)', () => {
    expect(RTL_LANGUAGES).toContain('ar');
  });

  it('contains Hebrew (he) for future use', () => {
    expect(RTL_LANGUAGES).toContain('he');
  });

  it('contains Farsi (fa) for future use', () => {
    expect(RTL_LANGUAGES).toContain('fa');
  });

  it('contains Urdu (ur) for future use', () => {
    expect(RTL_LANGUAGES).toContain('ur');
  });

  it('does not contain LTR languages', () => {
    expect(RTL_LANGUAGES).not.toContain('en');
    expect(RTL_LANGUAGES).not.toContain('es');
    expect(RTL_LANGUAGES).not.toContain('fr');
    expect(RTL_LANGUAGES).not.toContain('de');
    expect(RTL_LANGUAGES).not.toContain('ja');
    expect(RTL_LANGUAGES).not.toContain('zh');
  });
});

describe('isRtlLanguage', () => {
  describe('active RTL locales', () => {
    it('returns true for Arabic (ar)', () => {
      expect(isRtlLanguage('ar')).toBeTrue();
    });
  });

  describe('future RTL locales (pre-registered)', () => {
    it('returns true for Hebrew (he)', () => {
      expect(isRtlLanguage('he')).toBeTrue();
    });

    it('returns true for Farsi (fa)', () => {
      expect(isRtlLanguage('fa')).toBeTrue();
    });

    it('returns true for Urdu (ur)', () => {
      expect(isRtlLanguage('ur')).toBeTrue();
    });
  });

  describe('LTR locales', () => {
    const ltrLangs = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ht'];
    for (const lang of ltrLangs) {
      it(`returns false for ${lang}`, () => {
        expect(isRtlLanguage(lang)).toBeFalse();
      });
    }
  });

  describe('edge cases', () => {
    it('returns false for null', () => {
      expect(isRtlLanguage(null)).toBeFalse();
    });

    it('returns false for undefined', () => {
      expect(isRtlLanguage(undefined)).toBeFalse();
    });

    it('returns false for empty string', () => {
      expect(isRtlLanguage('')).toBeFalse();
    });

    it('is case-sensitive — uppercase AR is not RTL', () => {
      expect(isRtlLanguage('AR')).toBeFalse();
    });

    it('returns false for unknown language codes', () => {
      expect(isRtlLanguage('xx')).toBeFalse();
      expect(isRtlLanguage('zz')).toBeFalse();
    });
  });
});

describe('SUPPORTED_LANGUAGES', () => {
  it('includes Arabic as the active RTL locale', () => {
    expect(SUPPORTED_LANGUAGES).toContain('ar');
  });

  it('has at least 11 entries', () => {
    expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(11);
  });
});
