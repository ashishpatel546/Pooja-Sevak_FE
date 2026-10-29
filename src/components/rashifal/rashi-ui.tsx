'use client';

import { useId } from 'react';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import { useLocale, useT } from '@/i18n';
import { RASHIS, rashiBySlug, rashiName, type RashifalOverview, type RashiSlug } from '@/lib/rashifal';
import { cn } from '@/lib/utils';
import { selectClass } from '@/components/kundali/birth-fields';
import { Button } from '@/components/ui/button';
import { useMyRashi } from './use-my-rashi';

/** Five small diyas, `rating` of them lit. */
export function RatingDots({ rating, className }: { rating: number; className?: string }) {
  const t = useT('rashifal');
  return (
    <span role="img" aria-label={t('rating.aria', { rating })} className={cn('inline-flex gap-1', className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={cn('size-2 rounded-full', i <= rating ? 'bg-diya' : 'bg-muted-foreground/25')} />
      ))}
    </span>
  );
}

/** "My rashi" chooser: remembered on this device; signed-in users see where theirs came from. */
export function MyRashiPicker({ className }: { className?: string }) {
  const t = useT('rashifal');
  const { locale } = useLocale();
  const id = useId();
  const mine = useMyRashi();
  const source =
    mine.source === 'kundali'
      ? t('mine.fromKundali', { name: mine.kundaliTitle ?? '' })
      : mine.source === 'preference'
        ? t('mine.fromPreference')
        : mine.source === 'device'
          ? t('mine.fromDevice')
          : null;

  return (
    <div className={cn('flex flex-wrap items-end gap-x-4 gap-y-2', className)}>
      <div className="grid min-w-48 gap-1.5">
        <label htmlFor={id} className="text-sm font-medium">
          {t('mine.label')}
        </label>
        <select
          id={id}
          className={cn(selectClass, 'bg-card')}
          value={mine.sign ?? ''}
          onChange={(e) => mine.choose((rashiBySlug(e.target.value)?.slug as RashiSlug | undefined) ?? null)}
        >
          <option value="">{t('mine.choose')}</option>
          {RASHIS.map((r) => (
            <option key={r.slug} value={r.slug}>
              {r.glyph} {rashiName(r, locale)}
            </option>
          ))}
        </select>
      </div>
      {mine.source === 'device' && (
        <Button variant="ghost" className="min-h-11" onClick={() => mine.choose(null)}>
          {t('mine.clear')}
        </Button>
      )}
      <p className="basis-full text-sm text-muted-foreground">
        {source ?? t('mine.unknown')}{' '}
        {mine.source !== 'kundali' && (
          <Link href="/kundali" className="font-medium text-primary underline-offset-4 hover:underline">
            {t('mine.makeKundali')}
          </Link>
        )}
      </p>
    </div>
  );
}

/** The twelve signs for the day; the visitor's own rashi is marked once known. */
export function RashiGrid({ signs }: { signs: RashifalOverview['signs'] }) {
  const t = useT('rashifal');
  const { locale } = useLocale();
  const mine = useMyRashi();

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {signs.map((s) => {
        const r = RASHIS[s.sign.index];
        const isMine = mine.sign === r.slug;
        return (
          <li key={r.slug} className={cn(isMine && 'sm:order-first')}>
            <Link
              href={`/rashifal/${r.slug}`}
              aria-label={t('grid.read', { sign: rashiName(r, locale) })}
              className={cn(
                'group flex h-full flex-col gap-3 rounded-2xl border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-accent/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                isMine && 'border-diya ring-2 ring-diya/60',
              )}
            >
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-chandan text-2xl text-sindoor">
                  {r.glyph}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-2xl leading-tight text-heading">
                    {locale === 'hi' ? r.hi : r.en}
                    {locale === 'en' && <span className="ml-1.5 text-base text-muted-foreground">{r.western}</span>}
                  </p>
                  <RatingDots rating={s.rating} className="mt-1" />
                </div>
                {isMine && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-diya/20 px-2.5 py-1 text-xs font-medium">
                    <Sparkles className="size-3.5" aria-hidden="true" />
                    {t('grid.yours')}
                  </span>
                )}
              </div>
              <p className="font-medium">{s.headline}</p>
              <p className="line-clamp-3 text-sm text-muted-foreground">{s.overall}</p>
              {s.shani && (
                <span className="self-start rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                  {t(`shani.${s.shani}`)}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** On a sign page: "this is your rashi", or a button to make it so. */
export function MineBadge({ sign }: { sign: RashiSlug }) {
  const t = useT('rashifal');
  const mine = useMyRashi();
  if (mine.sign === sign) {
    return (
      <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-diya/25 px-3 text-sm font-medium">
        <Check className="size-4" aria-hidden="true" />
        {t('mine.this')}
      </span>
    );
  }
  return (
    <Button variant="outline" size="sm" className="min-h-9 bg-transparent" onClick={() => mine.choose(sign)}>
      {t('mine.setThis')}
    </Button>
  );
}
