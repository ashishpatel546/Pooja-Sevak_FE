import type { Booking } from './types';

/** Mirrors the backend: reviews can be edited until 7 days after completion. */
export const REVIEW_EDIT_WINDOW_MS = 7 * 24 * 60 * 60_000;

/** The family may rate once the puja has begun (confirmed, in progress or completed). */
export function canRate(b: Booking, now: number): boolean {
  return (
    (b.booking_status === 'confirmed' || b.booking_status === 'in_progress' || b.booking_status === 'completed') &&
    +new Date(b.start_time) <= now
  );
}

/** When the family's review stops being editable (null = no limit yet: puja not completed). */
export function reviewEditableUntil(b: Booking): Date | null {
  if (b.booking_status !== 'completed') return null;
  const since = b.completed_at ?? b.review?.created_at ?? b.updated_at;
  return new Date(+new Date(since) + REVIEW_EDIT_WINDOW_MS);
}

export function canEditReview(b: Booking, now: number): boolean {
  if (!b.review || b.booking_status === 'cancelled') return false;
  const until = reviewEditableUntil(b);
  return !until || now <= +until;
}
