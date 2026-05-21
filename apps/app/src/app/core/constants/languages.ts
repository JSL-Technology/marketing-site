export const SUPPORTED_LANGUAGES: string[] = [
  'en',
  'es',
  'ar',
  'de',
  'fr',
  'it',
  'ja',
  'ko',
  'pt',
  'zh',
  'ht',
];

/**
 * Keep RTL languages centralized so all services/components share
 * the exact same source of truth.
 *
 * 'ar' is the only actively-served RTL locale today.
 * 'he', 'fa', 'ur' are pre-registered so DirectionService already
 * handles them correctly when they are added to SUPPORTED_LANGUAGES.
 */
export const RTL_LANGUAGES: readonly string[] = ['ar', 'he', 'fa', 'ur'];

export function isRtlLanguage(lang: string | null | undefined): boolean {
  if (!lang) {
    return false;
  }

  return (RTL_LANGUAGES as readonly string[]).includes(lang);
}
