'use client';

import { Globe2 } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';
import { DEFAULT_LOCALE, INTL_LOCALE, isLocale, type Locale } from '@/i18n/config';
import { useLocale, useT } from '@/i18n';
import enCustomer from '@/i18n/messages/en/customer';
import hiCustomer from '@/i18n/messages/hi/customer';
import { useNow } from './use-api';

const noop = () => () => {};

/** The viewer's IANA timezone, or null on the server / when it is India. */
export function useForeignTimeZone(): string | null {
  return useSyncExternalStore(
    noop,
    () => {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return tz && tz !== 'Asia/Kolkata' && tz !== 'Asia/Calcutta' ? tz : null;
      } catch {
        return null;
      }
    },
    () => null,
  );
}

function documentLocale(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  const lang = document.documentElement.lang;
  return isLocale(lang) ? lang : DEFAULT_LOCALE;
}

/**
 * The time in the viewer's own zone, e.g. "Sat 5:00 am your time". Pass the
 * active `locale` (from useLocale()); without it the page language is used.
 */
export function formatLocalTime(iso: string | Date, tz: string, locale: Locale = documentLocale()): string {
  const time = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    timeZone: tz,
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
  return (locale === 'hi' ? hiCustomer : enCustomer)['tz.yourTime'].replace('{time}', time);
}

export function zoneName(tz: string, locale: Locale = documentLocale()): string {
  try {
    const part = new Intl.DateTimeFormat(INTL_LOCALE[locale], { timeZone: tz, timeZoneName: 'long' })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName');
    return part?.value ?? tz;
  } catch {
    return tz;
  }
}

/** Reminder that times are IST, with the viewer's local clock when they are abroad. */
export function TimezoneNote({ className }: { className?: string }) {
  const t = useT('customer');
  const { locale } = useLocale();
  const tz = useForeignTimeZone();
  const now = useNow(60_000);
  const fmt = (zone: string) =>
    new Intl.DateTimeFormat(INTL_LOCALE[locale], { timeZone: zone, hour: 'numeric', minute: '2-digit' }).format(now);
  return (
    <p className={cn('flex items-start gap-2 text-sm text-muted-foreground', className)}>
      <Globe2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0">
        {t('tz.ist')}
        {tz && (
          <>
            {' '}
            {t('tz.abroad', { india: fmt('Asia/Kolkata'), local: fmt(tz), zone: zoneName(tz, locale) })}
          </>
        )}
      </span>
    </p>
  );
}
