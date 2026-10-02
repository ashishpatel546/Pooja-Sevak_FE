// Display helpers. All dates are shown in India time — the pandit's clock.
// Each formatter takes an optional locale; in components prefer `useFormat()`
// from '@/i18n', which binds the visitor's language.

import { INTL_LOCALE, type Locale } from '@/i18n/config';

const IST = 'Asia/Kolkata';
const tag = (locale: Locale = 'en') => INTL_LOCALE[locale];

export function formatINR(value: number | string | null | undefined, locale?: Locale): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat(tag(locale), {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  if (!m) return h === 1 ? '1 hr' : `${h} hrs`;
  return `${h} hr ${m} min`;
}

export function formatDate(
  iso: string | Date,
  opts: Intl.DateTimeFormatOptions = {},
  locale?: Locale,
): string {
  return new Intl.DateTimeFormat(tag(locale), {
    timeZone: IST,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...opts,
  }).format(new Date(iso));
}

export function formatTime(iso: string | Date, locale?: Locale): string {
  return new Intl.DateTimeFormat(tag(locale), {
    timeZone: IST,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}

export function formatDateTime(iso: string | Date, locale?: Locale): string {
  return `${formatDate(iso, {}, locale)}, ${formatTime(iso, locale)}`;
}

/** Formats a calendar date key (YYYY-MM-DD) without timezone drift. */
export function formatDateKey(
  key: string,
  opts: Intl.DateTimeFormatOptions = {},
  locale?: Locale,
): string {
  return formatDate(`${key}T12:00:00+05:30`, opts, locale);
}

/** Whole days from today (IST) to a YYYY-MM-DD key; negative for the past. */
export function daysUntil(key: string, from: Date = new Date()): number {
  const today = Date.parse(`${istDateKey(0, from)}T00:00:00Z`);
  return Math.round((Date.parse(`${key}T00:00:00Z`) - today) / 86_400_000);
}

/** YYYY-MM-DD for a date in IST, offset by `addDays`. */
export function istDateKey(addDays = 0, from: Date = new Date()): string {
  const d = new Date(from.getTime() + addDays * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: IST }).format(d);
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .replace(/^(pt\.?|pandit|acharya|shri)\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

/** Time-of-day greeting key: morning, day or evening (IST). */
export function greetingPart(date = new Date()): 'morning' | 'day' | 'evening' {
  const h = Number(
    new Intl.DateTimeFormat('en-IN', { timeZone: IST, hour: 'numeric', hour12: false }).format(date),
  );
  if (h < 12) return 'morning';
  if (h < 17) return 'day';
  return 'evening';
}

/** Time-of-day greeting with a devotional touch (English). Prefer useFormat().greeting. */
export function greeting(date = new Date()): string {
  return { morning: 'Suprabhat', day: 'Namaste', evening: 'Shubh sandhya' }[greetingPart(date)];
}

const HONORIFICS = /^(pt\.?|pandit|acharya|shri|sri|smt\.?|dr\.?|mr\.?|mrs\.?|ms\.?)$/i;

/** First given name, skipping titles like "Pt." or "Acharya". */
export function firstName(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return parts.find((p) => !HONORIFICS.test(p)) ?? parts[0] ?? '';
}

// ---- Time-zone-aware helpers (panchang for the visitor's own place) ----

/** YYYY-MM-DD for "now" in `tz`, offset by `addDays`. */
export function dateKeyIn(tz: string, addDays = 0, from: Date = new Date()): string {
  const d = new Date(from.getTime() + addDays * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d);
}

/** Whole days from today in `tz` to a YYYY-MM-DD key; negative for the past. */
export function daysUntilIn(key: string, tz: string, from: Date = new Date()): number {
  const today = Date.parse(`${dateKeyIn(tz, 0, from)}T00:00:00Z`);
  return Math.round((Date.parse(`${key}T00:00:00Z`) - today) / 86_400_000);
}

/**
 * Short zone name for `tz` at `at`: a familiar abbreviation where one exists
 * ("EDT", "BST", "GST", "AEST", "IST"), else "GMT+4".
 */
export function zoneAbbr(tz: string, at: Date | string = new Date()): string {
  const d = new Date(at);
  let fallback = '';
  for (const tag of ['en-US', 'en-GB', 'en-IN', 'en-AU', 'en-CA']) {
    try {
      const name =
        new Intl.DateTimeFormat(tag, { timeZone: tz, timeZoneName: 'short' })
          .formatToParts(d)
          .find((p) => p.type === 'timeZoneName')?.value ?? '';
      if (!fallback) fallback = name;
      if (name && !/^(GMT|UTC)[+-−]/.test(name)) return name;
    } catch {
      /* unknown zone */
    }
  }
  return fallback;
}

/** Clock time in `tz` ("6:12 am"); with `zone`, adds the zone name ("6:12 am EDT"). */
export function formatTimeIn(
  iso: string | Date,
  tz: string,
  locale?: Locale,
  opts: { zone?: boolean } = {},
): string {
  const time = new Intl.DateTimeFormat(tag(locale), {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
  return opts.zone ? `${time} ${zoneAbbr(tz, iso)}` : time;
}
