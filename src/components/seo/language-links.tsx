'use client';

import { usePathname } from 'next/navigation';
import { useLocale, useT } from '@/i18n';
import { LANG_PARAM, LOCALES } from '@/i18n/config';

/**
 * Plain links to this page in each language (`?lang=hi` / `?lang=en`, handled
 * by src/proxy.ts). Crawlers can follow them; for people they work like the
 * top-bar toggle and remember the choice.
 */
export function LanguageLinks({ className }: { className?: string }) {
  const pathname = usePathname() || '/';
  const { locale } = useLocale();
  const t = useT('seo');
  const tc = useT('common');
  return (
    <p className={className}>
      <span>{t('language.label')}: </span>
      {LOCALES.map((l, i) => (
        <span key={l}>
          {i > 0 && ' · '}
          {l === locale ? (
            <span lang={l} aria-current="true" className="font-medium text-[#fbe3b6]">
              {tc(`language.${l}`)}
            </span>
          ) : (
            <a
              href={`${pathname}?${LANG_PARAM}=${l}`}
              hrefLang={l === 'hi' ? 'hi-IN' : 'en-IN'}
              lang={l}
              className="underline-offset-4 hover:text-[#fbe3b6] hover:underline"
            >
              {tc(`language.${l}`)}
            </a>
          )}
        </span>
      ))}
    </p>
  );
}
