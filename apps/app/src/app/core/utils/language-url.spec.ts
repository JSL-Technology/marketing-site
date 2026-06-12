import { provideZonelessChangeDetection } from '@angular/core';
import { buildLocalizedUrl, hasLanguagePrefix, normalizeLang } from './language-url';

describe('language-url utils', () => {
  const supported = ['en', 'es', 'fr'];

  it('normalizes language codes', () => {
    expect(normalizeLang(' ES ')).toBe('es');
  });

  it('detects language-prefixed urls', () => {
    expect(hasLanguagePrefix('/es/solutions', supported)).toBe(true);
    expect(hasLanguagePrefix('/solutions/web-development', supported)).toBe(false);
  });

  it('prefixes route when missing language and adds trailing slash', () => {
    expect(buildLocalizedUrl('/solutions/web-development', 'es', supported)).toBe('/es/solutions/web-development/');
  });

  it('does not duplicate an existing language prefix and adds trailing slash', () => {
    expect(buildLocalizedUrl('/en/solutions/web-development', 'es', supported)).toBe('/en/solutions/web-development/');
  });
});
