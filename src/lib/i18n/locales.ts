/**
 * Supported Locales Configuration
 *
 * Defines all supported languages and their metadata for the nself-chat i18n system.
 */

export interface LocaleConfig {
  /** ISO 639-1 language code */
  code: string;
  /** Native language name */
  name: string;
  /** English language name */
  englishName: string;
  /** ISO 15924 script code */
  script: 'Latn' | 'Arab' | 'Hans' | 'Hant' | 'Jpan' | 'Cyrl' | 'Hebr';
  /** Text direction */
  direction: 'ltr' | 'rtl';
  /** BCP 47 language tag */
  bcp47: string;
  /** Flag emoji (optional, for display) */
  flag?: string;
  /** Date-fns locale identifier */
  dateFnsLocale: string;
  /** Number format locale */
  numberLocale: string;
  /** Plural rule type (CLDR) */
  pluralRule: 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
  /** Whether this locale is fully translated */
  isComplete: boolean;
  /** Translation completion percentage */
  completionPercent: number;
}

/**
 * All supported locales
 */
export const SUPPORTED_LOCALES: Record<string, LocaleConfig> = {
  en: {
    code: 'en',
    name: 'English',
    englishName: 'English',
    script: 'Latn',
    direction: 'ltr',
    bcp47: 'en-US',
    flag: '🇺🇸',
    dateFnsLocale: 'en-US',
    numberLocale: 'en-US',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  es: {
    code: 'es',
    name: 'Espanol',
    englishName: 'Spanish',
    script: 'Latn',
    direction: 'ltr',
    bcp47: 'es-ES',
    flag: '🇪🇸',
    dateFnsLocale: 'es',
    numberLocale: 'es-ES',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  fr: {
    code: 'fr',
    name: 'Francais',
    englishName: 'French',
    script: 'Latn',
    direction: 'ltr',
    bcp47: 'fr-FR',
    flag: '🇫🇷',
    dateFnsLocale: 'fr',
    numberLocale: 'fr-FR',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  de: {
    code: 'de',
    name: 'Deutsch',
    englishName: 'German',
    script: 'Latn',
    direction: 'ltr',
    bcp47: 'de-DE',
    flag: '🇩🇪',
    dateFnsLocale: 'de',
    numberLocale: 'de-DE',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  ar: {
    code: 'ar',
    name: 'العربية',
    englishName: 'Arabic',
    script: 'Arab',
    direction: 'rtl',
    bcp47: 'ar-SA',
    flag: '🇸🇦',
    dateFnsLocale: 'ar-SA',
    numberLocale: 'ar-SA',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  zh: {
    code: 'zh',
    name: '中文',
    englishName: 'Chinese (Simplified)',
    script: 'Hans',
    direction: 'ltr',
    bcp47: 'zh-CN',
    flag: '🇨🇳',
    dateFnsLocale: 'zh-CN',
    numberLocale: 'zh-CN',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  ja: {
    code: 'ja',
    name: '日本語',
    englishName: 'Japanese',
    script: 'Jpan',
    direction: 'ltr',
    bcp47: 'ja-JP',
    flag: '🇯🇵',
    dateFnsLocale: 'ja',
    numberLocale: 'ja-JP',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  pt: {
    code: 'pt',
    name: 'Portugues',
    englishName: 'Portuguese',
    script: 'Latn',
    direction: 'ltr',
    bcp47: 'pt-BR',
    flag: '🇧🇷',
    dateFnsLocale: 'pt-BR',
    numberLocale: 'pt-BR',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  ru: {
    code: 'ru',
    name: 'Русский',
    englishName: 'Russian',
    script: 'Cyrl',
    direction: 'ltr',
    bcp47: 'ru-RU',
    flag: '🇷🇺',
    dateFnsLocale: 'ru',
    numberLocale: 'ru-RU',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
} as const;

/**
 * Default locale code
 */
export const DEFAULT_LOCALE = 'en';

/**
 * Fallback locale code (used when translation is missing)
 */
export const FALLBACK_LOCALE = 'en';

/**
 * RTL locale codes
 */
export const RTL_LOCALES = Object.entries(SUPPORTED_LOCALES)
  .filter(([, config]) => config.direction === 'rtl')
  .map(([code]) => code);

/**
 * LTR locale codes
 */
export const LTR_LOCALES = Object.entries(SUPPORTED_LOCALES)
  .filter(([, config]) => config.direction === 'ltr')
  .map(([code]) => code);

/**
 * All locale codes as array
 */
export const LOCALE_CODES = Object.keys(SUPPORTED_LOCALES);

/**
 * Type for valid locale codes
 */
export type LocaleCode = keyof typeof SUPPORTED_LOCALES;

/**
 * Check if a locale code is valid
 */
export function isValidLocale(code: string): code is LocaleCode {
  return code in SUPPORTED_LOCALES;
}

/**
 * Get locale config by code
 */
export function getLocaleConfig(code: string): LocaleConfig | undefined {
  return SUPPORTED_LOCALES[code];
}

/**
 * Get all locales sorted by English name
 */
export function getSortedLocales(): LocaleConfig[] {
  return Object.values(SUPPORTED_LOCALES).sort((a, b) =>
    a.englishName.localeCompare(b.englishName)
  );
}

/**
 * Get complete locales only
 */
export function getCompleteLocales(): LocaleConfig[] {
  return Object.values(SUPPORTED_LOCALES).filter((locale) => locale.isComplete);
}

/**
 * Get locales by direction
 */
export function getLocalesByDirection(direction: 'ltr' | 'rtl'): LocaleConfig[] {
  return Object.values(SUPPORTED_LOCALES).filter(
    (locale) => locale.direction === direction
  );
}
