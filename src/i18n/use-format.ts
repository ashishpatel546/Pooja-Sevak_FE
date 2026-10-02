'use client';

import { useMemo } from 'react';
import {
  daysUntil,
  formatDate,
  formatDateKey,
  formatDateTime,
  formatINR,
  formatTime,
  greetingPart,
} from '@/lib/format';
import { useLocale, useT } from './provider';

/** Formatters bound to the visitor's language. */
export function useFormat() {
  const { locale } = useLocale();
  const t = useT('common');
  return useMemo(
    () => ({
      locale,
      inr: (v: number | string | null | undefined) => formatINR(v, locale),
      date: (iso: string | Date, opts?: Intl.DateTimeFormatOptions) => formatDate(iso, opts, locale),
      dateKey: (key: string, opts?: Intl.DateTimeFormatOptions) => formatDateKey(key, opts, locale),
      time: (iso: string | Date) => formatTime(iso, locale),
      dateTime: (iso: string | Date) => formatDateTime(iso, locale),
      duration: (minutes: number | null | undefined) => {
        if (!minutes) return '';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (!h) return t('duration.min', { m });
        if (!m) return t.plural('duration.hr', h, { h });
        return t('duration.hrMin', { h, m });
      },
      /** "Today", "Tomorrow", "in 5 days" for a YYYY-MM-DD key. */
      relativeDay: (key: string) => {
        const n = daysUntil(key);
        if (n === 0) return t('time.today');
        if (n === 1) return t('time.tomorrow');
        return t.plural('time.inDays', n);
      },
      greeting: (date?: Date) => t(`greeting.${greetingPart(date)}`),
      number: (n: number) => new Intl.NumberFormat(locale === 'hi' ? 'hi-IN' : 'en-IN').format(n),
    }),
    [locale, t],
  );
}
