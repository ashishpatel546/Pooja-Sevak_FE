// Hindi-first: every visitor sees Hindi until they choose English.

export const LOCALES = ['hi', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'hi';
export const LOCALE_COOKIE = 'ps_locale';

/** BCP-47 tags used with Intl formatters. */
export const INTL_LOCALE: Record<Locale, string> = { hi: 'hi-IN', en: 'en-IN' };

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** `?lang=en|hi` on any page overrides the cookie for that request (crawlable language URLs). */
export const LANG_PARAM = 'lang';
/** Request header set by src/proxy.ts when `?lang=` is present; read by getLocale(). */
export const LOCALE_HEADER = 'x-ps-locale';
