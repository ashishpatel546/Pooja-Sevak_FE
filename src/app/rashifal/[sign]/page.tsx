import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  BellRing,
  BriefcaseBusiness,
  CalendarHeart,
  CloudOff,
  Coins,
  HandHeart,
  HeartPulse,
  MoonStar,
  Orbit,
  ScrollText,
  Sparkles,
  Sun,
  Telescope,
  Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { getLocale, getT } from '@/i18n/server';
import { fetchCatalogList } from '@/lib/seo/data';
import { publicMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema } from '@/lib/seo/schema';
import {
  civilDateLabel,
  houseOrdinal,
  RASHIS,
  rashiBySlug,
  rashiName,
  shiftDate,
  SHANI_PUJA_SLUG,
  todayIst,
  type Rashi,
} from '@/lib/rashifal';
import { cn } from '@/lib/utils';
import { JsonLd } from '@/components/seo/json-ld';
import { PushPrePrompt } from '@/components/notifications/push-preprompt';
import { fetchRashifalReading, fetchRashifalWeek } from '@/components/rashifal/rashifal-server';
import { MineBadge, RatingDots } from '@/components/rashifal/rashi-ui';

type Props = {
  params: Promise<{ sign: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** `?date=` is honoured for yesterday and tomorrow (India); anything else shows today. */
function dayOf(query: Record<string, string | string[] | undefined>): { date: string; today: string } {
  const today = todayIst();
  const asked = typeof query.date === 'string' ? query.date : null;
  const ok = asked === shiftDate(today, -1) || asked === shiftDate(today, 1);
  return { date: ok && asked ? asked : today, today };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { sign } = await params;
  const r = rashiBySlug(sign);
  if (!r) return {};
  const [{ date }, t, locale] = await Promise.all([searchParams.then(dayOf), getT('rashifal'), getLocale()]);
  const vars = { sign: locale === 'hi' ? r.hi : r.en, western: r.western, date: civilDateLabel(date, locale) };
  // Dated variants canonicalise to the bare sign URL.
  return publicMetadata({
    path: `/rashifal/${r.slug}`,
    title: t('sign.metaTitle', vars),
    description: t('sign.metaDescription', vars),
    imageBase: `/rashifal/${r.slug}`,
  });
}

function Card({ icon, title, children, className }: { icon: ReactNode; title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-2xl border bg-card p-5 sm:p-6', className)}>
      <h2 className="flex items-center gap-2 font-heading text-xl text-heading">
        {icon}
        {title}
      </h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function NavCard({ href, icon, title, text }: { href: string; icon: ReactNode; title: string; text: string }) {
  return (
    <Link
      href={href}
      className="flex gap-3 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <span className="mt-0.5 shrink-0 text-primary">{icon}</span>
      <span>
        <span className="block font-medium">{title}</span>
        <span className="block text-sm text-muted-foreground">{text}</span>
      </span>
    </Link>
  );
}

const icon = 'size-5 text-primary';

export default async function RashifalSignPage({ params, searchParams }: Props) {
  const { sign } = await params;
  const r: Rashi | undefined = rashiBySlug(sign);
  if (!r) notFound();
  const { date, today } = dayOf(await searchParams);
  const locale = await getLocale();
  const [reading, week, catalog, t, ts] = await Promise.all([
    fetchRashifalReading(r.slug, date, locale),
    fetchRashifalWeek(r.slug, today, locale),
    fetchCatalogList(),
    getT('rashifal'),
    getT('seo'),
  ]);
  const name = locale === 'hi' ? r.hi : r.en;
  const shaniPuja = catalog?.some((p) => p.slug === SHANI_PUJA_SLUG && p.is_active !== false) ?? false;
  const days = [
    { key: 'yesterday', date: shiftDate(today, -1) },
    { key: 'today', date: today },
    { key: 'tomorrow', date: shiftDate(today, 1) },
  ] as const;

  return (
    <>
      <JsonLd
        data={breadcrumbSchema(
          [
            { name: ts('breadcrumb.home'), path: '/' },
            { name: t('breadcrumb.rashifal'), path: '/rashifal' },
            { name: rashiName(r, locale), path: `/rashifal/${r.slug}` },
          ],
          locale,
        )}
      />
      <section className="sandhya stars relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 pt-10 pb-8 sm:px-6 sm:pt-14">
          <nav aria-label={ts('breadcrumb.home')} className="text-sm">
            <Link href="/rashifal" className="underline-offset-4 hover:underline">
              {t('breadcrumb.rashifal')}
            </Link>
            <span aria-hidden="true"> / </span>
            <span>{name}</span>
          </nav>
          <div className="mt-4 flex items-center gap-4">
            <span aria-hidden="true" className="grid size-16 shrink-0 place-items-center rounded-full bg-chandan text-4xl text-sindoor">
              {r.glyph}
            </span>
            <div className="min-w-0">
              <h1 className="text-4xl leading-tight sm:text-5xl">
                {t('sign.title', { sign: name })}
                {locale === 'en' && <span className="ml-2 text-2xl">({r.western})</span>}
              </h1>
              <p className="mt-1 text-lg">{civilDateLabel(date, locale)}</p>
            </div>
          </div>
          {reading && (
            <p className="mt-4 flex flex-wrap items-center gap-2">
              <MoonStar className="size-5 text-diya" aria-hidden="true" />
              {t('panchang.line', {
                weekday: reading.weekday_name,
                tithi: reading.tithi,
                nakshatra: reading.nakshatra,
                moon: reading.moon_sign_name,
              })}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <nav aria-label={t('sign.dayNav')} className="inline-flex rounded-xl bg-background/15 p-1">
              {days.map((d) => (
                <Link
                  key={d.key}
                  href={d.key === 'today' ? `/rashifal/${r.slug}` : `/rashifal/${r.slug}?date=${d.date}`}
                  aria-current={d.date === date ? 'page' : undefined}
                  className={cn(
                    'inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                    d.date === date ? 'bg-primary text-primary-foreground' : 'hover:bg-background/20',
                  )}
                >
                  {t(`day.${d.key}`)}
                </Link>
              ))}
            </nav>
            <MineBadge sign={r.slug} />
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        {!reading ? (
          <div className="flex items-start gap-3 rounded-xl border border-dashed p-5 text-muted-foreground">
            <CloudOff className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <p>{t('error.unavailable')}</p>
          </div>
        ) : (
          <div className="grid gap-5">
            <section className="rounded-2xl border border-diya/50 bg-chandan/60 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-heading text-2xl text-heading">{reading.headline}</h2>
                <RatingDots rating={reading.rating} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('sign.moon', { house: houseOrdinal(reading.moon_house, locale), sign: reading.moon_sign_name })}
              </p>
              <p className="mt-3 text-lg">{reading.overall}</p>
              {reading.moon_change && <p className="mt-2 text-sm text-muted-foreground">{reading.moon_change.note}</p>}
            </section>

            <div className="grid gap-5 sm:grid-cols-2">
              <Card icon={<BriefcaseBusiness className={icon} aria-hidden="true" />} title={t('section.career')}>
                <p>{reading.career}</p>
              </Card>
              <Card icon={<Coins className={icon} aria-hidden="true" />} title={t('section.money')}>
                <p>{reading.money}</p>
              </Card>
              <Card icon={<Users className={icon} aria-hidden="true" />} title={t('section.love')}>
                <p>{reading.love}</p>
              </Card>
              <Card icon={<HeartPulse className={icon} aria-hidden="true" />} title={t('section.health')}>
                <p>{reading.health}</p>
              </Card>
              <Card icon={<HandHeart className={icon} aria-hidden="true" />} title={t('section.remedy')}>
                <p>{reading.remedy}</p>
              </Card>
              <Card icon={<Sparkles className={icon} aria-hidden="true" />} title={t('section.lucky')}>
                <dl className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-sm text-muted-foreground">{t('lucky.colour')}</dt>
                    <dd className="font-heading text-2xl text-heading">{reading.lucky.colour}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">{t('lucky.number')}</dt>
                    <dd className="font-heading text-2xl text-heading tabular-nums">{reading.lucky.number}</dd>
                  </div>
                </dl>
              </Card>
            </div>

            <Card icon={<Telescope className={icon} aria-hidden="true" />} title={t('section.outlook')}>
              <p>{reading.outlook}</p>
            </Card>

            {reading.shani && (
              <Card
                icon={<Orbit className={icon} aria-hidden="true" />}
                title={t('section.shani', { sign: name })}
                className="border-diya/50"
              >
                <p className="font-medium">{t(`shani.${reading.shani.status}`)}</p>
                <p className="mt-1">{reading.shani.text}</p>
                {shaniPuja && (
                  <Link
                    href={`/pujas/${SHANI_PUJA_SLUG}`}
                    className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 font-medium text-primary-foreground hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    {t('links.shani')}
                  </Link>
                )}
              </Card>
            )}

            <section className="rounded-2xl border bg-card p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-heading text-xl text-heading">
                <Sun className={icon} aria-hidden="true" />
                {t('section.gochar', { sign: name })}
              </h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[28rem] text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th scope="col" className="py-2 pr-3 font-medium">{t('gochar.graha')}</th>
                      <th scope="col" className="py-2 pr-3 font-medium">{t('gochar.sign')}</th>
                      <th scope="col" className="py-2 pr-3 font-medium">{t('gochar.house')}</th>
                      <th scope="col" className="py-2 font-medium">{t('gochar.effect')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reading.planets.map((p) => (
                      <tr key={p.graha}>
                        <th scope="row" className="py-2 pr-3 text-left font-medium">
                          {p.name}
                          {p.retrograde && p.graha !== 'ra' && p.graha !== 'ke' && (
                            <span className="ml-1 text-xs text-muted-foreground">({t('gochar.retro')})</span>
                          )}
                        </th>
                        <td className="py-2 pr-3">{p.sign_name}</td>
                        <td className="py-2 pr-3 tabular-nums">{p.house}</td>
                        <td className={cn('py-2', p.favourable ? 'text-tulsi' : 'text-muted-foreground')}>
                          {p.favourable ? t('gochar.good') : t('gochar.mixed')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {week && (
              <section className="rounded-2xl border bg-card p-5 sm:p-6">
                <h2 className="flex items-center gap-2 font-heading text-xl text-heading">
                  <CalendarHeart className={icon} aria-hidden="true" />
                  {t('week.title')}
                </h2>
                <ol className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                  {week.days.map((d) => (
                    <li
                      key={d.date}
                      className={cn(
                        'rounded-xl p-3 text-sm ring-1',
                        d.moon_favourable ? 'bg-tulsi/10 ring-tulsi/30' : 'bg-muted/50 ring-border',
                      )}
                    >
                      <p className="font-medium">
                        {new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          timeZone: 'UTC',
                        }).format(new Date(`${d.date}T00:00:00Z`))}
                      </p>
                      <RatingDots rating={d.rating} className="mt-1" />
                      <p className="mt-1 text-muted-foreground">{d.headline}</p>
                    </li>
                  ))}
                </ol>
                <p className="mt-3 text-sm">
                  {week.best_days.length ? (
                    <>
                      <span className="font-medium">{t('week.best')}: </span>
                      {week.best_days.map((d) => civilDateLabel(d, locale)).join(', ')}
                    </>
                  ) : (
                    t('week.none')
                  )}
                </p>
              </section>
            )}

            <p className="text-sm text-muted-foreground">{reading.method}</p>
            <p className="-mt-3 text-sm text-muted-foreground">{t('note.disclaimer')}</p>
          </div>
        )}

        <PushPrePrompt source="rashifal" className="mt-10" />

        <section aria-labelledby="go-further" className="mt-10">
          <h2 id="go-further" className="text-2xl">
            {t('links.title')}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <NavCard href="/kundali" icon={<ScrollText className="size-5" aria-hidden="true" />} title={t('links.kundali')} text={t('links.kundaliText')} />
            <NavCard href="/panchang" icon={<MoonStar className="size-5" aria-hidden="true" />} title={t('links.panchang')} text={t('links.panchangText')} />
            <NavCard href="/reminders?tab=preferences" icon={<BellRing className="size-5" aria-hidden="true" />} title={t('links.remind')} text={t('links.remindText')} />
            <NavCard href="/muhurat" icon={<CalendarHeart className="size-5" aria-hidden="true" />} title={t('links.muhurat')} text={t('links.muhuratText')} />
          </div>
        </section>

        <nav aria-labelledby="other-signs" className="mt-10">
          <h2 id="other-signs" className="text-2xl">
            {t('other.title')}
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {RASHIS.filter((x) => x.slug !== r.slug).map((x) => (
              <li key={x.slug}>
                <Link
                  href={`/rashifal/${x.slug}`}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border bg-card px-4 hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <span aria-hidden="true">{x.glyph}</span>
                  {locale === 'hi' ? x.hi : x.en}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
