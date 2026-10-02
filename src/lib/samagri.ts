import type { PanditServiceSamagri, PujaMode, SamagriList } from '@/lib/types';

type ServiceLike = PanditServiceSamagri & {
  offers_lighter_mode?: boolean;
  lighter_mode_price?: number | null;
};

/** True when the service offers the shorter (lighter) version of the puja. */
export const offersLighter = (s: ServiceLike) => !!s.offers_lighter_mode && s.lighter_mode_price != null;

/**
 * The samagri list for a version of the puja. The shorter version has its own
 * list; older services without one fall back to the full list (`fallback`).
 */
export function samagriListFor(
  s: ServiceLike,
  mode: PujaMode,
): { list: SamagriList | null; fallback: boolean } {
  if (mode === 'lighter' && offersLighter(s)) {
    if (s.lighter_samagri_list) return { list: s.lighter_samagri_list, fallback: false };
    return { list: s.samagri_list ?? null, fallback: true };
  }
  return { list: s.samagri_list ?? null, fallback: false };
}

/**
 * Kit price for a version of the puja (display mirror of the backend's
 * samagriKitPriceFor; the server charges and snapshots the real one).
 */
export function samagriKitPriceFor(s: ServiceLike, mode: PujaMode): number {
  const price =
    mode === 'lighter' && offersLighter(s) ? (s.lighter_samagri_kit_price ?? s.samagri_kit_price) : s.samagri_kit_price;
  return Number(price ?? 0);
}

/** A pandit offering the shorter version still has to upload its own list. */
export const lighterListMissing = (s: ServiceLike) => offersLighter(s) && !s.lighter_samagri_list;
