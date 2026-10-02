import { istDateKey } from '@/lib/format';
import type { Translator } from '@/i18n';

/** IST calendar key (YYYY-MM-DD) for an ISO timestamp. */
export function istKeyOf(iso: string | Date): string {
  return istDateKey(0, new Date(iso));
}

/** Whole IST calendar days between today and the date of `iso` (0 = today). */
export function daysFromToday(iso: string | Date, now = new Date()): number {
  const a = Date.parse(istKeyOf(iso));
  const b = Date.parse(istDateKey(0, now));
  return Math.round((a - b) / 86_400_000);
}

/**
 * Friendly "when" for an upcoming moment, in the visitor's language:
 * "in 45 minutes", "today at 6:30 pm", "tomorrow at 7:00 am", "in 4 days".
 * Pass `useT('dashboard')` and `useFormat().time`.
 */
export function relativeWhen(
  iso: string,
  t: Translator<'dashboard'>,
  time: (iso: string) => string,
  now = new Date(),
): string {
  const diff = new Date(iso).getTime() - now.getTime();
  if (diff < 0) return t('when.started', { time: time(iso) });
  const mins = Math.round(diff / 60_000);
  if (mins < 60) return mins <= 1 ? t('when.minute') : t('when.minutes', { count: mins });
  const days = daysFromToday(iso, now);
  if (days === 0) {
    const hrs = Math.round(mins / 60);
    return hrs <= 3 ? t.plural('when.hours', hrs) : t('when.todayAt', { time: time(iso) });
  }
  if (days === 1) return t('when.tomorrowAt', { time: time(iso) });
  if (days < 7) return t('when.days', { count: days });
  const weeks = Math.round(days / 7);
  return weeks === 1 ? t('when.week') : t('when.weeks', { count: weeks });
}

/** True once the moment has passed. */
export function hasStarted(iso: string, now = new Date()): boolean {
  return new Date(iso).getTime() <= now.getTime();
}
