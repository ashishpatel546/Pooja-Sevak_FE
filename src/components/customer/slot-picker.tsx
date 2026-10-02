'use client';

import { useEffect, useRef } from 'react';
import { CalendarX2 } from 'lucide-react';
import { useFormat, useT } from '@/i18n';
import type { Slot } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

/** A sacred day shown under a date: a short label and a fuller description. */
export type DateMark = { label: string; description: string };

/** Horizontal strip of upcoming IST dates; auspicious days carry a gold dot. */
export function DateStrip({
  dates,
  value,
  onChange,
  marks,
}: {
  dates: string[];
  value: string | null;
  onChange: (key: string) => void;
  marks?: Record<string, DateMark>;
}) {
  const t = useT('booking');
  const f = useFormat();
  const anyMarks = !!marks && Object.keys(marks).length > 0;
  const stripRef = useRef<HTMLDivElement>(null);
  // A pre-selected day (e.g. carried from "Book for this day") may sit far along
  // the strip: bring it into view once, horizontally only.
  useEffect(() => {
    const strip = stripRef.current;
    const active = strip?.querySelector<HTMLElement>('[aria-checked="true"]');
    if (!strip || !active) return;
    const offset = active.offsetLeft - strip.offsetLeft;
    if (offset + active.offsetWidth > strip.clientWidth) strip.scrollLeft = offset - strip.clientWidth / 2 + active.offsetWidth / 2;
  }, []);
  return (
    <div>
      <div
        ref={stripRef}
        role="radiogroup"
        aria-label={t('date.choose')}
        className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pt-1 pb-3 sm:mx-0 sm:px-0"
      >
        {dates.map((key, i) => {
          const active = key === value;
          const mark = marks?.[key];
          const full = f.dateKey(key);
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={mark ? t('date.auspiciousAria', { date: full, name: mark.description }) : full}
              title={mark?.description}
              onClick={() => onChange(key)}
              className={cn(
                'flex w-17 shrink-0 snap-start flex-col items-center rounded-xl border bg-card px-1 py-2 transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                active ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/40 hover:bg-accent/40',
                mark && !active && 'border-diya/50',
              )}
            >
              <span className={cn('text-xs', active ? 'opacity-90' : 'text-muted-foreground')}>
                {i === 0 ? t('date.today') : f.dateKey(key, { weekday: 'short', day: undefined, month: undefined, year: undefined })}
              </span>
              <span className="font-heading text-2xl leading-tight">
                {f.dateKey(key, { weekday: undefined, day: 'numeric', month: undefined, year: undefined })}
              </span>
              <span className={cn('text-xs', active ? 'opacity-90' : 'text-muted-foreground')}>
                {f.dateKey(key, { weekday: undefined, day: undefined, month: 'short', year: undefined })}
              </span>
              {anyMarks && (
                <span
                  className={cn(
                    'mt-1 flex h-4 max-w-full items-center gap-1 text-[0.6875rem] leading-none',
                    active ? 'text-primary-foreground' : 'text-heading',
                  )}
                  aria-hidden="true"
                >
                  {mark && (
                    <>
                      <span className={cn('size-1.5 shrink-0 rounded-full', active ? 'bg-primary-foreground' : 'bg-diya')} />
                      <span className="truncate">{mark.label}</span>
                    </>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {anyMarks && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-1.5 shrink-0 rounded-full bg-diya" aria-hidden="true" />
          {t('date.legend')}
        </p>
      )}
    </div>
  );
}

/** Grid of time chips for one day. */
export function SlotGrid({
  slots,
  loading,
  error,
  value,
  onChange,
  emptyText,
}: {
  slots: Slot[] | undefined;
  loading: boolean;
  error?: string;
  value: string | null;
  onChange: (iso: string) => void;
  /** Replaces the generic "fully booked" line when no slot is free. */
  emptyText?: string;
}) {
  const t = useT('booking');
  const f = useFormat();
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="h-11 rounded-full" />
        ))}
      </div>
    );
  }
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  const available = (slots ?? []).filter((s) => s.available);
  if (!slots || available.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-dashed p-5 text-muted-foreground">
        <CalendarX2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p>{emptyText ?? t('slot.fullyBooked')}</p>
      </div>
    );
  }
  return (
    <div role="radiogroup" aria-label={t('slot.choose')} className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
      {slots.map((s) => {
        const active = s.start === value;
        return (
          <button
            key={s.start}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={!s.available}
            onClick={() => onChange(s.start)}
            className={cn(
              'h-11 rounded-full border text-sm font-medium tabular-nums transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-card hover:border-primary/40 hover:bg-accent/40',
              !s.available && 'cursor-not-allowed border-dashed bg-transparent text-muted-foreground/50 line-through hover:border-border hover:bg-transparent',
            )}
          >
            {f.time(s.start)}
            {!s.available && <span className="sr-only"> {t('slot.unavailable')}</span>}
          </button>
        );
      })}
    </div>
  );
}
