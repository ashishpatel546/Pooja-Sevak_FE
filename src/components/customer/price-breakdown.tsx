'use client';

import { useFormat, useT } from '@/i18n';
import { cn } from '@/lib/utils';

/** True when a breakdown is worth showing (anything on top of the dakshina). */
export const hasExtras = (fee: number, samagri = 0) => fee > 0 || samagri > 0;

/**
 * Dakshina, samagri kit and platform fee lines shown above a total, each
 * separately. Renders nothing when there is neither a fee nor samagri, so
 * bookings without them look exactly as before.
 */
export function FeeLines({
  price,
  fee,
  samagri = 0,
  className,
}: {
  price: number;
  fee: number;
  /** The pandit's samagri kit (0 when the family arranges the samagri). */
  samagri?: number;
  className?: string;
}) {
  const t = useT('booking');
  const ts = useT('samagri');
  const f = useFormat();
  if (!hasExtras(fee, samagri)) return null;
  return (
    <dl className={cn('grid gap-1.5 text-sm', className)}>
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">{t('price.dakshina')}</dt>
        <dd className="tabular-nums">{f.inr(price)}</dd>
      </div>
      {samagri > 0 && (
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{ts('price.samagri')}</dt>
          <dd className="tabular-nums">{f.inr(samagri)}</dd>
        </div>
      )}
      {fee > 0 && (
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{t('price.fee')}</dt>
          <dd className="tabular-nums">{f.inr(fee)}</dd>
        </div>
      )}
    </dl>
  );
}
