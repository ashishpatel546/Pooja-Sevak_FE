'use client';

import { LockKeyhole } from 'lucide-react';
import { useLocale, useT } from '@/i18n';
import type { Locale } from '@/i18n/config';
import type { Translator } from '@/i18n/translate';
import { pickName, type Bilingual, type Dignity, type GrahaKey, type KootaKey } from '@/lib/kundali';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MilanShare } from '@/components/share/milan-share';
import { MilanNextSteps } from '@/components/tools/next-steps';
import type { BirthDraft } from './birth-fields';
import { KundaliChart } from './kundali-chart';
import { RASHI_NAMES, ReportSection, useReportT } from './report-kit';

// Shapes of POST /v1/kundali/preview and /v1/kundali/milan/preview (backend src/kundali/preview.ts).
type ManglikLevel = 'none' | 'partial' | 'present';
export type KundaliPreview = {
  ayanamsa: number;
  lagna: { sign: number; sign_name: Bilingual; degree: number };
  rashi: { sign: number; sign_name: Bilingual };
  nakshatra: { nakshatra: number; nakshatra_name: Bilingual; pada: number };
  grahas: { key: GrahaKey; name: Bilingual; short: Bilingual; sign: number; house: number; retrograde: boolean; dignity: Dignity | null }[];
  manglik: ManglikLevel;
};
export type MilanPreview = {
  total: number;
  max: 36;
  verdict: 'excellent' | 'good' | 'average' | 'low';
  kootas: { key: KootaKey; max: number; score: number; dosha: boolean; cancelled: boolean }[];
  manglik: { boy: ManglikLevel; girl: ManglikLevel; match: 'none' | 'balanced' | 'mild' | 'attention' };
};

/** Only what the chart needs: no name or gender leaves the browser for a preview. */
export function previewBody(b: BirthDraft) {
  return { date: b.date, time: b.time, lat: b.place!.lat, lng: b.place!.lng, tz: b.place!.tz };
}

const LAGNA_SHORT: Record<Locale, string> = { en: 'La', hi: 'ल' };
const fmtPts = (x: number) => (x % 1 === 0 ? String(x) : x.toFixed(1));

function FullReportCta({ text, onFull }: { text: string; onFull: () => void }) {
  const tt = useT('tools');
  return (
    <div className="sandhya flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex gap-3">
        <LockKeyhole className="mt-1 size-6 shrink-0 text-diya" aria-hidden="true" />
        <div>
          <p>{text}</p>
          <p className="mt-1 text-sm opacity-90">{tt('preview.ctaHint')}</p>
        </div>
      </div>
      <Button size="lg" className="shrink-0" onClick={onFull}>
        {tt('preview.cta')}
      </Button>
    </div>
  );
}

function manglikText(level: ManglikLevel, tt: Translator<'tools'>) {
  return level === 'present' ? tt('preview.manglikYes') : level === 'partial' ? tt('preview.manglikMild') : tt('preview.manglikNo');
}

export function KundaliPreviewCard({ data, onFull }: { data: KundaliPreview; onFull: () => void }) {
  const tt = useT('tools');
  const { locale: lang } = useLocale();
  const rt = useReportT(lang);
  const n = (b: Bilingual) => pickName(b, lang);
  const placements = [
    { key: 'la', label: LAGNA_SHORT[lang], sign: data.lagna.sign },
    ...data.grahas.map((g) => ({
      key: g.key,
      label: `${g.short[lang]}${g.retrograde && g.key !== 'ra' && g.key !== 'ke' ? '*' : ''}${
        g.dignity === 'exalted' ? '↑' : g.dignity === 'debilitated' ? '↓' : ''
      }`,
      sign: g.sign,
    })),
  ];
  const facts: [string, string][] = [
    [tt('preview.lagna'), n(data.lagna.sign_name)],
    [tt('preview.rashi'), n(data.rashi.sign_name)],
    [tt('preview.nakshatra'), tt('preview.nakshatraValue', { name: n(data.nakshatra.nakshatra_name), pada: data.nakshatra.pada })],
    [tt('preview.manglik'), manglikText(data.manglik, tt)],
  ];

  return (
    <section aria-label={tt('preview.kundaliTitle')} className="grid gap-5">
      <ReportSection title={tt('preview.kundaliTitle')}>
        <div className="grid items-start gap-6 md:grid-cols-[1fr_minmax(0,22rem)]">
          <dl className="grid gap-3 sm:grid-cols-2">
            {facts.map(([label, value]) => (
              <div key={label} className="rounded-xl bg-accent/40 px-4 py-3">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="font-heading text-xl text-heading">{value}</dd>
              </div>
            ))}
          </dl>
          <KundaliChart
            style="north"
            lagnaSign={data.lagna.sign}
            placements={placements}
            signShort={RASHI_NAMES[lang]}
            title={tt('preview.chart')}
            ariaLabel={rt('charts.aria', {
              chart: tt('preview.chart'),
              summary: placements.map((pl) => `${pl.label} ${RASHI_NAMES[lang][pl.sign]}`).join(', '),
            })}
          />
        </div>
      </ReportSection>
      <FullReportCta text={tt('preview.locked')} onFull={onFull} />
    </section>
  );
}

