'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { CalendarHeart, HandHeart, Home, Info, Sunrise } from 'lucide-react';
import { useLocale, useT } from '@/i18n';
import type { Locale } from '@/i18n/config';
import { INTL_LOCALE } from '@/i18n/config';
import { track } from '@/lib/analytics';
import { isBookableDate } from '@/lib/booking-date';
import type { MuhuratBlocked as Blocked, MuhuratDay, MuhuratKind as Kind, MuhuratSearch } from '@/lib/muhurat';
import { placeQuery, samePlace, type Place } from '@/lib/place';
import { MUHURAT_PUJA, type MuhuratTab } from '@/lib/tools';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApiQuery } from '@/components/customer/use-api';
import { TimePicker } from '@/components/kundali/time-picker';
import { fmtCivilDate, fmtTime } from '@/components/kundali/report-kit';
import { PlaceControl, PlaceSync } from '@/components/ritual/place-control';
import { usePlace, usePlaceName } from '@/components/ritual/use-place';
import { PushPrePrompt } from '@/components/notifications/push-preprompt';
import { ShareButtons } from '@/components/share/share-buttons';

type Bilingual = { en: string; hi: string };
type Iso = { start: string; end: string };

/** Dates fetched on the server for the first render (the visitor's cookie place, or the default). */
export type InitialDates = { kind: Kind; months: number; place: Place; data: MuhuratSearch };

type Choghadiya = 'udveg' | 'char' | 'labh' | 'amrit' | 'kaal' | 'shubh' | 'rog';
type DayMuhurat = {
  date: string;
  weekday: number;
  sunrise: string;
  sunset: string;
  tithi_name: Bilingual;
  nakshatra_name: Bilingual;
  lunar_month: Bilingual;
  rahu_kaal: Iso;
  yamaganda: Iso;
  gulika: Iso;
  abhijit: Iso | null;
  choghadiya: (Iso & { name: Choghadiya; good: boolean; night: boolean })[];
  best: Iso[];
  tithi_birthday: { tithi_name: Bilingual; lunar_month: Bilingual; date: string } | null;
};

const RANGES = [3, 6, 12] as const;

const pick = (b: Bilingual, lang: Locale) => (lang === 'hi' ? b.hi : b.en);

/** Civil date (YYYY-MM-DD) of an instant in a zone. */
function civil(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(iso));
}

function todayIn(tz: string): string {
  return civil(new Date().toISOString(), tz);
}

function weekdayName(date: string, lang: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[lang], { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}

function monthTitle(date: string, lang: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[lang], { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

/** "8:51 pm – 6:55 am (next day)" */
function TimeRange({ w, date, tz, lang }: { w: Iso; date: string; tz: string; lang: Locale }) {
  const t = useT('muhurat');
  return (
    <span className="tabular-nums">
      {fmtTime(w.start, lang, tz)} – {fmtTime(w.end, lang, tz)}
      {civil(w.end, tz) > date && <span className="text-muted-foreground"> {t('dates.nextDay')}</span>}
    </span>
  );
}

function Loading() {
  const t = useT('muhurat');
  return (
    <div className="grid gap-3" aria-busy="true">
      <p className="sr-only" role="status">
        {t('dates.loading')}
      </p>
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 rounded-2xl" />
      ))}
    </div>
  );
}

function Failed({ retry }: { retry: () => void }) {
  const t = useT('muhurat');
  return (
    <div className="rounded-2xl border bg-card p-6 text-center">
      <p>{t('dates.error')}</p>
      <Button className="mt-4" onClick={retry}>
        {t('dates.retry')}
      </Button>
    </div>
  );
}

// ───────────────────────── dates (vivah, griha pravesh) ─────────────────────────

type Row = { kind: 'day'; date: string; day: MuhuratDay } | { kind: 'blocked'; date: string; b: Blocked };

