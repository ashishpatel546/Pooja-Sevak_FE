import type { Booking, CustomerFeeConfig } from '@/lib/types';

/**
 * Display-only mirror of backend/src/shared/customer-fee.util.ts. The server
 * computes the real fee when the booking is created and snapshots it.
 */
export function computeCustomerFee(price: number, config: CustomerFeeConfig | null | undefined): number {
  if (!config?.enabled || !(price > 0) || !(config.value > 0)) return 0;
  if (config.mode === 'flat') return Math.round(config.value);
  let fee = +((price * config.value) / 100).toFixed(2);
  if (config.min_amount != null) fee = Math.max(fee, config.min_amount);
  if (config.max_amount != null) fee = Math.min(fee, config.max_amount);
  return Math.round(fee);
}

/** Platform fee snapshotted on a booking (0 for bookings made before the fee existed). */
export const bookingFee = (b: Pick<Booking, 'customer_fee_amount'>) => Number(b.customer_fee_amount ?? 0);

/** The pandit's samagri kit on a booking (0 when the family arranges it, and for older bookings). */
export const bookingSamagri = (b: Pick<Booking, 'samagri_amount'>) => Number(b.samagri_amount ?? 0);

/**
 * What the customer pays (and gets back on a full refund): dakshina + samagri
 * kit + platform fee. Mirrors backend customerPayable.
 */
export const customerPayable = (b: Pick<Booking, 'total_amount' | 'customer_fee_amount' | 'samagri_amount'>) =>
  +(Number(b.total_amount) + bookingSamagri(b) + bookingFee(b)).toFixed(2);

/** What the pandit receives: dakshina − commission + samagri kit. Mirrors backend panditPayout. */
export const panditPayout = (b: Pick<Booking, 'pandit_credit' | 'samagri_amount'>) =>
  +(Number(b.pandit_credit) + bookingSamagri(b)).toFixed(2);
