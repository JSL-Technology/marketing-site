export function normalizeLang(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function hasLanguagePrefix(path: string, supportedLangs: readonly string[]): boolean {
  const firstSegment = path.split('/').filter(Boolean)[0] ?? '';
  const normalized = normalizeLang(firstSegment);
  return supportedLangs.map(normalizeLang).includes(normalized);
}

export function buildLocalizedUrl(path: string, lang: string, supportedLangs: readonly string[]): string {
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return hasLanguagePrefix(safePath, supportedLangs)
    ? safePath
    : `/${normalizeLang(lang)}${safePath === '/' ? '' : safePath}`;
}

export function detectPreferredLanguage(
  acceptLanguage: string | undefined,
  cookieHeader: string | undefined,
  supported: readonly string[],
  fallback: string
): string {
  // 1. Try to get language from cookie
  if (cookieHeader) {
    const langFromCookie = getCookie('lang', cookieHeader);
    if (langFromCookie && supported.includes(langFromCookie)) {
      return langFromCookie;
    }
  }

  // 2. Browser negotiation (Accept-Language)
  if (acceptLanguage) {
    const langs = acceptLanguage.split(',').map(lang => {
      const parts = lang.trim().split(';');
      return {
        code: (parts[0].split('-')[0] || '').toLowerCase(),
        q: parts[1] ? parseFloat(parts[1].split('=')[1]) : 1.0,
      };
    }).sort((a, b) => b.q - a.q);

    for (const lang of langs) {
      if (supported.includes(lang.code)) {
        return lang.code;
      }
    }
  }

  return fallback;
}

export function getCookie(name: string, cookieHeader: string): string | null {
  const nameLenPlus = (name.length + 1);
  return cookieHeader
    .split(';')
    .map(c => c.trim())
    .filter(cookie => {
      return cookie.substring(0, nameLenPlus) === `${name}=`;
    })
    .map(cookie => {
      return decodeURIComponent(cookie.substring(nameLenPlus));
    })[0] || null;
}
