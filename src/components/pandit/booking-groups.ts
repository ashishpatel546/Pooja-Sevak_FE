import type { Booking } from '@/lib/types';
import { istDateKey } from '@/lib/format';
import { istKeyOf } from '@/components/dashboard/time';

export type PanditBookingTab = 'upcoming' | 'today' | 'completed' | 'cancelled';

const isActive = (b: Booking) =>
  b.booking_status === 'pending' || b.booking_status === 'confirmed' || b.booking_status === 'in_progress';

const asc = (a: Booking, b: Booking) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
const desc = (a: Booking, b: Booking) => -asc(a, b);

/**
 * Split a pandit's bookings into tabs (IST calendar days):
 * - today: active bookings dated today, anything in progress, and earlier
 *   bookings still awaiting completion (so nothing slips through);
 * - upcoming: active bookings on a later day (includes new requests);
 * - completed / cancelled: newest first.
 */
export function groupPanditBookings(list: Booking[] | null, now = new Date()) {
  const today = istDateKey(0, now);
  const g: Record<PanditBookingTab, Booking[]> = { upcoming: [], today: [], completed: [], cancelled: [] };
  for (const b of list ?? []) {
    if (b.booking_status === 'completed') g.completed.push(b);
    else if (b.booking_status === 'cancelled') g.cancelled.push(b);
    else if (isActive(b)) {
      if (b.booking_status === 'in_progress' || istKeyOf(b.start_time) <= today) g.today.push(b);
      else g.upcoming.push(b);
    }
  }
  g.upcoming.sort(asc);
  g.today.sort(asc);
  g.completed.sort(desc);
  g.cancelled.sort(desc);
  return g;
}

export function replaceBooking(list: Booking[] | null, updated: Booking): Booking[] | null {
  return list ? list.map((b) => (b.id === updated.id ? updated : b)) : list;
}
