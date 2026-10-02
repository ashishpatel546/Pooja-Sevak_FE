'use client';

import { Star } from 'lucide-react';
import { useT } from '@/i18n';
import type { RatingBreakdown, Review } from '@/lib/types';
import { cn } from '@/lib/utils';

export const RATING_PARAMS = ['vidhi', 'nature', 'punctuality'] as const;
export type RatingParam = (typeof RATING_PARAMS)[number];

/** Per-parameter averages as horizontal bars (pandit profile). */
export function RatingBars({ breakdown, className }: { breakdown: RatingBreakdown; className?: string }) {
  const t = useT('customer');
  const rows = [
    ...RATING_PARAMS.map((k) => ({ key: k, label: t(`review.param.${k}`), value: breakdown[k] })),
    { key: 'overall', label: t('review.param.overall'), value: breakdown.overall },
  ].filter((r) => r.value != null && Number(r.value) > 0);
  if (!breakdown.detailed_reviews || !rows.length) return null;
  return (
    <div className={cn('rounded-xl border bg-card p-4', className)}>
      <dl className="grid gap-2.5">
        {rows.map((r) => {
          const v = Number(r.value);
          return (
            <div key={r.key} className="grid grid-cols-[minmax(0,7.5rem)_1fr_2.25rem] items-center gap-3 text-sm">
              <dt className="truncate text-muted-foreground">{r.label}</dt>
              <dd className="contents">
                <span
                  className="h-2 overflow-hidden rounded-full bg-muted"
                  role="img"
                  aria-label={t('rating.param', { label: r.label, value: v.toFixed(1) })}
                >
                  <span className="block h-full rounded-full bg-diya" style={{ width: `${(v / 5) * 100}%` }} />
                </span>
                <span className="text-right font-medium tabular-nums">{v.toFixed(1)}</span>
              </dd>
            </div>
          );
        })}
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">{t.plural('profile.basedOn', breakdown.detailed_reviews)}</p>
    </div>
  );
}

/** One line for pandit cards: "Vidhi 4.8 · Nature 4.9 · On time 4.6". */
export function RatingParamsInline({ breakdown, className }: { breakdown?: RatingBreakdown; className?: string }) {
  const t = useT('customer');
  if (!breakdown?.detailed_reviews) return null;
  const parts = RATING_PARAMS.filter((k) => breakdown[k] != null).map((k) => ({
    key: k,
    label: t(`review.short.${k}`),
    full: t(`review.param.${k}`),
    value: Number(breakdown[k]).toFixed(1),
  }));
  if (!parts.length) return null;
  return (
    <p className={cn('flex flex-wrap gap-x-2 text-xs text-muted-foreground', className)}>
      {parts.map((p, i) => (
        <span key={p.key} aria-label={t('rating.param', { label: p.full, value: p.value })}>
          {i > 0 && <span aria-hidden="true">· </span>}
          <span aria-hidden="true">
            {p.label} <span className="font-medium text-foreground tabular-nums">{p.value}</span>
          </span>
        </span>
      ))}
    </p>
  );
}

/** Stars for one value, read-only. */
export function Stars({ value, size = 'sm', label }: { value: number; size?: 'sm' | 'xs'; label: string }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(size === 'xs' ? 'size-3' : 'size-4', n <= value ? 'fill-diya text-diya' : 'text-muted-foreground/40')}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

/** The parameter ratings of one review (compact list). */
export function ReviewParams({ review, className }: { review: Review; className?: string }) {
  const t = useT('customer');
  const rows = RATING_PARAMS.map((k) => ({ k, v: review[`rating_${k}`] })).filter(
    (r): r is { k: RatingParam; v: number } => r.v != null,
  );
  if (!rows.length) return null;
  return (
    <dl className={cn('grid gap-1 text-xs', className)}>
      {rows.map(({ k, v }) => (
        <div key={k} className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">{t(`review.param.${k}`)}</dt>
          <dd>
            <Stars value={v} size="xs" label={t('rating.param', { label: t(`review.param.${k}`), value: v })} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