export function MilanPreviewCard({ data, onFull }: { data: MilanPreview; onFull: () => void }) {
  const tt = useT('tools');
  const { locale: lang } = useLocale();
  const rt = useReportT(lang);

  return (
    <section aria-label={tt('preview.milanTitle')} className="grid gap-5">
      <ReportSection title={tt('preview.milanTitle')}>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
          <p className="font-heading text-5xl text-heading tabular-nums">
            {fmtPts(data.total)}
            <span className="text-2xl text-muted-foreground"> / 36</span>
          </p>
          <div>
            <p className="font-heading text-2xl text-heading">{rt(`milan.verdict.${data.verdict}`)}</p>
            <p className="text-muted-foreground">{rt(`milan.verdictText.${data.verdict}`)}</p>
          </div>
        </div>
        <div className="-mx-2 mt-5 overflow-x-auto px-2">
          <table className="w-full min-w-[22rem] text-left text-sm sm:text-base">
            <thead className="text-sm text-muted-foreground">
              <tr className="border-b">
                <th scope="col" className="py-2 pr-3 font-medium">
                  {rt('milan.table.koota')}
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  {rt('milan.table.points')}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.kootas.map((k) => (
                <tr key={k.key} className="border-b border-border/60 align-top">
                  <th scope="row" className="py-2.5 pr-3 font-normal">
                    <span className="block font-medium">{rt(`koota.${k.key}`)}</span>
                    <span className="block text-sm text-muted-foreground">{rt(`kootaAbout.${k.key}`)}</span>
                    {k.dosha && (
                      <span
                        className={cn(
                          'mt-1 inline-block rounded-full px-2 py-0.5 text-xs',
                          k.cancelled ? 'bg-tulsi/15 text-tulsi' : 'bg-primary/10 text-primary',
                        )}
                      >
                        {k.cancelled ? rt('milan.cancelled') : rt('milan.dosha')}
                      </span>
                    )}
                  </th>
                  <td className="py-2.5 text-right tabular-nums">
                    <span className="font-medium">{fmtPts(k.score)}</span>
                    <span className="text-muted-foreground"> / {k.max}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          {(
            [
              ['preview.boy', data.manglik.boy],
              ['preview.girl', data.manglik.girl],
            ] as const
          ).map(([label, level]) => (
            <div key={label} className="rounded-xl bg-accent/40 px-4 py-3">
              <dt className="text-sm text-muted-foreground">
                {tt(label)} · {tt('preview.manglik')}
              </dt>
              <dd className="font-medium">{manglikText(level, tt)}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 font-medium">{rt(`milan.manglik.${data.manglik.match}`)}</p>
        <p className="mt-3 text-sm text-muted-foreground">{rt('milan.disclaimer')}</p>
        <MilanShare score={data.total} kootas={data.kootas} className="mt-5" />
      </ReportSection>
      <FullReportCta text={tt('preview.lockedMilan')} onFull={onFull} />
      <MilanNextSteps />
    </section>
  );
}
