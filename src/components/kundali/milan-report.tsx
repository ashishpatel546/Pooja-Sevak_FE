'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HandHeart, Info, ShieldCheck } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import { pickName, type BirthDetails, type MilanReport } from '@/lib/kundali';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ChartStyle } from './kundali-chart';
import { KundaliReportBody } from './kundali-report';
import { ReportSection, type ReportT } from './report-kit';

/** Semi-circular gauge of gunas out of 36. */
function ScoreGauge({ score, label }: { score: number; label: string }) {
  const r = 80;
  const len = Math.PI * r;
  const frac = Math.max(0, Math.min(1, score / 36));
  return (
    <svg viewBox="0 0 200 116" className="w-full max-w-[15rem]" role="img" aria-label={label}>
      <path d="M20 100 A80 80 0 0 1 180 100" className="fill-none stroke-accent [stroke-width:14] [stroke-linecap:round]" />
      <path
        d="M20 100 A80 80 0 0 1 180 100"
        className="fill-none stroke-primary [stroke-width:14] [stroke-linecap:round]"
        strokeDasharray={`${len * frac} ${len}`}
      />
      <text x="100" y="86" textAnchor="middle" className="fill-heading font-heading text-[40px]">
        {score % 1 === 0 ? score : score.toFixed(1)}
      </text>
      <text x="100" y="108" textAnchor="middle" className="fill-muted-foreground text-[13px]">
        / 36
      </text>
    </svg>
  );
}

