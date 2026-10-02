'use client';

import Link from 'next/link';
import { BellRing, Pencil, Trash2 } from 'lucide-react';
import { useFormat, useT } from '@/i18n';
import type { Messages } from '@/i18n/messages';
import { pujaHrefFor } from '@/lib/booking-date';
import { daysUntilIn } from '@/lib/format';
import { IST_ZONE } from '@/lib/place';
import { useDays } from './use-days';
import type { Remembrance, RemembranceKind } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ObservanceIcon } from './observance-icon';
import { localized, pujaName, type PujaNames } from './observance';

type RemindersKey = keyof Messages['reminders'] & string;

export function useKindLabel() {
  const t = useT('reminders');
  return (kind: RemembranceKind) => t(`kind.${kind}` as RemindersKey);
}

/** One loved one: who they are, the tithi or date we keep, and when it next comes. */
export function RemembranceCard({
  r,
  pujaNames,
  onEdit,
  onDelete,
  pending,
  tz = IST_ZONE,
}: {
  r: Remembrance;
  pujaNames?: PujaNames;
  onEdit: () => void;
  onDelete: () => void;
  pending?: boolean;
  /** Zone of the reminder location; next_date is a civil date there. */
  tz?: string;
}) {
  const t = useT('reminders');
  const f = useFormat();
  const kindLabel = useKindLabel();
  const byTithi = r.observe_by === 'tithi';
  const tithiLabel = localized(r, 'tithi_label', f.locale);
  const dayMath = useDays(tz);
  const days = daysUntilIn(r.next_date, tz);
  const slug = r.suggested_puja_slugs[0];

  return (
    <article
      className={cn(
        'flex h-full min-w-0 flex-col rounded-xl border bg-card p-5 transition-opacity',
        pending && 'pointer-events-none opacity-50',
      )}
      aria-busy={pending || undefined}
    >
      <div className="flex items-start gap-3">
        <ObservanceIcon observanceKey={null} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className={cn('truncate text-2xl', f.locale === 'hi' ? 'leading-[1.35]' : 'leading-snug')}>
            {r.person_name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {[r.relation, kindLabel(r.kind)].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">{byTithi ? t('card.tithi') : t('card.date')}</dt>
          <dd className="mt-0.5 font-heading text-xl leading-snug text-heading">
            {byTithi
              ? tithiLabel
              : f.dateKey(r.event_date, { weekday: undefined, year: undefined, month: 'long' })}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t('card.next')}</dt>
          <dd className="mt-0.5">
            <span className="font-medium">
              {f.dateKey(r.next_date, { weekday: 'long', month: 'long' })}
            </span>
            {days >= 0 && <span className="text-sindoor"> · {dayMath.relative(r.next_date)}</span>}
          </dd>
        </div>
      </dl>

      <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
        <BellRing className="size-4 shrink-0" aria-hidden="true" />
        {r.remind_days_before === 0
          ? t('card.remindOnDay')
          : t.plural('card.remindBefore', r.remind_days_before)}
      </p>
      {r.notes && <p className="mt-3 line-clamp-3 text-sm whitespace-pre-line">{r.notes}</p>}

      <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-4">
        {slug && (
          <Link
            href={pujaHrefFor(slug, r.next_date)}
            className="mr-auto inline-flex min-h-11 items-center rounded text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {t('card.book', { puja: pujaName(slug, pujaNames, f.locale) })}
          </Link>
        )}
        <div className={cn('flex gap-1', !slug && 'ml-auto')}>
          <Button variant="ghost" size="icon-lg" onClick={onEdit} aria-label={t('card.editAria', { name: r.person_name })}>
            <Pencil aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={onDelete}
            aria-label={t('card.deleteAria', { name: r.person_name })}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </div>
    </article>
  );
}
