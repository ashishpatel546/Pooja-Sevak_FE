import type { Metadata } from 'next';
import { getLocale, getT } from '@/i18n/server';
import { INTL_LOCALE, type Locale } from '@/i18n/config';
import type { Translator } from '@/i18n/translate';
import { parseDateKey } from '@/lib/booking-date';
import { istDateKey } from '@/lib/format';
import type { MuhuratSearch } from '@/lib/muhurat';
import { fetchMuhuratDates } from '@/lib/muhurat-server';
import { placeName } from '@/lib/place';
import { publicMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, webApplicationSchema } from '@/lib/seo/schema';
import { MUHURAT_TABS, type MuhuratTab } from '@/lib/tools';
import { MuhuratFinder } from '@/components/muhurat/muhurat-finder';
import { getPlace } from '@/components/ritual/panchang-server';
import { JsonLd } from '@/components/seo/json-ld';
import { ToolArticle } from '@/components/tools/tool-article';
import { ToolLinks } from '@/components/tools/tool-links';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** The finder's default range; the server list shows its first three months. */
const MONTHS = 6;
const LIST_MONTHS = 3;

/** "2026–27": this year and the next, so the title stays current. */
function seasonYears(): { from: number; to: string } {
  const y = Number(istDateKey().slice(0, 4));
  return { from: y, to: String(y + 1).slice(2) };
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('muhurat');
  return publicMetadata({
    path: '/muhurat',
    title: t('meta.title', { years: `${seasonYears().from}–${seasonYears().to}` }),
    description: t('meta.description'),
    imageBase: '/muhurat',
  });
}

/** Server-rendered list of the next vivah dates, so the page carries real dates for every reader. */
function UpcomingVivah({ data, placeLabel, locale, t }: {
  data: MuhuratSearch | null;
  placeLabel: string;
  locale: Locale;
  t: Translator<'tools'>;
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
  return (
    <section aria-labelledby="upcoming-vivah" className="mt-8">
      <h3 id="upcoming-vivah" className="font-heading text-2xl text-heading">
        {t('muhurat.upcomingTitle')}
      </h3>
      <p className="mt-2 text-muted-foreground">{t('muhurat.upcomingIntro', { place: placeLabel })}</p>
      {days.length === 0 ? (
        <p className="mt-3">{t('muhurat.upcomingNone', { place: placeLabel })}</p>
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
    </section>
  );
}

export default async function MuhuratPage({ searchParams }: Props) {
  const q = await searchParams;
  const kind = typeof q.kind === 'string' && (MUHURAT_TABS as string[]).includes(q.kind) ? (q.kind as MuhuratTab) : 'vivah';
  const date = parseDateKey(q.date);
  const place = await getPlace();
  const [data, tt, tm, ts, tc, tp, locale] = await Promise.all([
    fetchMuhuratDates('vivah', MONTHS, place),
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
        initialTab={kind}
        initialDate={kind === 'day' ? date : null}
        initial={data ? { kind: 'vivah', months: MONTHS, place, data } : null}
      />
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6">
        <ToolArticle page="muhurat" path="/muhurat" className="border-t pt-12">
          <UpcomingVivah data={data} placeLabel={placeLabel} locale={locale} t={tt} />
        </ToolArticle>
        <ToolLinks current="muhurat" className="mt-16" />
      </div>
    </>
  );
}
