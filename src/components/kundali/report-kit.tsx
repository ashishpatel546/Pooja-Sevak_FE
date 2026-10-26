'use client';

import { useMemo, type ReactNode } from 'react';
import { INTL_LOCALE, type Locale } from '@/i18n/config';
import enKundali from '@/i18n/messages/en/kundali';
import hiKundali from '@/i18n/messages/hi/kundali';
import { createTranslator, type LoadedMessages } from '@/i18n/translate';
import type { GrahaPosition, Kundali, VargaKey } from '@/lib/kundali';
import { cn } from '@/lib/utils';
import type { ChartPlacement } from './kundali-chart';

/**
 * Translator for the language chosen for a report, which may differ from the site's
 * language (a family may read the site in Hindi and print an English kundali).
 */
export function useReportT(lang: Locale) {
  return useMemo(
    () =>
      createTranslator(lang, { kundali: lang === 'hi' ? hiKundali : enKundali } as unknown as LoadedMessages, 'kundali'),
    [lang],
  );
}
export type ReportT = ReturnType<typeof useReportT>;

export const RASHI_NAMES: Record<Locale, string[]> = {
  en: ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'],
  hi: ['मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन'],
};

const LAGNA_SHORT: Record<Locale, string> = { en: 'La', hi: 'ल' };

/** Short chart label: retrograde *, exalted ↑, debilitated ↓ (Rahu and Ketu are always retrograde). */
export function grahaLabel(g: GrahaPosition, lang: Locale): string {
  const node = g.key === 'ra' || g.key === 'ke';
  const mark = g.dignity === 'exalted' ? '↑' : g.dignity === 'debilitated' ? '↓' : '';
  return `${g.short[lang]}${g.retrograde && !node ? '*' : ''}${mark}`;
}

export type ChartKind = 'lagna' | 'navamsa' | 'chandra';

/** Placements and the first-house sign for one of the three charts. */
export function chartData(k: Kundali, kind: ChartKind, lang: Locale): { lagnaSign: number; placements: ChartPlacement[] } {
  const moon = k.grahas.find((g) => g.key === 'mo')!;
  const signOf = (p: { sign: number; navamsa_sign: number }) => (kind === 'navamsa' ? p.navamsa_sign : p.sign);
  const lagnaSign = kind === 'chandra' ? moon.sign : signOf(k.lagna);
  const placements: ChartPlacement[] = [
    { key: 'la', label: LAGNA_SHORT[lang], sign: signOf(k.lagna) },
    ...k.grahas.map((g) => ({ key: g.key, label: grahaLabel(g, lang), sign: signOf(g) })),
  ];
  return { lagnaSign, placements };
}

/** Placements for a divisional chart (its own lagna is the first house). */
export function vargaChartData(k: Kundali, varga: VargaKey, lang: Locale): { lagnaSign: number; placements: ChartPlacement[] } {
  const v = k.vargas[varga];
  return {
    lagnaSign: v.lagna,
    placements: [
      { key: 'la', label: LAGNA_SHORT[lang], sign: v.lagna },
      ...k.grahas.map((g) => ({ key: g.key, label: grahaLabel(g, lang), sign: v.grahas[g.key] })),
    ],
  };
}

export function fmtCivilDate(date: string, lang: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[lang], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

export function fmtDate(iso: string, lang: Locale, tz: string): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[lang], { day: 'numeric', month: 'short', year: 'numeric', timeZone: tz }).format(
    new Date(iso),
  );
}

export function fmtTime(iso: string, lang: Locale, tz: string): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[lang], { hour: 'numeric', minute: '2-digit', timeZone: tz }).format(new Date(iso));
}

/** 'HH:mm' wall-clock time shown in the report's language (e.g. 2:35 pm). */
export function fmtWallTime(time: string, lang: Locale): string {
  const [h, m] = time.split(':').map(Number);
  return new Intl.DateTimeFormat(INTL_LOCALE[lang], { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2000, 0, 1, h, m)),
  );
}

export function utcOffset(minutes: number): string {
  const sign = minutes < 0 ? '−' : '+';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = Math.round(abs % 60);
  return `UTC${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * A titled report section. In print it flows on from the previous one and may continue onto
 * the next page; only its heading, table rows, facts and charts are kept whole.
 */
export function ReportSection({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        'rounded-2xl border bg-card p-5 sm:p-6 print:rounded-none print:border-0 print:p-0 print:[&_tr]:break-inside-avoid',
        className,
      )}
    >
      <div className="print:break-inside-avoid print:break-after-avoid">
        <h2 className="font-heading text-2xl leading-snug text-heading">{title}</h2>
        <div aria-hidden="true" className="toran mt-2 mb-4" />
      </div>
      {children}
    </section>
  );
}

/** Label / value pairs in two columns on wider screens. */
export function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="flex min-w-0 flex-col border-b border-border/60 pb-2 print:break-inside-avoid">
          <dt className="text-sm text-muted-foreground">{k}</dt>
          <dd className="font-medium break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