function DateList({ kind, place, initial }: { kind: Kind; place: Place; initial?: InitialDates | null }) {
  const t = useT('muhurat');
  const tt = useT('tools');
  const name = usePlaceName();
  const { locale: lang } = useLocale();
  const [months, setMonths] = useState<(typeof RANGES)[number]>(6);
  // Server-rendered dates stand in for the first query when they answer the same question.
  const seeded = initial && initial.kind === kind && initial.months === months && samePlace(initial.place, place) ? initial.data : null;
  const fetched = useApiQuery<MuhuratSearch>(seeded ? null : '/muhurat/dates', { query: { kind, months, ...placeQuery(place) } });
  const q = seeded ? { ...fetched, data: seeded, error: undefined } : fetched;
  const pujaSlug = MUHURAT_PUJA[kind];
  const changeMonths = (m: (typeof RANGES)[number]) => {
    setMonths(m);
    track('tool_submit', { tool: 'muhurat', kind });
  };
  const shareText = q.data?.days.length
    ? tt('share.muhuratText', {
        kind: tt(`share.kind.${kind}`),
        place: name(place),
        dates: q.data.days
          .slice(0, 5)
          .map((d) => fmtCivilDate(d.date, lang))
          .join(', '),
      })
    : null;

  // Dates and whole blocked periods in one timeline, grouped by month.
  const rows: Row[] = q.data
    ? [
        ...q.data.days.map((day) => ({ kind: 'day' as const, date: day.date, day })),
        ...q.data.blocked.map((b) => ({ kind: 'blocked' as const, date: b.from, b })),
      ].sort((a, b) => a.date.localeCompare(b.date))
    : [];
  const groups: [string, Row[]][] = [];
  for (const r of rows) {
    const key = r.date.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last?.[0] === key) last[1].push(r);
    else groups.push([key, [r]]);
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label={t('range.label')} className="inline-flex rounded-xl border bg-card p-1">
          {RANGES.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={months === m}
              onClick={() => changeMonths(m)}
              className={cn(
                'min-h-10 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                months === m ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
              )}
            >
              {t(`range.${m}`)}
            </button>
          ))}
        </div>
        {q.data && (
          <p className="text-muted-foreground" role="status">
            {q.data.days.length ? t(`dates.count.${kind}`, { count: q.data.days.length }) : t('dates.none')}
          </p>
        )}
      </div>
      {shareText && <ShareButtons text={shareText} path={`/muhurat?kind=${kind}`} source="muhurat" />}

      {q.error ? (
        <Failed retry={q.reload} />
      ) : !q.data ? (
        <Loading />
      ) : (
        groups.map(([month, list]) => (
          <section key={month} aria-labelledby={`m-${month}`} className="grid gap-3">
            <h3 id={`m-${month}`} className="font-heading text-2xl text-heading">
              {monthTitle(`${month}-01`, lang)}
            </h3>
            <ol className="grid gap-3">
              {list.map((r) =>
                r.kind === 'blocked' ? (
                  <li key={`b-${r.b.reason}-${r.b.from}`} className="flex gap-3 rounded-2xl border border-dashed bg-muted/50 px-4 py-3 text-sm">
                    <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <p>
                      <span className="font-medium">
                        {t('blocked.range', { from: fmtCivilDate(r.b.from, lang), to: fmtCivilDate(r.b.to, lang) })}
                      </span>
                      <span className="text-muted-foreground"> {t(`blocked.${r.b.reason}`)}</span>
                    </p>
                  </li>
                ) : (
                  <li key={r.date} className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-[5.5rem_1fr] sm:p-5">
                    <div className="flex items-baseline gap-3 sm:flex-col sm:items-start sm:gap-0">
                      <span className="font-heading text-4xl leading-none text-sindoor tabular-nums">
                        {Number(r.date.slice(8))}
                      </span>
                      <span className="text-sm text-muted-foreground">{weekdayName(r.date, lang)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">
                        {t('dates.line', {
                          tithi: pick(r.day.tithi_name, lang),
                          nakshatra: pick(r.day.nakshatra_name, lang),
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">{t('dates.month', { month: pick(r.day.lunar_month, lang) })}</p>
                      <p className="mt-2 mb-1 text-sm text-muted-foreground">{t('dates.times')}</p>
                      <ul className="flex flex-wrap gap-2">
                        {r.day.windows.map((w) => (
                          <li key={w.start} className="rounded-lg bg-tulsi/10 px-2.5 py-1 text-sm text-foreground ring-1 ring-tulsi/30">
                            <TimeRange w={w} date={r.date} tz={place.tz} lang={lang} />
                          </li>
                        ))}
                      </ul>
                      {pujaSlug && (
                        <Link
                          href={`/pujas/${pujaSlug}${isBookableDate(r.date) ? `?date=${r.date}` : ''}`}
                          className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-lg text-sm font-medium text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                        >
                          <HandHeart className="size-4" aria-hidden="true" />
                          {isBookableDate(r.date) ? tt('flow.bookDate') : tt('flow.bookPandit')}
                        </Link>
                      )}
                    </div>
                  </li>
                ),
              )}
            </ol>
          </section>
        ))
      )}

      <details className="rounded-2xl border bg-card p-5">
        <summary className="cursor-pointer font-heading text-lg text-heading">{t('rules.title')}</summary>
        <div className="mt-3 grid gap-2 text-sm">
          <p>{t(`rules.${kind}`)}</p>
          <p>{t('rules.common')}</p>
        </div>
      </details>
    </div>
  );
}

// ───────────────────────── one day ─────────────────────────

function Period({ label, children, tone }: { label: string; children: ReactNode; tone: 'good' | 'bad' }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl px-4 py-3',
        tone === 'good' ? 'bg-tulsi/10 ring-1 ring-tulsi/30' : 'bg-kumkum/5 ring-1 ring-kumkum/20',
      )}
    >
      <span className="font-medium">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

function DayView({ place, initialDate }: { place: Place; initialDate?: string | null }) {
  const t = useT('muhurat');
  const { locale: lang } = useLocale();
  const id = useId();
  const [date, setDate] = useState(() => initialDate || todayIn(place.tz));
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const q = useApiQuery<DayMuhurat>(date ? '/muhurat/day' : null, {
    query: {
      date,
      ...placeQuery(place),
      ...(birthDate && { birth_date: birthDate, ...(birthTime && { birth_time: birthTime }) }),
    },
  });
  const d = q.data;
  const tz = place.tz;

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr] lg:items-start">
      <div className="grid gap-5 rounded-2xl border bg-card p-5">
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-date`}>{t('day.date')}</Label>
          <Input
            id={`${id}-date`}
            type="date"
            min="1901-01-01"
            max="2098-12-31"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              track('tool_submit', { tool: 'muhurat', kind: 'day' });
            }}
            className="h-11 text-base"
          />
        </div>
        <fieldset className="grid gap-3 border-t pt-4">
          <legend className="pt-4 font-medium">{t('day.birthTitle')}</legend>
          <p className="text-sm text-muted-foreground">{t('day.birthHint')}</p>
          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-bd`} className="text-sm font-normal text-muted-foreground">
              {t('day.birthDate')}
            </Label>
            <Input
              id={`${id}-bd`}
              type="date"
              min="1901-01-01"
              max={todayIn(tz)}
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="h-11 text-base"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-bt`} className="text-sm font-normal text-muted-foreground">
              {t('day.birthTime')}
            </Label>
            <TimePicker id={`${id}-bt`} value={birthTime} onChange={setBirthTime} />
          </div>
          {birthDate && (
            <Button
              type="button"
              variant="ghost"
              className="justify-self-start"
              onClick={() => {
                setBirthDate('');
                setBirthTime('');
              }}
            >
              {t('day.clearBirth')}
            </Button>
          )}
        </fieldset>
      </div>

      {q.error ? (
        <Failed retry={q.reload} />
      ) : !d ? (
        <Loading />
      ) : (
        <div className="grid gap-5">
          <section className="rounded-2xl border bg-card p-5 sm:p-6">
            <h3 className="font-heading text-2xl text-heading">
              {fmtCivilDate(d.date, lang)}, {weekdayName(d.date, lang)}
            </h3>
            <p className="mt-1">
              {t('day.panchang', {
                tithi: pick(d.tithi_name, lang),
                nakshatra: pick(d.nakshatra_name, lang),
                month: pick(d.lunar_month, lang),
              })}
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Sunrise className="size-4" aria-hidden="true" />
              {t('day.sun', { rise: fmtTime(d.sunrise, lang, tz), set: fmtTime(d.sunset, lang, tz) })}
            </p>
            {d.tithi_birthday !== undefined && birthDate && (
              <p className="mt-4 flex gap-2 rounded-xl bg-accent/50 px-4 py-3">
                <CalendarHeart className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                {d.tithi_birthday
                  ? t('day.tithiBirthday', {
                      tithi: pick(d.tithi_birthday.tithi_name, lang),
                      month: pick(d.tithi_birthday.lunar_month, lang),
                      date: fmtCivilDate(d.tithi_birthday.date, lang),
                    })
                  : t('day.tithiBirthdayNone')}
              </p>
            )}
          </section>

          <section className="grid gap-3 rounded-2xl border bg-card p-5 sm:p-6">
            <h3 className="font-heading text-xl text-heading">{t('day.best')}</h3>
            <p className="text-sm text-muted-foreground">{t('day.bestAbout')}</p>
            {d.best.length ? (
              <ul className="flex flex-wrap gap-2">
                {d.best.map((w) => (
                  <li key={w.start} className="rounded-lg bg-tulsi/10 px-3 py-1.5 font-medium ring-1 ring-tulsi/30">
                    <TimeRange w={w} date={d.date} tz={tz} lang={lang} />
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t('day.bestNone')}</p>
            )}
            <Period label={t('day.abhijit')} tone="good">
              {d.abhijit ? <TimeRange w={d.abhijit} date={d.date} tz={tz} lang={lang} /> : t('day.abhijitWed')}
            </Period>
          </section>

          <section className="grid gap-3 rounded-2xl border bg-card p-5 sm:p-6">
            <h3 className="font-heading text-xl text-heading">{t('day.avoid')}</h3>
            <Period label={t('day.rahu')} tone="bad">
              <TimeRange w={d.rahu_kaal} date={d.date} tz={tz} lang={lang} />
            </Period>
            <Period label={t('day.yamaganda')} tone="bad">
              <TimeRange w={d.yamaganda} date={d.date} tz={tz} lang={lang} />
            </Period>
            <Period label={t('day.gulika')} tone="bad">
              <TimeRange w={d.gulika} date={d.date} tz={tz} lang={lang} />
            </Period>
          </section>

          <section className="rounded-2xl border bg-card p-5 sm:p-6">
            <h3 className="font-heading text-xl text-heading">{t('day.choghadiya')}</h3>
            <div className="mt-3 grid gap-6 sm:grid-cols-2">
              {([false, true] as const).map((night) => (
                <div key={String(night)}>
                  <p className="mb-2 text-sm text-muted-foreground">{night ? t('day.night') : t('day.daytime')}</p>
                  <ul className="grid gap-1">
                    {d.choghadiya
                      .filter((c) => c.night === night)
                      .map((c) => (
                        <li
                          key={c.start}
                          className={cn(
                            'flex justify-between gap-3 rounded-lg px-3 py-1.5 text-sm',
                            c.good && 'bg-tulsi/10 font-medium',
                          )}
                        >
                          <span>
                            {t(`chog.${c.name}`)}
                            {c.good && <span className="sr-only"> ({t('day.good')})</span>}
                          </span>
                          <TimeRange w={c} date={d.date} tz={tz} lang={lang} />
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── page body ─────────────────────────

export function MuhuratFinder({
  initialTab = 'vivah',
  initialDate = null,
  initial = null,
}: {
  /** From `?kind=` (lib/tools.ts muhuratHref), e.g. after a kundali milan. */
  initialTab?: MuhuratTab;
  /** From `?date=` for the day view. */
  initialDate?: string | null;
  initial?: InitialDates | null;
}) {
  const t = useT('muhurat');
  const place = usePlace();
  const name = usePlaceName();
  const [tab, setTab] = useState<MuhuratTab>(initialTab);
  useEffect(() => {
    track('tool_view', { tool: 'muhurat' });
  }, []);
  const changeTab = (next: MuhuratTab) => {
    setTab(next);
    track('tool_submit', { tool: 'muhurat', kind: next });
  };

  return (
    <>
      <PlaceSync requested={place} refresh={false} />
      <section className="sandhya stars relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pt-12 pb-10 sm:px-6 sm:pt-16">
          <p lang="sa" className="font-heading text-lg text-diya">
            {t('hero.invocation')}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl leading-tight text-balance sm:text-5xl">{t('hero.title')}</h1>
          <p className="mt-4 max-w-2xl text-lg">{t('hero.intro')}</p>
          <PlaceControl
            place={place}
            text={t('place.text', { place: name(place) })}
            tone="dark"
            className="mt-6"
          />
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <Tabs value={tab} onValueChange={(v) => changeTab(v as MuhuratTab)} className="gap-8">
          <TabsList aria-label={t('tabs.label')} className="grid h-auto! w-full grid-cols-3 sm:inline-grid sm:w-auto">
            <TabsTrigger value="vivah" className="min-h-11 px-3 sm:px-5">
              <CalendarHeart aria-hidden="true" className="hidden sm:inline" />
              {t('tab.vivah')}
            </TabsTrigger>
            <TabsTrigger value="griha_pravesh" className="min-h-11 px-3 sm:px-5">
              <Home aria-hidden="true" className="hidden sm:inline" />
              {t('tab.griha_pravesh')}
            </TabsTrigger>
            <TabsTrigger value="day" className="min-h-11 px-3 sm:px-5">
              <Sunrise aria-hidden="true" className="hidden sm:inline" />
              {t('tab.day')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="vivah">
            <DateList kind="vivah" place={place} initial={initial} />
          </TabsContent>
          <TabsContent value="griha_pravesh">
            <DateList kind="griha_pravesh" place={place} initial={initial} />
          </TabsContent>
          <TabsContent value="day">
            <DayView place={place} initialDate={initialDate} />
          </TabsContent>
        </Tabs>

        <PushPrePrompt source="muhurat" className="mt-10" />

        <p className="mt-10 flex gap-3 rounded-2xl border border-diya/50 bg-chandan/60 p-4 sm:p-5">
          <Info className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          {t('note.guidance')}
        </p>

        <section className="sandhya mt-6 flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-2xl">{t('cta.title')}</h2>
            <p className="mt-1">{t('cta.text')}</p>
          </div>
          <Button size="lg" render={<Link href="/browse" />} nativeButton={false}>
            {t('cta.button')}
          </Button>
        </section>
      </div>
    </>
  );
}
