'use client';

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { CircleAlert, Flower2, HandHeart, ShieldCheck, Sparkles } from 'lucide-react';
import { INTL_LOCALE, type Locale } from '@/i18n/config';
import { displayName, dms, pickName, type BirthDetails, type DashaPeriod, type GrahaKey, type Kundali, type VargaKey } from '@/lib/kundali';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
  vargaChartData,
  type ChartKind,
  type ReportT,
} from './report-kit';

const CHARTS: ChartKind[] = ['lagna', 'navamsa', 'chandra'];
const VARGAS: VargaKey[] = ['d2', 'd3', 'd7', 'd10', 'd12'];
const SECTIONS = ['basic', 'charts', 'grahas', 'bhavas', 'doshas', 'yogas', 'dasha', 'shani', 'shubh'] as const;
type Section = (typeof SECTIONS)[number];

const within = (p: { start: string; end: string }, now: number) => Date.parse(p.start) <= now && now < Date.parse(p.end);

type Ctx = {
  k: Kundali;
  person: BirthDetails;
  lang: Locale;
  t: ReportT;
  chartStyle: ChartStyle;
  now: number;
  n: (b: { en: string; hi: string }) => string;
  grahaName: (key: GrahaKey) => string;
  grahaList: (keys: GrahaKey[]) => string;
  ord: (h: number) => string;
};

