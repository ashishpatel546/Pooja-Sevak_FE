import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale, getT } from '@/i18n/server';
import { INTL_LOCALE, type Locale } from '@/i18n/config';
import type { Translator } from '@/i18n/translate';
import { istDateKey } from '@/lib/format';
import {
  kindRoute,
  parseMuhuratQuery,
  pujaNamesOf,
  yearsLabel,
  type MuhuratKind,
  type MuhuratSearch,
} from '@/lib/muhurat';
import { fetchMuhuratDates } from '@/lib/muhurat-server';
import { placeName } from '@/lib/place';
import { fetchCatalogList } from '@/lib/seo/data';
import { publicMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, webApplicationSchema } from '@/lib/seo/schema';
import { MuhuratFinder } from '@/components/muhurat/muhurat-finder';
import { KindLinks } from '@/components/muhurat/kind-links';
import { getPlace } from '@/components/ritual/panchang-server';
import { JsonLd } from '@/components/seo/json-ld';
import { ToolArticle } from '@/components/tools/tool-article';
import { ToolLinks } from '@/components/tools/tool-links';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** The finder's default range; the server list shows its first three months. */
const MONTHS = 6;
const LIST_MONTHS = 3;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('muhurat');
  return publicMetadata({
    path: '/muhurat',
    title: t('meta.title', { years: yearsLabel() }),
    description: t('meta.description'),
    imageBase: '/muhurat',
  });
}

/** Server-rendered list of the next dates for the chosen kind, so the page carries real dates for every reader. */
function UpcomingDates({
  kind,
  data,
  placeLabel,
  locale,
  t,
  tm,
}: {
  kind: MuhuratKind;
  data: MuhuratSearch | null;
  placeLabel: string;
  locale: Locale;
  t: Translator<'tools'>;
  tm: Translator<'muhurat'>;
}) {
  if (!data) return null;
  const until = istDateKey(LIST_MONTHS * 31).slice(0, 7);
  const days = data.days.filter((d) => d.date.slice(0, 7) <= until);
  const fmt = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const name = (b: { en: string; hi: string }) => (locale === 'hi' ? b.hi : b.en);
  const vars = { place: placeLabel, kind: tm(`kind.${kind}`) };
  return (
    <section aria-labelledby="upcoming-dates" className="mt-8">
      <h3 id="upcoming-dates" className="font-heading text-2xl text-heading">
        {t('muhurat.upcomingTitle', vars)}
      </h3>
      <p className="mt-2 text-muted-foreground">{t('muhurat.upcomingIntro', vars)}</p>
      {days.length === 0 ? (
        <p className="mt-3">{t('muhurat.upcomingNone', vars)}</p>
      ) : (
        <ul className="mt-3 grid gap-1.5">
          {days.map((d) => (
            <li key={d.date} className="leading-relaxed">
              <time dateTime={d.date} className="font-medium">
                {fmt.format(new Date(`${d.date}T00:00:00Z`))}
              </time>
              <span className="text-muted-foreground">
                {' '}
                — {name(d.tithi_name)}, {name(d.nakshatra_name)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3">
        <Link href={`/muhurat/${kindRoute(kind)}`} className="font-medium text-primary underline-offset-4 hover:underline">
          {tm('page.h1', { kind: tm(`kind.${kind}`) })}
        </Link>
      </p>
    </section>
  );
}

/**
 * The muhurat hub: every kind in one finder. `?kind=` (vivah, griha-pravesh, mundan, …,
 * or `day`), `?from=YYYY-MM-DD` and `?date=YYYY-MM-DD` prefill it (lib/muhurat.ts).
 */
export default async function MuhuratPage({ searchParams }: Props) {
  const prefill = parseMuhuratQuery(await searchParams);
  const place = await getPlace();
  const [data, catalog, tt, tm, ts, tc, tp, locale] = await Promise.all([
    fetchMuhuratDates(prefill.kind, MONTHS, place, prefill.from),
    fetchCatalogList(),
    getT('tools'),
    getT('muhurat'),
    getT('seo'),
    getT('common'),
    getT('panchang'),
    getLocale(),
  ]);
  const placeLabel = placeName(place, locale) ?? tp('place.yourLocation');

  return (
    <>
      <JsonLd
        data={[
          webApplicationSchema({
            name: tm('hero.title'),
            description: tm('meta.description'),
            path: '/muhurat',
            locale,
            brand: tc('brand.name'),
          }),
          breadcrumbSchema(
            [
              { name: ts('breadcrumb.home'), path: '/' },
              { name: tt('breadcrumb.muhurat'), path: '/muhurat' },
            ],
            locale,
          ),
        ]}
      />
      <MuhuratFinder
        kind={prefill.kind}
        tab={prefill.tab}
        from={prefill.from}
        date={prefill.date}
        pujaNames={pujaNamesOf(catalog)}
        initial={data ? { kind: prefill.kind, months: MONTHS, from: prefill.from, place, data } : null}
      />
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6">
        <KindLinks />
        <ToolArticle page="muhurat" path="/muhurat" className="mt-12 border-t pt-12">
          <UpcomingDates kind={prefill.kind} data={data} placeLabel={placeLabel} locale={locale} t={tt} tm={tm} />
        </ToolArticle>
        <ToolLinks current="muhurat" className="mt-16" />
      </div>
    </>
  );
}
