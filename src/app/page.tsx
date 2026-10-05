import type { Metadata } from 'next';
import { Fragment } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Baby,
  BadgeCheck,
  BellRing,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Flower2,
  Globe2,
  HandCoins,
  Heart,
  Home as HomeIcon,
  MapPin,
  MessageSquareQuote,
  MoonStar,
  Orbit,
  ReceiptText,
  ScrollText,
  Sparkles,
  Video,
} from 'lucide-react';
import type { Messages } from '@/i18n/messages';
import type { Observance, ServiceDefinition } from '@/lib/types';
import { getLocale, getT } from '@/i18n/server';
import { pick } from '@/i18n/translate';
import { GAYATRI_MANTRA, SHUBHAM_BHAVATU, VAKRATUNDA_MANTRA, type Mantra } from '@/lib/mantras';
import { formatINR } from '@/lib/format';
import { placeName } from '@/lib/place';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Diya } from '@/components/brand/diya';
import { Mandala } from '@/components/brand/mandala';
import { activePitruPaksha, isOnDay, pujaNamesFrom } from '@/components/ritual/observance';
import { fetchCatalog, loadPanchang } from '@/components/ritual/panchang-server';
import { PlaceSync } from '@/components/ritual/place-control';
import { PitruPakshaBand } from '@/components/ritual/pitru-paksha-band';
import { PujaIcon } from '@/components/common/puja-icon';
import { MoonRing } from '@/components/home/moon-ring';
import { FestivalMonth } from '@/components/home/festival-month';
import { PanchangGlance } from '@/components/home/panchang-glance';
import { SacredPlans, type PujaPrices } from '@/components/home/sacred-plans';
import { JsonLd } from '@/components/seo/json-ld';
import { publicMetadata } from '@/lib/seo/metadata';
import { organizationSchema, websiteSchema } from '@/lib/seo/schema';
import { getSiteInfo } from '@/lib/business-profile';
import en_common from '@/i18n/messages/en/common';
import hi_common from '@/i18n/messages/hi/common';

type HomeKey = keyof Messages['home'] & string;

const OCCASIONS = [
  { key: 'griha', slug: 'griha-pravesh', icon: HomeIcon },
  { key: 'namkaran', slug: 'namkaran-sanskar', icon: Baby },
  { key: 'satyanarayan', slug: 'satyanarayan-katha', icon: Flower2 },
  { key: 'navgraha', slug: 'navgraha-shanti', icon: Orbit },
  { key: 'mahamrityunjay', slug: 'mahamrityunjay-jaap', icon: Heart },
  { key: 'pitru', slug: 'pitru-paksha-shraddh', icon: Sparkles },
] as const;

const HERO_TRUST = [
  { icon: BadgeCheck, key: 'hero.trust.verified' },
  { icon: HandCoins, key: 'hero.trust.prices' },
  { icon: Globe2, key: 'hero.trust.nri' },
] as const;

const STEPS = ['choose', 'pandit', 'sankalp', 'arrive'] as const;

const PROMISES = [
  { icon: BadgeCheck, key: 'verified' },
  { icon: MessageSquareQuote, key: 'reviews' },
  { icon: HandCoins, key: 'price' },
  { icon: ReceiptText, key: 'refund' },
  { icon: CalendarClock, key: 'time' },
] as const;

const ONLINE_POINTS = ['panchang', 'time', 'link'] as const;
const SMARAN_POINTS = ['punyatithi', 'days', 'when'] as const;
const FAQS = ['book', 'abroad', 'cancel'] as const;

/** Catalog pujas for the dakshina grid: active, not already shown as an occasion, most pandits first. */
function gridPujas(catalog: ServiceDefinition[] | null, exclude: Set<string>, n = 8): ServiceDefinition[] {
  return (catalog ?? [])
    .filter((d) => d.is_active !== false && !exclude.has(d.slug))
    .sort((a, b) => b.pandit_count - a.pandit_count || a.name.localeCompare(b.name))
    .slice(0, n);
}

