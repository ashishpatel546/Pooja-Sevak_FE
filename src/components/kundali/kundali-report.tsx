'use client';

import { CircleAlert, Sparkles } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import { dms, pickName, type BirthDetails, type Kundali } from '@/lib/kundali';
import { cn } from '@/lib/utils';
import { useNow } from '@/components/customer/use-api';
import { KundaliChart, type ChartStyle } from './kundali-chart';
import {
  chartData,
  Facts,
  fmtCivilDate,
  fmtDate,
  fmtTime,
  fmtWallTime,
  RASHI_NAMES,
  ReportSection,
  utcOffset,
  type ChartKind,
  type ReportT,
} from './report-kit';

const CHARTS: ChartKind[] = ['lagna', 'navamsa', 'chandra'];

export function KundaliReportBody({
  k,
  person,
  lang,
  t,
  chartStyle,
}: {
  k: Kundali;
  person: BirthDetails;
  lang: Locale;
  t: ReportT;
  chartStyle: ChartStyle;
}) {
  const n = (b: { en: string; hi: string }) => pickName(b, lang);
  const tz = k.birth.tz;
  const graha = (key: string) => k.grahas.find((g) => g.key === key)!;
  const p = k.panchang;
  const a = k.avakahada;
  const now = useNow(60_000);
  const balanceYears = Math.floor(k.dasha.balance_years);
  const balanceMonths = Math.floor((k.dasha.balance_years - balanceYears) * 12);

  return (
    <div className="grid grid-cols-1 gap-6">
      <ReportSection title={t('birth.title')}>
        <Facts
          rows={[
            [t('birth.date'), fmtCivilDate(person.date, lang)],
            [t('birth.time'), fmtWallTime(person.time, lang)],
            [t('birth.place'), person.place.label],
            [t('birth.coords'), `${k.birth.lat.toFixed(4)}°, ${k.birth.lng.toFixed(4)}°`],
            [t('birth.zone'), `${tz} (${utcOffset(k.birth.utc_offset_minutes)})`],
            [t('birth.ayanamsa'), dms(k.ayanamsa)],
          ]}
        />
      </ReportSection>

      <ReportSection title={t('charts.title')}>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3">
          {CHARTS.map((kind) => {
            const { lagnaSign, placements } = chartData(k, kind, lang);
            const title = t(`charts.${kind}`);
            const summary = placements
              .map((pl) => `${pl.label} ${RASHI_NAMES[lang][pl.sign]}`)
              .join(', ');
            return (
              <KundaliChart
                key={kind}
                style={chartStyle}
                lagnaSign={lagnaSign}
                placements={placements}
                signShort={RASHI_NAMES[lang]}
                title={title}
                ariaLabel={t('charts.aria', { chart: title, summary })}
              />
            );
          })}
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {chartStyle === 'north' ? t('charts.legend') : t('charts.legendSouth')}
        </p>
      </ReportSection>

      <ReportSection title={t('grahas.title')}>
        <div className="-mx-2 overflow-x-auto px-2">
          <table className="w-full min-w-[34rem] text-left text-sm sm:text-base">
            <thead className="text-sm text-muted-foreground">
              <tr className="border-b">
                <th scope="col" className="py-2 pr-3 font-medium">{t('grahas.graha')}</th>
                <th scope="col" className="py-2 pr-3 font-medium">{t('grahas.rashi')}</th>
                <th scope="col" className="py-2 pr-3 font-medium">{t('grahas.degree')}</th>
                <th scope="col" className="py-2 pr-3 font-medium">{t('grahas.nakshatra')}</th>
                <th scope="col" className="py-2 pr-3 text-center font-medium">{t('grahas.house')}</th>
                <th scope="col" className="py-2 font-medium">{t('grahas.state')}</th>
              </tr>
            </thead>
            <tbody>
              {[{ key: 'la' as const }, ...k.grahas].map((row) => {
                const isLagna = row.key === 'la';
                const pt = isLagna ? k.lagna : graha(row.key);
                const g = isLagna ? null : graha(row.key);
                const state = g
                  ? [
                      g.dignity_name && n(g.dignity_name),
                      g.retrograde && g.key !== 'ra' && g.key !== 'ke' ? t('grahas.retro') : null,
                      g.combust ? t('grahas.combust') : null,
                    ].filter(Boolean)
                  : [];
                return (
                  <tr key={row.key} className={cn('border-b border-border/60 align-top', isLagna && 'bg-accent/30')}>
                    <th scope="row" className="py-2 pr-3 font-medium">
                      {isLagna ? t('avakahada.lagna') : n(g!.name)}
                    </th>
                    <td className="py-2 pr-3">{n(pt.sign_name)}</td>
                    <td className="py-2 pr-3 tabular-nums">{dms(pt.degree)}</td>
                    <td className="py-2 pr-3">{t('panchang.pada', { nakshatra: n(pt.nakshatra_name), pada: pt.pada })}</td>
                    <td className="py-2 pr-3 text-center tabular-nums">{isLagna ? 1 : g!.house}</td>
                    <td className="py-2 text-muted-foreground">{state.join(' · ') || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ReportSection>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 print:grid-cols-1">
        <ReportSection title={t('panchang.title')}>
          <Facts
            rows={[
              [t('panchang.vaar'), n(p.vaar)],
              [t('panchang.tithi'), n(p.tithi_name)],
              [t('panchang.nakshatra'), t('panchang.pada', { nakshatra: n(p.nakshatra_name), pada: p.pada })],
              [t('panchang.yoga'), n(p.yoga)],
              [t('panchang.karana'), n(p.karana)],
              [t('panchang.month'), n(p.lunar_month)],
              [t('panchang.samvat'), String(p.vikram_samvat)],
              [t('panchang.sunrise'), p.sunrise ? fmtTime(p.sunrise, lang, tz) : '—'],
              [t('panchang.sunset'), p.sunset ? fmtTime(p.sunset, lang, tz) : '—'],
            ]}
          />
        </ReportSection>

        <ReportSection title={t('avakahada.title')}>
          <Facts
            rows={[
              [t('avakahada.rashi'), n(a.rashi)],
              [t('avakahada.rashiLord'), n(a.rashi_lord)],
              [t('avakahada.nakshatra'), t('panchang.pada', { nakshatra: n(a.nakshatra), pada: a.pada })],
              [t('avakahada.nakshatraLord'), n(a.nakshatra_lord)],
              [t('avakahada.lagna'), n(a.lagna)],
              [t('avakahada.lagnaLord'), n(a.lagna_lord)],
              [t('avakahada.varna'), n(a.varna)],
              [t('avakahada.vashya'), n(a.vashya)],
              [t('avakahada.yoni'), n(a.yoni)],
              [t('avakahada.gana'), n(a.gana)],
              [t('avakahada.nadi'), n(a.nadi)],
              [t('avakahada.tatva'), n(a.tatva)],
            ]}
          />
          <div className="mt-4 rounded-xl bg-accent/40 px-4 py-3">
            <p className="text-sm text-muted-foreground">{t('avakahada.namakshar')}</p>
            <p lang="hi" className="font-heading text-3xl text-heading">{a.namakshar}</p>
            <p className="text-sm text-muted-foreground">
              {t('avakahada.namaksharAll', { letters: a.namakshar_all.join(', ') })}
            </p>
          </div>
        </ReportSection>
      </div>

      <ManglikSection k={k} t={t} />

      <ReportSection title={t('dasha.title')}>
        <p className="mb-4">
          {t('dasha.balance', {
            lord: n(graha(k.dasha.birth_lord).name),
            years: balanceYears,
            months: balanceMonths,
          })}
        </p>
        <ol className="grid gap-2">
          {k.dasha.mahadashas.map((md) => {
            const current = Date.parse(md.start) <= now && now < Date.parse(md.end);
            return (
              <li key={md.start} className={cn('rounded-xl border', current && 'border-primary bg-accent/40')}>
                <details open={current} className="group">
                  <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 [&::-webkit-details-marker]:hidden">
                    <span className="font-medium">
                      {n(graha(md.lord).name)} {t('dasha.mahadasha')}
                      {current && (
                        <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                          {t('dasha.current')}
                        </span>
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {fmtDate(md.start, lang, tz)} – {fmtDate(md.end, lang, tz)}
                    </span>
                  </summary>
                  <div className="border-t px-4 py-3">
                    <p className="mb-2 text-sm text-muted-foreground">{t('dasha.antardashas')}</p>
                    <ul className="grid gap-1 text-sm sm:grid-cols-2">
                      {md.antardashas.map((ad) => {
                        const running = Date.parse(ad.start) <= now && now < Date.parse(ad.end);
                        return (
                          <li key={ad.start} className={cn('flex justify-between gap-3 rounded-md px-2 py-1', running && 'bg-accent font-medium')}>
                            <span>
                              {n(graha(md.lord).short)}–{n(graha(ad.lord).name)}
                            </span>
                            <span className="text-muted-foreground tabular-nums">
                              {fmtDate(ad.start, lang, tz)} – {fmtDate(ad.end, lang, tz)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </details>
              </li>
            );
          })}
        </ol>
      </ReportSection>
    </div>
  );
}

function ManglikSection({ k, t }: { k: Kundali; t: ReportT }) {
  const m = k.manglik;
  const ord = (h: number) => t(`ordinal.${h}` as Parameters<ReportT>[0]);
  const vars = { lagna: ord(m.house_from_lagna), moon: ord(m.house_from_moon) };
  const text =
    m.level === 'none'
      ? t('manglik.none')
      : m.from_lagna && m.from_moon
        ? t('manglik.present', vars)
        : m.from_lagna
          ? t('manglik.fromLagna', vars)
          : t('manglik.fromMoon', vars);
  const Icon = m.level === 'none' ? Sparkles : CircleAlert;
  return (
    <ReportSection title={t('manglik.title')}>
      <div className="flex gap-3">
        <Icon className={cn('mt-0.5 size-5 shrink-0', m.level === 'none' ? 'text-tulsi' : 'text-primary')} aria-hidden="true" />
        <div className="grid gap-2">
          <p className="font-medium">{text}</p>
          {m.mitigated && <p>{t('manglik.mitigated')}</p>}
          {m.level !== 'none' && <p className="text-muted-foreground">{t('manglik.advice')}</p>}
        </div>
      </div>
    </ReportSection>
  );
}
