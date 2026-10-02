'use client';

import { Star } from 'lucide-react';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

/** Compact rating: "★ 4.8 (23)". Shows "New" when there are no reviews. */
export function Rating({
  value,
  count,
  className,
}: {
  value: number | string;
  count: number;
  className?: string;
}) {
  const t = useT('customer');
  const v = Number(value) || 0;
  if (!count) {
    return <span className={cn('text-sm text-muted-foreground', className)}>{t('rating.new')}</span>;
  }
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-sm', className)}
      role="img"
      aria-label={t.plural('rating.aria', count, { value: v.toFixed(1) })}
    >
      <Star className="size-4 fill-diya text-diya" aria-hidden="true" />
      <span className="font-semibold">{v.toFixed(1)}</span>
      <span className="text-muted-foreground">({count})</span>
    </span>
  );
}

/** Interactive 1–5 star input. */
export function StarInput({
  value,
  onChange,
  labelledBy,
}: {
  value: number;
  onChange: (v: number) => void;
  /** id of a visible label; otherwise a generic "Rating" label is used. */
  labelledBy?: string;
}) {
  const t = useT('customer');
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : t('rating.input')}
      className="flex gap-1"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={t.plural('rating.star', n)}
          onClick={() => onChange(n)}
          className="grid size-11 place-items-center rounded-lg transition-transform hover:scale-110 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Star
            className={cn('size-7', n <= value ? 'fill-diya text-diya' : 'text-muted-foreground/50')}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}