export function MilanReportBody({
  m,
  boy,
  girl,
  lang,
  t,
  chartStyle,
}: {
  m: MilanReport;
  boy: BirthDetails;
  girl: BirthDetails;
  lang: Locale;
  t: ReportT;
  chartStyle: ChartStyle;
}) {
  const n = (b: { en: string; hi: string }) => pickName(b, lang);
  const [who, setWho] = useState<'boy' | 'girl'>('boy');
  const doshas = m.kootas.filter((k) => k.dosha);
  const fmtPts = (x: number) => (x % 1 === 0 ? String(x) : x.toFixed(1));
  const manglikState = (level: 'none' | 'partial' | 'present') => t(`milan.manglikState.${level}`);

  return (
    <div className="grid grid-cols-1 gap-6">
      <section className="grid grid-cols-1 items-center gap-6 rounded-2xl border bg-card p-5 sm:grid-cols-[auto_1fr] sm:p-6 print:break-inside-avoid">
        <div className="mx-auto flex flex-col items-center">
          <p className="text-sm text-muted-foreground">{t('milan.scoreLabel')}</p>
          <ScoreGauge score={m.total} label={t('milan.score', { score: fmtPts(m.total) })} />
        </div>
        <div className="min-w-0">
          <h2 className="font-heading text-3xl leading-snug text-heading">{t(`milan.verdict.${m.verdict}`)}</h2>
          <p className="mt-2 text-lg">{t(`milan.verdictText.${m.verdict}`)}</p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                ['milan.table.boy', boy.name, m.boy],
                ['milan.table.girl', girl.name, m.girl],
              ] as const
            ).map(([label, name, moon]) => (
              <div key={label} className="rounded-xl bg-accent/40 px-4 py-3">
                <dt className="text-sm text-muted-foreground">
                  {t(label)} · {name}
                </dt>
                <dd className="font-medium">
                  {t('milan.moonValue', {
                    rashi: n(moon.rashi_name),
                    nakshatra: n(moon.nakshatra_name),
                    pada: moon.pada,
                  })}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <aside className="flex gap-3 rounded-2xl border border-diya/50 bg-chandan/60 p-4 sm:p-5 print:break-inside-avoid">
        <Info className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <p>{t('milan.disclaimer')}</p>
      </aside>

      <ReportSection title={t('milan.scoreLabel')}>
        <div className="-mx-2 overflow-x-auto px-2">
          <table className="w-full min-w-[34rem] text-left text-sm sm:text-base">
            <thead className="text-sm text-muted-foreground">
              <tr className="border-b">
                <th scope="col" className="py-2 pr-3 font-medium">{t('milan.table.koota')}</th>
                <th scope="col" className="py-2 pr-3 font-medium">{t('milan.table.boy')}</th>
                <th scope="col" className="py-2 pr-3 font-medium">{t('milan.table.girl')}</th>
                <th scope="col" className="py-2 text-right font-medium">{t('milan.table.points')}</th>
              </tr>
            </thead>
            <tbody>
              {m.kootas.map((k) => (
                <tr key={k.key} className="border-b border-border/60 align-top">
                  <th scope="row" className="py-2.5 pr-3 font-normal">
                    <span className="block font-medium">{t(`koota.${k.key}`)}</span>
                    <span className="block text-sm text-muted-foreground">{t(`kootaAbout.${k.key}`)}</span>
                    {k.dosha && (
                      <span
                        className={cn(
                          'mt-1 inline-block rounded-full px-2 py-0.5 text-xs',
                          k.cancelled ? 'bg-tulsi/15 text-tulsi' : 'bg-primary/10 text-primary',
                        )}
                      >
                        {k.cancelled ? t('milan.cancelled') : t('milan.dosha')}
                      </span>
                    )}
                  </th>
                  <td className="py-2.5 pr-3">{n(k.boy)}</td>
                  <td className="py-2.5 pr-3">{n(k.girl)}</td>
                  <td className="py-2.5 text-right tabular-nums">
                    <span className="font-medium">{fmtPts(k.score)}</span>
                    <span className="text-muted-foreground"> / {k.max}</span>
                    <span aria-hidden="true" className="mt-1 ml-auto block h-1.5 w-16 overflow-hidden rounded-full bg-accent">
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${(k.score / k.max) * 100}%` }} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={3} className="pt-3 text-right font-medium">
                  {t('milan.scoreLabel')}
                </th>
                <td className="pt-3 text-right font-heading text-xl text-heading tabular-nums">
                  {t('milan.score', { score: fmtPts(m.total) })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </ReportSection>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ReportSection title={t('milan.doshaTitle')}>
          {doshas.length === 0 ? (
            <p className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-tulsi" aria-hidden="true" />
              {t('milan.noDosha')}
            </p>
          ) : (
            <ul className="grid gap-3">
              {doshas.map((k) => (
                <li key={k.key} className="rounded-xl border px-4 py-3">
                  <p className="font-medium">{t(`milan.${k.key as 'nadi' | 'bhakoot' | 'gana'}Dosha`)}</p>
                  {k.cancelled && (
                    <p className="mt-1 text-tulsi">
                      {t(`milan.parihar${k.key === 'nadi' ? 'Nadi' : k.key === 'bhakoot' ? 'Bhakoot' : 'Gana'}`)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </ReportSection>

        <ReportSection title={t('milan.manglikTitle')}>
          <ul className="mb-3 grid gap-1">
            <li>{t('milan.manglikBoy', { state: manglikState(m.manglik.boy.level) })}</li>
            <li>{t('milan.manglikGirl', { state: manglikState(m.manglik.girl.level) })}</li>
          </ul>
          <p className="font-medium">{t(`milan.manglik.${m.manglik.match}`)}</p>
        </ReportSection>
      </div>

      <section className="flex flex-col gap-4 rounded-2xl sandhya p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 print:hidden">
        <div className="flex gap-3">
          <HandHeart className="mt-1 size-6 shrink-0 text-diya" aria-hidden="true" />
          <div>
            <h2 className="font-heading text-2xl">{t('milan.cta')}</h2>
            <p className="mt-1">{t('milan.ctaText')}</p>
          </div>
        </div>
        <Button size="lg" className="shrink-0" render={<Link href="/browse" />} nativeButton={false}>
          {t('milan.cta')}
        </Button>
      </section>

      <section aria-labelledby="milan-charts" className="grid grid-cols-1 gap-4">
        <h2 id="milan-charts" className="font-heading text-2xl text-heading">
          {t('milan.charts')}
        </h2>
        <div role="group" aria-label={t('milan.charts')} className="flex flex-wrap gap-2 print:hidden">
          {(['boy', 'girl'] as const).map((w) => (
            <Button key={w} variant={who === w ? 'default' : 'outline'} aria-pressed={who === w} onClick={() => setWho(w)}>
              {w === 'boy' ? t('milan.showBoy') : t('milan.showGirl')} · {w === 'boy' ? boy.name : girl.name}
            </Button>
          ))}
        </div>
        {/* Both charts print; on screen one at a time. */}
        {(['boy', 'girl'] as const).map((w) => (
          <div key={w} className={cn(who !== w && 'hidden print:block')}>
            <h3 className="mb-3 hidden font-heading text-xl print:block">
              {w === 'boy' ? t('milan.showBoy') : t('milan.showGirl')} · {w === 'boy' ? boy.name : girl.name}
            </h3>
            <KundaliReportBody
              k={w === 'boy' ? m.boy_kundali : m.girl_kundali}
              person={w === 'boy' ? boy : girl}
              lang={lang}
              t={t}
              chartStyle={chartStyle}
            />
          </div>
        ))}
      </section>
    </div>
  );
}
