/**
 * Supported Locales Configuration
 *
 * Defines all supported languages and their metadata for the nself-chat i18n system.
 */

export interface LocaleConfig {
  /** ISO 639-1 language code */
  code: string
  /** Native language name */
  name: string
  /** English language name */
  englishName: string
  /** ISO 15924 script code */
  script: 'Latn' | 'Arab' | 'Hans' | 'Hant' | 'Jpan' | 'Cyrl' | 'Hebr' | 'Deva' | 'Thai' | 'Kore'
  /** Text direction */
  direction: 'ltr' | 'rtl'
  /** BCP 47 language tag */
  bcp47: string
  /** Flag emoji (optional, for display) */
  flag?: string
  /** Date-fns locale identifier */
  dateFnsLocale: string
  /** Number format locale */
  numberLocale: string
  /** Plural rule type (CLDR) */
  pluralRule: 'zero' | 'one' | 'two' | 'few' | 'many' | 'other'
  /** Whether this locale is fully translated */
  isComplete: boolean
  /** Translation completion percentage */
  completionPercent: number
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
  ko: {
    code: 'ko',
    name: '한국어',
    englishName: 'Korean',
    script: 'Kore',
    direction: 'ltr',
    bcp47: 'ko-KR',
    flag: '🇰🇷',
    dateFnsLocale: 'ko',
    numberLocale: 'ko-KR',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  it: {
    code: 'it',
    name: 'Italiano',
    englishName: 'Italian',
    script: 'Latn',
    direction: 'ltr',
    bcp47: 'it-IT',
    flag: '🇮🇹',
    dateFnsLocale: 'it',
    numberLocale: 'it-IT',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  nl: {
    code: 'nl',
    name: 'Nederlands',
    englishName: 'Dutch',
    script: 'Latn',
    direction: 'ltr',
    bcp47: 'nl-NL',
    flag: '🇳🇱',
    dateFnsLocale: 'nl',
    numberLocale: 'nl-NL',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  pl: {
    code: 'pl',
    name: 'Polski',
    englishName: 'Polish',
    script: 'Latn',
    direction: 'ltr',
    bcp47: 'pl-PL',
    flag: '🇵🇱',
    dateFnsLocale: 'pl',
    numberLocale: 'pl-PL',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  tr: {
    code: 'tr',
    name: 'Türkçe',
    englishName: 'Turkish',
    script: 'Latn',
    direction: 'ltr',
    bcp47: 'tr-TR',
    flag: '🇹🇷',
    dateFnsLocale: 'tr',
    numberLocale: 'tr-TR',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  sv: {
    code: 'sv',
    name: 'Svenska',
    englishName: 'Swedish',
    script: 'Latn',
    direction: 'ltr',
    bcp47: 'sv-SE',
    flag: '🇸🇪',
    dateFnsLocale: 'sv',
    numberLocale: 'sv-SE',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  he: {
    code: 'he',
    name: 'עברית',
    englishName: 'Hebrew',
    script: 'Hebr',
    direction: 'rtl',
    bcp47: 'he-IL',
    flag: '🇮🇱',
    dateFnsLocale: 'he',
    numberLocale: 'he-IL',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  th: {
    code: 'th',
    name: 'ไทย',
    englishName: 'Thai',
    script: 'Thai',
    direction: 'ltr',
    bcp47: 'th-TH',
    flag: '🇹🇭',
    dateFnsLocale: 'th',
    numberLocale: 'th-TH',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  vi: {
    code: 'vi',
    name: 'Tiếng Việt',
    englishName: 'Vietnamese',
    script: 'Latn',
    direction: 'ltr',
    bcp47: 'vi-VN',
    flag: '🇻🇳',
    dateFnsLocale: 'vi',
    numberLocale: 'vi-VN',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  id: {
    code: 'id',
    name: 'Bahasa Indonesia',
    englishName: 'Indonesian',
    script: 'Latn',
    direction: 'ltr',
    bcp47: 'id-ID',
    flag: '🇮🇩',
    dateFnsLocale: 'id',
    numberLocale: 'id-ID',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  cs: {
    code: 'cs',
    name: 'Čeština',
    englishName: 'Czech',
    script: 'Latn',
    direction: 'ltr',
    bcp47: 'cs-CZ',
    flag: '🇨🇿',
    dateFnsLocale: 'cs',
    numberLocale: 'cs-CZ',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  da: {
    code: 'da',
    name: 'Dansk',
    englishName: 'Danish',
    script: 'Latn',
    direction: 'ltr',
    bcp47: 'da-DK',
    flag: '🇩🇰',
    dateFnsLocale: 'da',
    numberLocale: 'da-DK',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  fi: {
    code: 'fi',
    name: 'Suomi',
    englishName: 'Finnish',
    script: 'Latn',
    direction: 'ltr',
    bcp47: 'fi-FI',
    flag: '🇫🇮',
    dateFnsLocale: 'fi',
    numberLocale: 'fi-FI',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  no: {
    code: 'no',
    name: 'Norsk',
    englishName: 'Norwegian',
    script: 'Latn',
    direction: 'ltr',
    bcp47: 'nb-NO',
    flag: '🇳🇴',
    dateFnsLocale: 'nb',
    numberLocale: 'nb-NO',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  el: {
    code: 'el',
    name: 'Ελληνικά',
    englishName: 'Greek',
    script: 'Latn',
    direction: 'ltr',
    bcp47: 'el-GR',
    flag: '🇬🇷',
    dateFnsLocale: 'el',
    numberLocale: 'el-GR',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  hu: {
    code: 'hu',
    name: 'Magyar',
    englishName: 'Hungarian',
    script: 'Latn',
    direction: 'ltr',
    bcp47: 'hu-HU',
    flag: '🇭🇺',
    dateFnsLocale: 'hu',
    numberLocale: 'hu-HU',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  ro: {
    code: 'ro',
    name: 'Română',
    englishName: 'Romanian',
    script: 'Latn',
    direction: 'ltr',
    bcp47: 'ro-RO',
    flag: '🇷🇴',
    dateFnsLocale: 'ro',
    numberLocale: 'ro-RO',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  uk: {
    code: 'uk',
    name: 'Українська',
    englishName: 'Ukrainian',
    script: 'Cyrl',
    direction: 'ltr',
    bcp47: 'uk-UA',
    flag: '🇺🇦',
    dateFnsLocale: 'uk',
    numberLocale: 'uk-UA',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  hi: {
    code: 'hi',
    name: 'हिन्दी',
    englishName: 'Hindi',
    script: 'Deva',
    direction: 'ltr',
    bcp47: 'hi-IN',
    flag: '🇮🇳',
    dateFnsLocale: 'hi',
    numberLocale: 'hi-IN',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  bn: {
    code: 'bn',
    name: 'বাংলা',
    englishName: 'Bengali',
    script: 'Latn',
    direction: 'ltr',
    bcp47: 'bn-BD',
    flag: '🇧🇩',
    dateFnsLocale: 'bn',
    numberLocale: 'bn-BD',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  fa: {
    code: 'fa',
    name: 'فارسی',
    englishName: 'Persian',
    script: 'Arab',
    direction: 'rtl',
    bcp47: 'fa-IR',
    flag: '🇮🇷',
    dateFnsLocale: 'fa-IR',
    numberLocale: 'fa-IR',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  ms: {
    code: 'ms',
    name: 'Bahasa Melayu',
    englishName: 'Malay',
    script: 'Latn',
    direction: 'ltr',
    bcp47: 'ms-MY',
    flag: '🇲🇾',
    dateFnsLocale: 'ms',
    numberLocale: 'ms-MY',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  ta: {
    code: 'ta',
    name: 'தமிழ்',
    englishName: 'Tamil',
    script: 'Latn',
    direction: 'ltr',
    bcp47: 'ta-IN',
    flag: '🇮🇳',
    dateFnsLocale: 'ta',
    numberLocale: 'ta-IN',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
  'zh-TW': {
    code: 'zh-TW',
    name: '繁體中文',
    englishName: 'Chinese (Traditional)',
    script: 'Hant',
    direction: 'ltr',
    bcp47: 'zh-TW',
    flag: '🇹🇼',
    dateFnsLocale: 'zh-TW',
    numberLocale: 'zh-TW',
    pluralRule: 'other',
    isComplete: true,
    completionPercent: 100,
  },
} as const

/**
 * Default locale code
 */
export const DEFAULT_LOCALE = 'en'

/**
 * Fallback locale code (used when translation is missing)
 */
export const FALLBACK_LOCALE = 'en'

/**
 * RTL locale codes
 */
export const RTL_LOCALES = Object.entries(SUPPORTED_LOCALES)
  .filter(([, config]) => config.direction === 'rtl')
  .map(([code]) => code)

/**
 * LTR locale codes
 */
export const LTR_LOCALES = Object.entries(SUPPORTED_LOCALES)
  .filter(([, config]) => config.direction === 'ltr')
  .map(([code]) => code)

/**
 * All locale codes as array
 */
export const LOCALE_CODES = Object.keys(SUPPORTED_LOCALES)

/**
 * Type for valid locale codes
 */
export type LocaleCode = keyof typeof SUPPORTED_LOCALES

/**
 * Check if a locale code is valid
 */
export function isValidLocale(code: string): code is LocaleCode {
  return code in SUPPORTED_LOCALES
}

/**
 * Get locale config by code
 */
export function getLocaleConfig(code: string): LocaleConfig | undefined {
  return SUPPORTED_LOCALES[code]
}

/**
 * Get all locales sorted by English name
 */
export function getSortedLocales(): LocaleConfig[] {
  return Object.values(SUPPORTED_LOCALES).sort((a, b) => a.englishName.localeCompare(b.englishName))
}

/**
 * Get complete locales only
 */
export function getCompleteLocales(): LocaleConfig[] {
  return Object.values(SUPPORTED_LOCALES).filter((locale) => locale.isComplete)
}

/**
 * Get locales by direction
 */
export function getLocalesByDirection(direction: 'ltr' | 'rtl'): LocaleConfig[] {
  return Object.values(SUPPORTED_LOCALES).filter((locale) => locale.direction === direction)
}
