import 'server-only';
import { cookies, headers } from 'next/headers';
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_HEADER, isLocale, type Locale } from './config';
import { en, hi, type Namespace } from './messages';
import { createTranslator, type LoadedMessages } from './translate';

/**
 * Locale for the current request: an explicit `?lang=` (forwarded by
 * src/proxy.ts as a request header), else the cookie, else Hindi.
 */
export async function getLocale(): Promise<Locale> {
  const fromQuery = (await headers()).get(LOCALE_HEADER);
  if (isLocale(fromQuery)) return fromQuery;
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function messagesFor(locale: Locale): LoadedMessages {
  return (locale === 'hi' ? hi : en) as LoadedMessages;
}

/** Server-component translator: `const t = await getT('home')`. */
export async function getT<N extends Namespace>(ns: N) {
  const locale = await getLocale();
  return createTranslator(locale, messagesFor(locale), ns);
}
