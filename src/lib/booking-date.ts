// "Book for this day": the date (and optional observance) a visitor picked on a
// sacred-day card, carried through /pujas/[slug] → /browse | /online →
// /pandits/[id] → /pandits/[id]/book as `?date=YYYY-MM-DD&occasion=<key>`.
// Pure helpers; safe in server and client components.
//
// Time zones: a puja's slots are always IST (backend: istToUtc(date, work hour),
// and the wizard's date strip is built from istDateKey). An observance's `date`
// is a civil date in the panchang place's zone. A *day* cannot be converted
// between zones (one New York day spans two IST days), so we deliberately carry
// the calendar date unchanged: "Ekadashi on 14 Oct" books the pandit's IST day
// of 14 Oct. For Indian places (the default, Lucknow) the two are identical;
// visitors abroad see the IST/local-time note under the slot grid as usual.
import { OBSERVANCE_KEYS } from '@/components/ritual/observance';
import { istDateKey } from '@/lib/format';
import type { ObservanceKey } from '@/lib/types';

/** Matches backend BOOKING_LEAD_TIME_MS (backend/src/shared/time.util.ts). */
export const BOOKING_LEAD_TIME_MS = 2 * 60 * 60_000;
/**
 * How far ahead a carried date may be (days from today, IST). The backend has
 * no upper limit; this matches the longest sacred-day list (/panchang, 90 days).
 */
export const BOOKING_HORIZON_DAYS = 90;

export type BookingDate = { date: string | null; occasion: ObservanceKey | null };
export const NO_BOOKING_DATE: BookingDate = { date: null, occasion: null };

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A real calendar date in strict YYYY-MM-DD form, else null. */
export function parseDateKey(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const m = DATE_RE.exec(raw);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d ? raw : null;
}

export function parseOccasion(raw: unknown): ObservanceKey | null {
  return typeof raw === 'string' && (OBSERVANCE_KEYS as string[]).includes(raw) ? (raw as ObservanceKey) : null;
}

/** First IST day that can still hold a slot ≥ 2 hours from now. */
export function earliestBookableDate(now: Date = new Date()): string {
  return istDateKey(0, new Date(now.getTime() + BOOKING_LEAD_TIME_MS));
}

/** Last IST day inside the booking horizon. */
export function latestBookableDate(now: Date = new Date()): string {
  return istDateKey(BOOKING_HORIZON_DAYS - 1, now);
}

/** True for a valid date key that is not past, honours the lead time and sits inside the horizon. */
export function isBookableDate(key: string | null, now: Date = new Date()): key is string {
  return !!parseDateKey(key) && key! >= earliestBookableDate(now) && key! <= latestBookableDate(now);
}

type ParamSource = { get(name: string): string | null } | Record<string, string | string[] | undefined>;

function read(src: ParamSource, name: string): string | null {
  if (typeof (src as { get?: unknown }).get === 'function') return (src as { get(n: string): string | null }).get(name);
  const v = (src as Record<string, string | string[] | undefined>)[name];
  return typeof v === 'string' ? v : null;
}

/**
 * Strictly reads `date` + `occasion` from URL params. Anything malformed, past
 * or out of range is dropped silently; raw query text is never returned.
 */
export function readBookingDate(src: ParamSource, now: Date = new Date()): BookingDate {
  const date = parseDateKey(read(src, 'date'));
  return {
    date: isBookableDate(date, now) ? date : null,
    occasion: parseOccasion(read(src, 'occasion')),
  };
}

/** Sets (or clears) `date` / `occasion` on a URLSearchParams. */
export function applyBookingDate(qs: URLSearchParams, ctx: BookingDate): URLSearchParams {
  if (ctx.date) qs.set('date', ctx.date);
  else qs.delete('date');
  if (ctx.occasion) qs.set('occasion', ctx.occasion);
  else qs.delete('occasion');
  return qs;
}

/** Appends `date` / `occasion` to an href that may already have a query string. */
export function withBookingDate(href: string, ctx: BookingDate): string {
  if (!ctx.date && !ctx.occasion) return href;
  const [path, query = ''] = href.split('?');
  const qs = applyBookingDate(new URLSearchParams(query), ctx);
  return `${path}?${qs.toString()}`;
}

/**
 * The day to book for an observance shown on a card: its date, or — for a range
 * like Pitru Paksha that has already begun — `today` (a key in the same zone).
 */
export function observanceBookingDay(o: { date: string; end_date?: string | null }, today: string): string {
  return o.date < today && o.end_date && o.end_date >= today ? today : o.date;
}

/** `/pujas/<slug>?date=…&occasion=…` for a sacred-day CTA. */
export function pujaHrefFor(slug: string, date: string | null, occasion?: ObservanceKey | null): string {
  return withBookingDate(`/pujas/${slug}`, { date: parseDateKey(date), occasion: occasion ?? null });
}
