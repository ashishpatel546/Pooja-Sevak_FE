// Dates the panchang API can answer for (backend MIN_DATE / MAX_DATE).
export const PANCHANG_MIN_DATE = '1901-01-01';
export const PANCHANG_MAX_DATE = '2099-12-31';

/** A real YYYY-MM-DD calendar date inside the panchang's range. */
export function isPanchangDate(raw: unknown): raw is string {
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;
  if (raw < PANCHANG_MIN_DATE || raw > PANCHANG_MAX_DATE) return false;
  return new Date(`${raw}T00:00:00Z`).toISOString().slice(0, 10) === raw;
}

/** YYYY-MM-DD `n` days after `key` (calendar arithmetic, no time zone). */
export function shiftDate(key: string, n: number): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** /panchang link for a day; today's link has no query so it stays canonical. */
export function panchangHref(date: string, today: string): string {
  return date === today ? '/panchang' : `/panchang?date=${date}`;
}