/**
 * Upcoming sacred days that come with suggested pujas, one per distinct set of
 * pujas (Pradosh and Masik Shivratri often share Rudrabhishek), soonest first.
 */
function sacredPlans(upcoming: Observance[] | null, today: string, skipPitru: boolean, n = 4): Observance[] {
  const seen = new Set<string>();
  const out: Observance[] = [];
  for (const o of upcoming ?? []) {
    if (o.date < today || o.suggested_puja_slugs.length === 0) continue;
    if (o.key === 'pitru_paksha' && (skipPitru || isOnDay(o, today))) continue;
    const sig = [...o.suggested_puja_slugs].sort().join('|');
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(o);
    if (out.length === n) break;
  }
  return out;
}

const STEP_NUMERALS = ['१', '२', '३', '४'];

export async function generateMetadata(): Promise<Metadata> {
  const [ts, tn] = await Promise.all([getT('seo'), getT('nav')]);
  return publicMetadata({ path: '/', title: ts('home.title'), description: tn('meta.description'), absoluteTitle: true });
}

export default async function Home() {
  const [t, tp, tn, ts, tc, tcm, locale, { requested, place, today, day, upcoming, festivals, month }, catalog, info] = await Promise.all([
    getT('home'),
    getT('panchang'),
    getT('nav'),
    getT('seo'),
    getT('catalog'),
    getT('common'),
    getLocale(),
    loadPanchang(45, { festivalDays: 120, month: true }),
    fetchCatalog(),
    getSiteInfo(),
  ]);
  const hi = locale === 'hi';
  const k = (key: string) => key as HomeKey;
  const defs = new Map((catalog ?? []).map((d) => [d.slug, d]));
  const pujaLabel = (slug: string, fallbackKey: string) => {
    const def = defs.get(slug);
    return def ? pick(def, 'name', locale) : t(k(fallbackKey));
  };

  const priceOf = (slug: string) => {
    const p = defs.get(slug)?.starting_price;
    return p == null || !Number.isFinite(Number(p)) ? null : Number(p);
  };
  const fromPrice = (slug: string) => {
    const p = priceOf(slug);
    return p == null ? null : tc('tile.from', { price: formatINR(p, locale) });
  };
  const duration = (minutes: number | null) => {
    if (!minutes) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const text = !h ? tcm('duration.min', { m }) : !m ? tcm.plural('duration.hr', h, { h }) : tcm('duration.hrMin', { h, m });
    return tc('tile.about', { duration: text });
  };

  const pitru = activePitruPaksha(today, day?.observances, upcoming);
  const plans = sacredPlans(upcoming, today, !!pitru);
  const pujaNames = pujaNamesFrom(catalog);
  const prices: PujaPrices = Object.fromEntries((catalog ?? []).map((d) => [d.slug, priceOf(d.slug)]));
  const grid = gridPujas(catalog, new Set(OCCASIONS.map((o) => o.slug)));
  const placeLabel = placeName(place, locale) ?? tp('place.yourLocation');
  const h2 = cn('text-4xl sm:text-5xl', hi ? 'leading-[1.3]' : 'leading-tight');

  // Brand in both scripts: the visible name for this language, the other as alternateName.
  const brand = { name: (hi ? hi_common : en_common)['brand.name'], alternateName: (hi ? en_common : hi_common)['brand.name'] };

  return (
    <>
      <JsonLd
        data={[
          organizationSchema({
            ...brand,
            description: tn('meta.description'),
            area: ts('org.areaServed'),
            legalName: info.legalName,
            email: info.supportEmail,
            telephone: info.supportPhone,
            taxID: info.gstin,
          }),
          websiteSchema({ ...brand, description: tn('meta.description') }),
        ]}
      />
      <PlaceSync requested={requested} />
      {/* Hero — the evening sky at aarti */}
      <section className="sandhya stars relative overflow-hidden">
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 pt-14 pb-24 sm:px-6 md:grid-cols-[1.15fr_1fr] md:pt-20 md:pb-32">
          <div className="relative z-10 min-w-0">
            <p lang="sa" className="font-heading text-xl text-diya">
              {SHUBHAM_BHAVATU}
            </p>
            {/* Mantras stay in Devanagari Sanskrit in every locale — never translated. */}
            <div className="mt-4 space-y-3 border-l-2 border-diya/40 pl-4 animate-in fade-in duration-1000 motion-reduce:animate-none">
              <MantraBlock
                mantra={GAYATRI_MANTRA}
                label={hi ? 'गायत्री मंत्र' : 'Gayatri Mantra'}
                className="text-[1.0625rem] leading-[1.75] text-[#fbe3b6] sm:text-xl"
              />
              <MantraBlock
                mantra={VAKRATUNDA_MANTRA}
                label={hi ? 'श्री गणेश मंत्र' : 'Shri Ganesh Mantra'}
                className="text-sm leading-[1.7] text-diya/90 sm:text-base"
              />
            </div>
            <h1
              className={cn(
                'mt-6 text-5xl sm:text-6xl lg:text-7xl',
                hi ? 'leading-tight' : 'leading-[1.05]',
              )}
            >
              {t('hero.title')}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed">{t('hero.lead')}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                render={<Link href="/browse" />}
                nativeButton={false}
                className="bg-diya text-[#2a1208] shadow-[0_10px_30px_-10px_#e2a23b] hover:bg-[#ebb253]"
              >
                <MapPin aria-hidden="true" />
                {t('hero.ctaNearby')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href="/online" />}
                nativeButton={false}
                className="border-[#fbe3b6]/40 bg-transparent text-[#fbe3b6] hover:bg-white/10 hover:text-[#fff4e0]"
              >
                <Video aria-hidden="true" />
                {t('hero.ctaOnline')}
              </Button>
            </div>
            <ul className="mt-10 grid gap-3 text-sm sm:grid-cols-3">
              {HERO_TRUST.map(({ icon: Icon, key }) => (
                <li key={key} className="flex items-center gap-2">
                  <Icon className="size-4 shrink-0 text-diya" aria-hidden="true" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto grid aspect-square w-full max-w-88 place-items-center md:max-w-120">
            <Mandala className="mandala-spin absolute inset-0 size-full text-diya/35" />
            <div
              className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgb(226_162_59/0.35),transparent_65%)]"
              aria-hidden="true"
            />
            <Diya className="relative size-40 md:size-52" />
          </div>
        </div>
        <div className="toran" aria-hidden="true" />
      </section>

      {/* Aaj ka panchang — first thing under the hero; hidden when the API cannot answer */}
      {day && (
        <div className="relative mx-auto mt-8 max-w-7xl px-4 sm:px-6 md:mt-10">
          <PanchangGlance day={day} today={today} place={place} requested={requested} upcoming={upcoming} />
        </div>
      )}

      {/* Season — only while Pitru Paksha is in force */}
      {pitru && (
        <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
          <PitruPakshaBand observance={pitru} variant="compact" tz={place.tz} />
        </div>
      )}

      {/* Festivals this month, with a calendar of the month's panchang — hidden when the panchang is unavailable */}
      {(month || !!festivals?.length) && (
        <FestivalMonth month={month} festivals={festivals ?? []} today={today} place={place} placeLabel={placeLabel} />
      )}

      {/* Occasions */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <h2 className={h2}>{t('occasions.title')}</h2>
          <p className="mt-3 text-lg text-muted-foreground">{t('occasions.lead')}</p>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-x-10 border-t sm:grid-cols-2">
          {OCCASIONS.map((o) => {
            const price = fromPrice(o.slug);
            return (
              <li key={o.slug} className="min-w-0 border-b">
                <Link
                  href={`/pujas/${o.slug}`}
                  className="group flex items-start gap-4 rounded-lg py-6 transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground ring-1 ring-diya/30 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <o.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block font-heading text-2xl text-heading',
                        hi ? 'leading-[1.4]' : 'leading-snug',
                      )}
                    >
                      {t(k(`occasion.${o.key}.moment`))}
                    </span>
                    <span className="mt-1 block text-sm">
                      <span className="font-semibold text-primary">{pujaLabel(o.slug, `occasion.${o.key}.puja`)}</span>
                      {price && <span className="text-muted-foreground"> · {price}</span>}
                    </span>
                    <span className="mt-1 block text-muted-foreground">{t(k(`occasion.${o.key}.note`))}</span>
                  </span>
                  <ChevronRight
                    className="mt-3 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Sacred days ahead, each with its pujas — hidden when the panchang is unavailable */}
      {plans.length > 0 && (
        <section aria-labelledby="sacred-title" className="relative overflow-hidden border-y border-diya/25 bg-chandan">
          <Mandala className="absolute -bottom-40 -left-40 size-[26rem] text-diya/15" />
          <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-14 lg:py-20">
            <div className="min-w-0">
              <MoonStar className="size-8 text-diya" aria-hidden="true" />
              <h2 id="sacred-title" className={cn('mt-4 text-4xl', hi ? 'leading-[1.3]' : 'leading-tight')}>
                {t('sacred.title')}
              </h2>
              <p className="mt-3 text-lg text-muted-foreground">{t('sacred.lead', { place: placeLabel })}</p>
              <Link
                href="/reminders?tab=preferences"
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg font-semibold text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <BellRing className="size-4" aria-hidden="true" />
                {t('sacred.remind')}
              </Link>
            </div>
            <SacredPlans items={plans} pujaNames={pujaNames} prices={prices} tz={place.tz} />
          </div>
        </section>
      )}

      {/* Two ways: at home, or live for families abroad */}
      <section>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <article className="flex min-w-0 flex-col rounded-3xl bg-card p-8 ring-1 ring-border sm:p-10">
            <HomeIcon className="size-8 text-primary" aria-hidden="true" />
            <h2 className={cn('mt-6 text-3xl sm:text-4xl', hi && 'leading-[1.3]')}>{t('ways.home.title')}</h2>
            <p className="mt-3 text-lg text-muted-foreground">{t('ways.home.text')}</p>
            <p className="mt-6 flex items-center gap-2 text-sm font-medium text-tulsi">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              {t('ways.home.city')}
            </p>
            <div className="mt-auto pt-6">
              <Button size="lg" render={<Link href="/browse" />} nativeButton={false}>
                {t('ways.home.cta')}
              </Button>
            </div>
          </article>
          <article className="sandhya stars relative min-w-0 overflow-hidden rounded-3xl p-8 sm:p-10">
            <Globe2 className="absolute -right-10 -bottom-10 size-56 text-diya/10" aria-hidden="true" />
            <div className="relative">
              <p className="flex items-center gap-2 text-sm font-semibold text-diya">
                <Video className="size-5" aria-hidden="true" />
                {t('ways.online.eyebrow')}
              </p>
              <h2 className={cn('mt-4 text-3xl sm:text-4xl', hi && 'leading-[1.3]')}>{t('ways.online.title')}</h2>
              <p className="mt-3 text-lg">{t('ways.online.text')}</p>
              <ul className="mt-6 grid gap-3">
                {ONLINE_POINTS.map((key) => (
                  <li key={key} className="flex items-start gap-3">
                    <Check className="mt-1 size-4 shrink-0 text-diya" aria-hidden="true" />
                    <span>{t(k(`ways.online.point.${key}`))}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button
                  className="bg-diya text-[#2a1208] hover:bg-[#ebb253]"
                  size="lg"
                  render={<Link href="/online" />}
                  nativeButton={false}
                >
                  {t('ways.online.cta')}
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-[#fbe3b6] hover:bg-white/10 hover:text-[#fff4e0]"
                  render={<Link href="/panchang" />}
                  nativeButton={false}
                >
                  {t('glance.full')}
                </Button>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* How it works — a real sequence */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <h2 className={cn('max-w-2xl', h2)}>{t('steps.title')}</h2>
        <ol className="relative mt-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="toran absolute top-7 right-0 left-0 hidden lg:block" aria-hidden="true" />
          {STEPS.map((s, i) => (
            <li key={s} className="relative min-w-0">
              <span
                className="relative grid size-14 place-items-center rounded-full bg-background font-heading text-4xl text-diya ring-1 ring-diya/40"
                aria-hidden="true"
              >
                {STEP_NUMERALS[i]}
              </span>
              <h3 className="mt-4 font-sans text-lg font-semibold text-foreground">
                <span className="sr-only">{t('steps.stepLabel', { n: i + 1 })} </span>
                {t(k(`steps.${s}.title`))}
              </h3>
              <p className="mt-2 text-muted-foreground">{t(k(`steps.${s}.text`))}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Pujas with their dakshina — straight from the catalog; hidden if it cannot be loaded */}
      {grid.length > 0 && (
        <section aria-labelledby="pujas-title" className="border-y bg-muted/50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <h2 id="pujas-title" className={h2}>
                  {t('pujas.title')}
                </h2>
                <p className="mt-3 text-lg text-muted-foreground">{t('pujas.lead')}</p>
              </div>
              <Button
                variant="outline"
                size="lg"
                className="self-start bg-card md:self-auto"
                render={<Link href="/pujas" />}
                nativeButton={false}
              >
                {t('occasions.all')}
                <ArrowRight aria-hidden="true" />
              </Button>
            </div>
            <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {grid.map((d) => {
                const price = fromPrice(d.slug);
                const about = duration(d.typical_duration_minutes);
                const tagline = pick(d, 'tagline', locale);
                return (
                  <li key={d.slug} className="min-w-0">
                    <Link
                      href={`/pujas/${d.slug}`}
                      className="group flex h-full flex-col rounded-2xl bg-card p-4 ring-1 sm:p-5 ring-border transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgb(194_65_12/0.5)] hover:ring-diya/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <PujaIcon category={d.category} size="sm" className="sm:size-11" />
                        {d.supports_online && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                            <Video className="size-3" aria-hidden="true" />
                            <span className="sr-only sm:not-sr-only">{tc('tile.alsoOnline')}</span>
                          </span>
                        )}
                      </div>
                      <h3
                        className={cn(
                          'mt-3 text-lg text-heading group-hover:text-primary sm:mt-4 sm:text-xl',
                          hi ? 'leading-[1.4]' : 'leading-snug',
                        )}
                      >
                        {pick(d, 'name', locale)}
                      </h3>
                      {tagline && <p className="mt-1 line-clamp-2 hidden text-sm text-muted-foreground sm:block">{tagline}</p>}
                      <div className="mt-auto pt-4">
                        <p className="font-semibold text-foreground">{price ?? tc('tile.joiningSoon')}</p>
                        <p className="mt-0.5 flex flex-wrap gap-x-3 text-sm text-muted-foreground">
                          {about && (
                            <span className="hidden items-center gap-1 sm:inline-flex">
                              <Clock className="size-3.5" aria-hidden="true" />
                              {about}
                            </span>
                          )}
                          {d.pandit_count > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <BadgeCheck className="size-3.5 text-tulsi" aria-hidden="true" />
                              {t.plural('pujas.pandits', d.pandit_count)}
                            </span>
                          )}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* Promises — honest, specific */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
          <div className="min-w-0">
            <Diya className="size-14" />
            <h2 className={cn('mt-4 text-4xl', hi ? 'leading-[1.3]' : 'leading-tight')}>{t('promise.title')}</h2>
            <p className="mt-3 text-lg text-muted-foreground">{t('promise.lead')}</p>
            <Link
              href="/refund-policy"
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg font-semibold text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {t('promise.policy')}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-x-10 border-t sm:grid-cols-2">
            {PROMISES.map((p) => (
              <li key={p.key} className="flex min-w-0 gap-4 border-b py-6">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-tulsi/10 text-tulsi">
                  <p.icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-sans text-base font-semibold text-foreground">
                    {t(k(`promise.${p.key}.title`))}
                  </h3>
                  <p className="mt-1 text-muted-foreground">{t(k(`promise.${p.key}.text`))}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Smaran — reminders for sacred days and loved ones */}
      <section aria-labelledby="smaran-title" className="sandhya stars relative overflow-hidden">
        <div className="toran" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:py-20">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-diya">{t('smaran.eyebrow')}</p>
            <h2 id="smaran-title" className={cn('mt-3', h2)}>
              {t('smaran.title')}
            </h2>
            <p className="mt-4 max-w-xl text-lg">{t('smaran.lead')}</p>
            <ul className="mt-6 grid gap-3">
              {SMARAN_POINTS.map((key) => (
                <li key={key} className="flex items-start gap-3">
                  <Check className="mt-1 size-4 shrink-0 text-diya" aria-hidden="true" />
                  <span>{t(k(`smaran.point.${key}`))}</span>
                </li>
              ))}
            </ul>
            <Button
              size="lg"
              className="mt-8 bg-diya text-[#2a1208] hover:bg-[#ebb253]"
              render={<Link href="/reminders" />}
              nativeButton={false}
            >
              <BellRing aria-hidden="true" />
              {t('smaran.cta')}
            </Button>
          </div>
          <MoonRing className="mx-auto w-full max-w-72 md:max-w-80" />
        </div>
      </section>

      {/* FAQ teaser */}
      <section aria-labelledby="faq-title" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
          <div className="min-w-0">
            <h2 id="faq-title" className={cn('text-4xl', hi ? 'leading-[1.3]' : 'leading-tight')}>
              {t('faq.title')}
            </h2>
            <Link
              href="/faq"
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg font-semibold text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {t('faq.all')}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="min-w-0 divide-y border-y">
            {FAQS.map((q) => (
              <details key={q} className="group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-lg py-4 text-lg font-medium text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                  {t(k(`faq.${q}.q`))}
                  <ChevronDown
                    className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </summary>
                <p className="pb-5 text-muted-foreground">{t(k(`faq.${q}.a`))}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Pandit invitation */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl border border-diya/30 bg-chandan p-8 sm:p-10 md:flex-row md:items-center">
          <Mandala className="absolute -top-24 -right-24 size-72 text-diya/15" />
          <div className="relative flex min-w-0 items-start gap-4">
            <ScrollText className="mt-1 hidden size-8 shrink-0 text-primary sm:block" aria-hidden="true" />
            <div className="min-w-0">
              <h2 className={cn('text-3xl', hi && 'leading-[1.35]')}>{t('pandit.title')}</h2>
              <p className="mt-2 max-w-xl text-muted-foreground">{t('pandit.text')}</p>
            </div>
          </div>
          <Button
            size="lg"
            className="relative shrink-0"
            render={<Link href="/signup?role=pandit" />}
            nativeButton={false}
          >
            {t('pandit.cta')}
          </Button>
        </div>
      </section>
    </>
  );
}

/** A Sanskrit mantra: one row per line; padas wrap whole, never mid-way. */
function MantraBlock({ mantra, label, className }: { mantra: Mantra; label: string; className?: string }) {
  return (
    <figure aria-label={label} className="m-0">
      <blockquote lang="sa" className={cn('font-heading', className)}>
        {mantra.map((line) => (
          <p key={line.join(' ')} className="m-0">
            {line.map((pada, i) => (
              <Fragment key={pada}>
                {i > 0 && ' '}
                <span className="inline-block whitespace-nowrap">{pada}</span>
              </Fragment>
            ))}
          </p>
        ))}
      </blockquote>
    </figure>
  );
}
