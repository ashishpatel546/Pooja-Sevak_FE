'use client';

import Link from 'next/link';
import { ArrowRight, Clock, Video } from 'lucide-react';
import type { ServiceDefinition } from '@/lib/types';
import { cn } from '@/lib/utils';
import { pick, useFormat, useLocale, useT } from '@/i18n';
import { PujaIcon } from '@/components/common/puja-icon';
import { rich } from '@/components/common/rich';

export function PujaPrice({ value, className }: { value: number | string | null | undefined; className?: string }) {
  const t = useT('catalog');
  const f = useFormat();
  if (value === null || value === undefined || value === '') {
    return <span className={cn('text-sm text-muted-foreground', className)}>{t('tile.joiningSoon')}</span>;
  }
  return (
    <span className={cn('text-sm text-muted-foreground', className)}>
      {rich(t('tile.from'), {
        price: <span className="font-semibold text-foreground tabular-nums">{f.inr(Number(value))}</span>,
      })}
    </span>
  );
}

function OnlineMark() {
  const t = useT('catalog');
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-tulsi">
      <Video className="size-3.5" aria-hidden="true" />
      {t('tile.alsoOnline')}
    </span>
  );
}

/** Large tile for featured pujas. */
export function PujaFeatureTile({ puja, className }: { puja: ServiceDefinition; className?: string }) {
  const t = useT('catalog');
  const f = useFormat();
  const { locale } = useLocale();
  const tagline = pick(puja, 'tagline', locale);
  return (
    <Link
      href={`/pujas/${puja.slug}`}
      className={cn(
        'group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-chandan p-6 transition-shadow hover:shadow-[0_24px_50px_-30px_rgb(42_31_74/0.55)] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:p-7',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <PujaIcon category={puja.category} size="lg" />
        {puja.supports_online && <OnlineMark />}
      </div>
      <h3 className="mt-5 text-2xl leading-tight text-balance sm:text-3xl">{pick(puja, 'name', locale)}</h3>
      {tagline && <p className="mt-2 text-muted-foreground">{tagline}</p>}
      {puja.deity && <p className="mt-1 text-sm text-muted-foreground">{t('tile.forDeity', { deity: puja.deity })}</p>}
      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-6">
        <div className="grid gap-0.5">
          <PujaPrice value={puja.starting_price} className="text-base" />
          {puja.typical_duration_minutes ? (
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="size-3.5" aria-hidden="true" />
              {t('tile.about', { duration: f.duration(Number(puja.typical_duration_minutes)) })}
            </span>
          ) : null}
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
          {t('tile.view')}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

/** Compact row tile for the rest of the catalog. */
export function PujaTile({ puja }: { puja: ServiceDefinition }) {
  const f = useFormat();
  const { locale } = useLocale();
  const tagline = pick(puja, 'tagline', locale);
  return (
    <Link
      href={`/pujas/${puja.slug}`}
      className="group flex h-full gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <PujaIcon category={puja.category} />
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-lg leading-snug group-hover:text-primary">{pick(puja, 'name', locale)}</h3>
        {tagline && <p className="line-clamp-2 text-sm text-muted-foreground">{tagline}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3">
          <PujaPrice value={puja.starting_price} />
          {puja.typical_duration_minutes ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3.5" aria-hidden="true" />
              {f.duration(Number(puja.typical_duration_minutes))}
            </span>
          ) : null}
          {puja.supports_online && <OnlineMark />}
        </div>
      </div>
    </Link>
  );
}