/**
 * The full janam kundali. On screen one section shows at a time (chosen from the tabs);
 * the printed PDF carries every section, one after another.
 */
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
  const id = useId();
  const [section, setSection] = useState<Section>('basic');
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const now = useNow(60_000);
  const n = (b: { en: string; hi: string }) => pickName(b, lang);
  const grahaName = (key: GrahaKey) => n(k.grahas.find((g) => g.key === key)!.name);
  const list = new Intl.ListFormat(INTL_LOCALE[lang], { type: 'conjunction' });
  const ctx: Ctx = {
    k,
    person,
    lang,
    t,
    chartStyle,
    now,
    n,
    grahaName,
    grahaList: (keys) => list.format(keys.map(grahaName)),
    ord: (h) => t(`ordinal.${h}` as Parameters<ReportT>[0]),
  };

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = SECTIONS.indexOf(section);
    const j =
      e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? SECTIONS.length - 1 : null;
    if (j === null) return;
    e.preventDefault();
    const next = (j + SECTIONS.length) % SECTIONS.length;
    setSection(SECTIONS[next]);
    tabs.current[next]?.focus();
  };

  const panels: Record<Section, ReactNode> = {
    basic: <BasicPanel {...ctx} />,
    charts: <ChartsPanel {...ctx} />,
    grahas: <GrahasPanel {...ctx} />,
    bhavas: <BhavasPanel {...ctx} />,
    doshas: <DoshasPanel {...ctx} />,
    yogas: <YogasPanel {...ctx} />,
    dasha: <DashaPanel {...ctx} />,
    shani: <ShaniPanel {...ctx} />,
    shubh: <ShubhPanel {...ctx} />,
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="grid min-w-0 gap-2 print:hidden">
        <div
          role="tablist"
          aria-label={t('section.nav')}
          onKeyDown={onTabKey}
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]"
        >
          {SECTIONS.map((s, i) => (
            <button
              key={s}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              id={`${id}-tab-${s}`}
              type="button"
              role="tab"
              aria-selected={section === s}
              aria-controls={`${id}-panel-${s}`}
              tabIndex={section === s ? 0 : -1}
              onClick={() => setSection(s)}
              className={cn(
                'min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                section === s ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted',
              )}
            >
              {t(`section.${s}`)}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{t('section.printAll')}</p>
      </div>

      {SECTIONS.map((s) => (
        <div
          key={s}
          id={`${id}-panel-${s}`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${s}`}
          // Printed as plain blocks: Chromium splits grid containers across pages badly.
          className={cn(
            'min-w-0 grid-cols-1 gap-6 print:block print:space-y-6',
            section === s ? 'grid' : 'hidden',
          )}
        >
          {panels[s]}
        </div>
      ))}
    </div>
  );
}

// ── Birth & panchang ───────────────────────────────────────────────────────

function BasicPanel({ k, person, lang, t, n }: Ctx) {
  const tz = k.birth.tz;
  const p = k.panchang;
  const a = k.avakahada;
  return (
    <>
      <ReportSection title={t('birth.title')}>
        <Facts
          rows={[
            [
              t('birth.name'),
              person.name
                ? person.newborn
                  ? t('birth.nameNewbornWith', { name: displayName(person, lang) })
                  : displayName(person, lang)
                : t('birth.nameNewborn'),
            ],
            [t('birth.gender'), t(`gender.${person.gender}`)],
            [t('birth.date'), fmtCivilDate(person.date, lang)],
            [t('birth.time'), fmtWallTime(person.time, lang)],
            [t('birth.place'), person.place.label],
            [t('birth.coords'), `${k.birth.lat.toFixed(4)}°, ${k.birth.lng.toFixed(4)}°`],
            [t('birth.zone'), `${tz} (${utcOffset(k.birth.utc_offset_minutes)})`],
            [t('birth.ayanamsa'), dms(k.ayanamsa)],
          ]}
        />
      </ReportSection>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 print:block print:space-y-6">
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
          <div className="mt-4 rounded-xl bg-accent/40 px-4 py-3 print:break-inside-avoid">
            <p className="text-sm text-muted-foreground">{t('avakahada.namakshar')}</p>
            <p lang="hi" className="font-heading text-3xl text-heading">
              {a.namakshar}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('avakahada.namaksharAll', { letters: a.namakshar_all.join(', ') })}
            </p>
            {person.newborn && <p className="mt-2">{t('newborn.namakshar', { letter: a.namakshar })}</p>}
          </div>
        </ReportSection>
      </div>

      <PayaSection {...{ k, t, n }} />
    </>
  );
}

function PayaSection({ k, t, n }: Pick<Ctx, 'k' | 't' | 'n'>) {
  const a = k.avakahada;
  return (
    <ReportSection title={t('paya.title')}>
      <p className="mb-4 text-muted-foreground">{t('paya.about')}</p>
      <dl className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ['paya.byNakshatra', a.paya_nakshatra],
            ['paya.byMoon', a.paya],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-xl border border-diya/50 bg-chandan/40 px-4 py-3 print:break-inside-avoid">
            <dt className="text-sm text-muted-foreground">{t(label)}</dt>
            <dd className="font-heading text-2xl text-heading">{n(value)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-muted-foreground">{t('paya.note')}</p>
    </ReportSection>
  );
}

// ── Charts ─────────────────────────────────────────────────────────────────

function ChartsPanel({ k, lang, t, chartStyle }: Ctx) {
  const [varga, setVarga] = useState<VargaKey>('d10');
  const chart = (title: string, data: ReturnType<typeof chartData>, key: string) => (
    <KundaliChart
      key={key}
      style={chartStyle}
      lagnaSign={data.lagnaSign}
      placements={data.placements}
      signShort={RASHI_NAMES[lang]}
      title={title}
      ariaLabel={t('charts.aria', {
        chart: title,
        summary: data.placements.map((pl) => `${pl.label} ${RASHI_NAMES[lang][pl.sign]}`).join(', '),
      })}
    />
  );
  return (
    <>
      <ReportSection title={t('charts.title')}>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3">
          {CHARTS.map((kind) => chart(t(`charts.${kind}`), chartData(k, kind, lang), kind))}
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {chartStyle === 'north' ? t('charts.legend') : t('charts.legendSouth')}
        </p>
      </ReportSection>

      <ReportSection title={t('charts.aboutTitle')}>
        <div className="grid gap-2">
          <p>{t('charts.about')}</p>
          <p>{chartStyle === 'north' ? t('charts.aboutNorth') : t('charts.aboutSouth')}</p>
          <p>{t('charts.aboutThree')}</p>
        </div>
      </ReportSection>

      <ReportSection title={t('charts.vargas')}>
        <p className="mb-3 text-muted-foreground print:hidden">{t('charts.vargasAbout')}</p>
        <div role="group" aria-label={t('charts.vargas')} className="mb-5 flex flex-wrap gap-2 print:hidden">
          {VARGAS.map((v) => (
            <Button key={v} size="sm" variant={varga === v ? 'default' : 'outline'} aria-pressed={varga === v} onClick={() => setVarga(v)}>
              {t(`varga.${v}`)}
            </Button>
          ))}
        </div>
        <div className="grid gap-8 sm:grid-cols-2 print:grid-cols-3">
          {VARGAS.map((v) => (
            <div key={v} className={cn('grid content-start gap-2', varga !== v && 'hidden print:grid')}>
              {chart(t(`varga.${v}`), vargaChartData(k, v, lang), v)}
              <p className="text-center text-sm text-muted-foreground">{t(`vargaAbout.${v}`)}</p>
            </div>
          ))}
        </div>
      </ReportSection>
    </>
  );
}

// ── Grahas ─────────────────────────────────────────────────────────────────

function GrahasPanel({ k, t, n }: Ctx) {
  const graha = (key: string) => k.grahas.find((g) => g.key === key)!;
  return (
    <>
      <ReportSection title={t('grahas.title')}>
        <p className="mb-3 text-sm text-muted-foreground">{t('grahas.about')}</p>
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

      <ReportSection title={t('grahas.karakaTitle')}>
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {k.grahas.map((g) => (
            <div key={g.key} className="flex gap-2 border-b border-border/60 pb-2">
              <dt className="w-20 shrink-0 font-medium">{n(g.name)}</dt>
              <dd className="text-muted-foreground">{t(`karaka.${g.key}`)}</dd>
            </div>
          ))}
        </dl>
      </ReportSection>
    </>
  );
}

// ── Bhavas ─────────────────────────────────────────────────────────────────

function BhavasPanel({ k, lang, t, grahaName, ord }: Ctx) {
  return (
    <ReportSection title={t('bhavas.title')}>
      <p className="mb-3 text-muted-foreground">{t('bhavas.about')}</p>
      <div className="-mx-2 overflow-x-auto px-2">
        <table className="w-full min-w-[40rem] text-left text-sm sm:text-base">
          <thead className="text-sm text-muted-foreground">
            <tr className="border-b">
              <th scope="col" className="py-2 pr-3 font-medium">{t('bhavas.house')}</th>
              <th scope="col" className="py-2 pr-3 font-medium">{t('bhavas.rashi')}</th>
              <th scope="col" className="py-2 pr-3 font-medium">{t('bhavas.lord')}</th>
              <th scope="col" className="py-2 pr-3 font-medium">{t('bhavas.lordIn')}</th>
              <th scope="col" className="py-2 pr-3 font-medium">{t('bhavas.grahas')}</th>
              <th scope="col" className="py-2 font-medium">{t('bhavas.meaning')}</th>
            </tr>
          </thead>
          <tbody>
            {k.bhavas.map((b) => (
              <tr key={b.house} className={cn('border-b border-border/60 align-top', b.house === 1 && 'bg-accent/30')}>
                <th scope="row" className="py-2 pr-3 font-medium whitespace-nowrap">
                  {ord(b.house)}
                </th>
                <td className="py-2 pr-3">{RASHI_NAMES[lang][b.sign]}</td>
                <td className="py-2 pr-3">{grahaName(b.lord)}</td>
                <td className="py-2 pr-3 whitespace-nowrap">{t('bhavas.lordInValue', { house: ord(b.lord_house) })}</td>
                <td className="py-2 pr-3">{b.grahas.map(grahaName).join(', ') || '—'}</td>
                <td className="py-2 text-muted-foreground">{t(`bhava.${b.house}` as Parameters<ReportT>[0])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ReportSection>
  );
}

// ── Doshas ─────────────────────────────────────────────────────────────────

function DoshasPanel(ctx: Ctx) {
  const { k, t, n, grahaList, ord } = ctx;
  const present = k.doshas.filter((d) => d.present);
  return (
    <>
      <ReportSection title={t('doshas.title')}>
        <p className="mb-3 text-muted-foreground">{t('doshas.about')}</p>
        <div className="-mx-2 overflow-x-auto px-2">
          <table className="w-full min-w-[30rem] text-left text-sm sm:text-base">
            <thead className="text-sm text-muted-foreground">
              <tr className="border-b">
                <th scope="col" className="py-2 pr-3 font-medium">{t('doshas.dosha')}</th>
                <th scope="col" className="py-2 text-right font-medium">{t('doshas.status')}</th>
              </tr>
            </thead>
            <tbody>
              {k.doshas.map((d) => (
                <tr key={d.key} className="border-b border-border/60 align-top">
                  <th scope="row" className="py-2.5 pr-3 font-normal">
                    <span className="block font-medium">{t(`dosha.${d.key}`)}</span>
                    <span className="block text-sm text-muted-foreground">{t(`doshaRule.${d.key}`)}</span>
                  </th>
                  <td className="py-2.5 text-right">
                    <span
                      className={cn(
                        'inline-block rounded-full px-3 py-0.5 text-sm font-medium whitespace-nowrap',
                        !d.present ? 'bg-tulsi/15 text-tulsi' : d.cancelled ? 'bg-diya/20 text-heading' : 'bg-primary/10 text-primary',
                      )}
                    >
                      {!d.present ? t('doshas.no') : d.cancelled ? t('doshas.withParihar') : t('doshas.yes')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{t('doshas.note')}</p>
      </ReportSection>

      <ReportSection title={t('doshas.detailsTitle')}>
        {present.length === 0 ? (
          <p className="flex gap-2">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-tulsi" aria-hidden="true" />
            {t('doshas.none')}
          </p>
        ) : (
          <ul className="grid gap-3">
            {present.map((d) => (
              <li key={d.key} className="grid gap-1 rounded-xl border px-4 py-3 print:break-inside-avoid">
                <p className="flex items-center gap-2 font-medium">
                  <CircleAlert className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  {t(`dosha.${d.key}`)}
                </p>
                {d.key === 'kaal_sarp' && d.kind && d.house ? (
                  <p>{t('doshas.kaalSarpKind', { kind: n(d.kind), house: ord(d.house) })}</p>
                ) : (
                  d.house &&
                  d.key !== 'kemadruma' &&
                  d.key !== 'mangal' && <p>{t('doshas.formed', { house: ord(d.house), grahas: grahaList(d.grahas) })}</p>
                )}
                {d.key === 'kemadruma' && d.cancelled && <p className="text-tulsi">{t('doshas.kemadrumaCancelled')}</p>}
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">{t('doshas.remedyLabel')}:</span> {t(`doshaRemedy.${d.key}`)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </ReportSection>

      <ManglikSection {...ctx} />

      {present.length > 0 && (
        <section className="flex flex-col gap-4 rounded-2xl sandhya p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 print:hidden">
          <div className="flex gap-3">
            <HandHeart className="mt-1 size-6 shrink-0 text-diya" aria-hidden="true" />
            <div>
              <h2 className="font-heading text-2xl">{t('doshas.cta')}</h2>
              <p className="mt-1">{t('doshas.ctaText')}</p>
            </div>
          </div>
          <Button size="lg" className="shrink-0" render={<Link href="/browse" />} nativeButton={false}>
            {t('doshas.cta')}
          </Button>
        </section>
      )}
    </>
  );
}

function ManglikSection({ k, t, ord }: Ctx) {
  const m = k.manglik;
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

// ── Yogas ──────────────────────────────────────────────────────────────────

function YogasPanel({ k, t, grahaList, ord }: Ctx) {
  return (
    <ReportSection title={t('yogas.title')}>
      <p className="mb-4 text-muted-foreground">{t('yogas.about')}</p>
      {k.yogas.length === 0 ? (
        <p>{t('yogas.none')}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {k.yogas.map((y) => (
            <li
              key={y.key}
              className="grid content-start gap-1 rounded-xl border border-diya/50 bg-chandan/40 px-4 py-3 print:break-inside-avoid"
            >
              <p className="flex items-center gap-2 font-heading text-xl text-heading">
                <Flower2 className="size-5 shrink-0 text-primary" aria-hidden="true" />
                {t(`yoga.${y.key}`)}
              </p>
              <p>{t(`yogaAbout.${y.key}`)}</p>
              <p className="text-sm text-muted-foreground">{t('yogas.formed', { house: ord(y.house), grahas: grahaList(y.grahas) })}</p>
            </li>
          ))}
        </ul>
      )}
    </ReportSection>
  );
}

// ── Dasha ──────────────────────────────────────────────────────────────────

function DashaPanel({ k, lang, t, n, now, grahaName }: Ctx) {
  const tz = k.birth.tz;
  const short = (key: GrahaKey) => n(k.grahas.find((g) => g.key === key)!.short);
  const span = (p: DashaPeriod) => `${fmtDate(p.start, lang, tz)} – ${fmtDate(p.end, lang, tz)}`;
  const balanceYears = Math.floor(k.dasha.balance_years);
  const balanceMonths = Math.floor((k.dasha.balance_years - balanceYears) * 12);
  const md = k.dasha.mahadashas.find((p) => within(p, now));
  const ad = md?.antardashas.find((p) => within(p, now));
  const pd = ad?.pratyantardashas.find((p) => within(p, now));

  return (
    <>
      <ReportSection title={t('dasha.title')}>
        <p className="mb-3 text-muted-foreground">{t('dasha.about')}</p>
        <p className="mb-4">
          {t('dasha.balance', { lord: grahaName(k.dasha.birth_lord), years: balanceYears, months: balanceMonths })}
        </p>
        {md && ad && pd && (
          <div className="grid gap-2 rounded-xl border border-primary bg-accent/40 px-4 py-3 print:break-inside-avoid">
            <p className="text-sm text-muted-foreground">{t('dasha.nowTitle')}</p>
            <p className="font-heading text-xl text-heading">
              {t('dasha.nowLine', { md: grahaName(md.lord), ad: grahaName(ad.lord), pd: grahaName(pd.lord) })}
            </p>
            <p className="text-sm text-muted-foreground">
              {grahaName(md.lord)}: {t('dasha.until', { date: fmtDate(md.end, lang, tz) })} · {grahaName(ad.lord)}:{' '}
              {t('dasha.until', { date: fmtDate(ad.end, lang, tz) })}
            </p>
            <p>{t(`dashaAbout.${md.lord}`)}</p>
          </div>
        )}
      </ReportSection>

      <ReportSection title={t('dasha.periodsTitle')}>
        <p className="mb-3 hidden text-sm text-muted-foreground print:block">{t('dasha.printNote')}</p>
        <ol className="grid gap-2">
          {k.dasha.mahadashas.map((m) => {
            const current = m === md;
            return (
              <li
                key={m.start}
                className={cn(
                  'rounded-xl border',
                  // The running mahadasha lists every pratyantar and runs past a page: on paper each
                  // part gets its own closed border. Every other mahadasha stays on one page.
                  current ? 'border-primary bg-accent/40 print:box-decoration-clone' : 'print:break-inside-avoid',
                )}
              >
                <details open={current} className="group">
                  <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 [&::-webkit-details-marker]:hidden">
                    <span className="font-medium">
                      {grahaName(m.lord)} {t('dasha.mahadasha')}
                      {current && (
                        <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                          {t('dasha.current')}
                        </span>
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground tabular-nums">{span(m)}</span>
                  </summary>
                  <div className="border-t px-4 py-3">
                    <p className="mb-2 text-sm">{t(`dashaAbout.${m.lord}`)}</p>
                    <p className="mb-2 text-sm text-muted-foreground">{t('dasha.antardashas')}</p>
                    {/* On paper, other mahadashas list antardashas in two columns so two fit on a page. */}
                    <ul className={cn('grid gap-1 text-sm', !current && 'print:grid-cols-2 print:gap-x-6')}>
                      {m.antardashas.map((a) => {
                        const running = a === ad;
                        return (
                          <li key={a.start} className={cn('rounded-md', running && 'bg-accent font-medium')}>
                            {/* Pratyantar lists print only for the running mahadasha, to keep the PDF readable. */}
                            <details open={running} data-print-skip={current ? undefined : ''}>
                              <summary className="flex min-h-9 cursor-pointer list-none justify-between gap-3 px-2 py-1 print:min-h-0 [&::-webkit-details-marker]:hidden">
                                <span>
                                  {short(m.lord)}–{grahaName(a.lord)}
                                </span>
                                <span className="text-muted-foreground tabular-nums">{span(a)}</span>
                              </summary>
                              <div className="px-2 pt-1 pb-2">
                                <p className="mb-1 text-xs text-muted-foreground">{t('dasha.pratyantar')}</p>
                                <ul className="grid gap-x-4 gap-y-0.5 text-xs font-normal sm:grid-cols-2 print:grid-cols-3">
                                  {a.pratyantardashas.map((p) => (
                                    <li
                                      key={p.start}
                                      className={cn(
                                        'flex justify-between gap-2 rounded px-1.5 py-0.5',
                                        within(p, now) && 'bg-primary/10 font-medium',
                                      )}
                                    >
                                      <span>
                                        {short(m.lord)}–{short(a.lord)}–{grahaName(p.lord)}
                                      </span>
                                      <span className="text-muted-foreground tabular-nums">{fmtDate(p.end, lang, tz)}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </details>
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
        <p className="mt-3 text-sm text-muted-foreground print:hidden">{t('dasha.printNote')}</p>
      </ReportSection>
    </>
  );
}

// ── Shani Sade Sati / Dhaiya ───────────────────────────────────────────────

function ShaniPanel({ k, lang, t, now }: Ctx) {
  const tz = k.birth.tz;
  const current = k.shani.find((p) => within(p, now));
  const next = k.shani.find((p) => Date.parse(p.start) > now);
  const phaseNow = current?.phases.find((p) => within(p, now));
  return (
    <ReportSection title={t('shani.title')}>
      <p className="mb-4 text-muted-foreground">{t('shani.about')}</p>
      <div className={cn('mb-4 grid gap-1 rounded-xl px-4 py-3 print:break-inside-avoid', current ? 'border border-primary bg-accent/40' : 'bg-tulsi/10')}>
        {current ? (
          <>
            <p className="font-medium">
              {t('shani.current', { kind: t(`shani.kind.${current.kind}`), date: fmtDate(current.end, lang, tz) })}
            </p>
            {phaseNow && <p>{t('shani.currentPhase', { phase: t(`shani.phase.${phaseNow.phase}`) })}</p>}
          </>
        ) : (
          <p className="font-medium">{t('shani.none')}</p>
        )}
        {next && (
          <p className="text-sm text-muted-foreground">
            {t('shani.next', { kind: t(`shani.kind.${next.kind}`), date: fmtDate(next.start, lang, tz) })}
          </p>
        )}
      </div>
      <div className="-mx-2 overflow-x-auto px-2">
        <table className="w-full min-w-[30rem] text-left text-sm sm:text-base">
          <thead className="text-sm text-muted-foreground">
            <tr className="border-b">
              <th scope="col" className="py-2 pr-3 font-medium">{t('shani.table.kind')}</th>
              <th scope="col" className="py-2 pr-3 font-medium">{t('shani.table.from')}</th>
              <th scope="col" className="py-2 font-medium">{t('shani.table.to')}</th>
            </tr>
          </thead>
          <tbody>
            {k.shani.map((p) => (
              <tr key={p.start} className={cn('border-b border-border/60 align-top', p === current && 'bg-accent/40')}>
                <th scope="row" className="py-2 pr-3 font-normal">
                  <span className="block font-medium">{t(`shani.kind.${p.kind}`)}</span>
                  {p.phases.length > 0 && (
                    <span className="block text-xs text-muted-foreground">
                      {p.phases.map((ph) => `${t(`shani.phase.${ph.phase}`)}: ${fmtDate(ph.start, lang, tz)}`).join(' · ')}
                    </span>
                  )}
                </th>
                <td className="py-2 pr-3 whitespace-nowrap tabular-nums">{fmtDate(p.start, lang, tz)}</td>
                <td className="py-2 whitespace-nowrap tabular-nums">{fmtDate(p.end, lang, tz)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4">{t('shani.remedy')}</p>
    </ReportSection>
  );
}

// ── Shubh ──────────────────────────────────────────────────────────────────

function ShubhPanel({ k, t, n, grahaName }: Ctx) {
  const s = k.shubh;
  return (
    <ReportSection title={t('shubh.title')}>
      <p className="mb-4 text-muted-foreground">
        {t('shubh.about', { lord: grahaName(s.rashi_lord), lagnaLord: grahaName(s.lagna_lord) })}
      </p>
      <Facts
        rows={[
          [t('shubh.ank'), String(s.ank)],
          [t('shubh.moolank'), String(s.moolank)],
          [t('shubh.bhagyank'), String(s.bhagyank)],
          [t('shubh.vaar'), n(s.vaar)],
          [t('shubh.rang'), n(s.rang)],
          [t('shubh.dhatu'), n(s.dhatu)],
          [t('shubh.devta'), n(s.devta)],
          [t('shubh.disha'), n(s.disha)],
          [t('shubh.ratna'), n(s.ratna)],
        ]}
      />
      <div className="mt-4 grid gap-1 text-sm text-muted-foreground">
        <p>{t('shubh.ratnaNote')}</p>
        <p>{t('shubh.numerologyNote')}</p>
      </div>
    </ReportSection>
  );
}
