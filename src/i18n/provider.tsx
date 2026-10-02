'use client';

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { LANG_PARAM, LOCALE_COOKIE, type Locale } from './config';
import type { Namespace } from './messages';
import { createTranslator, type LoadedMessages, type Translator } from './translate';

type I18nState = {
  locale: Locale;
  messages: LoadedMessages;
  setLocale: (next: Locale) => void;
};

const I18nContext = createContext<I18nState | null>(null);

/** Receives the active locale's messages from the root (server) layout. */
export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: LoadedMessages;
  children: ReactNode;
}) {
  const router = useRouter();
  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = next;
      // A `?lang=` in the URL would override the cookie again (src/proxy.ts):
      // reload without it (rare — only visitors arriving on a language link).
      const url = new URL(window.location.href);
      if (url.searchParams.has(LANG_PARAM)) {
        url.searchParams.delete(LANG_PARAM);
        window.location.replace(url.toString());
        return;
      }
      router.refresh();
    },
    [locale, router],
  );
  const value = useMemo(() => ({ locale, messages, setLocale }), [locale, messages, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useT/useLocale must be used within I18nProvider');
  return ctx;
}

/** Client translator for one namespace: `const t = useT('booking'); t('wizard.title')`. */
export function useT<N extends Namespace>(ns: N): Translator<N> {
  const { locale, messages } = useI18n();
  return useMemo(() => createTranslator(locale, messages, ns), [locale, messages, ns]);
}

export function useLocale() {
  const { locale, setLocale } = useI18n();
  return { locale, setLocale };
}
