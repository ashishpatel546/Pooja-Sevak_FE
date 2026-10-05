import type { Metadata } from 'next';
import Link from 'next/link';
import { BellRing, CloudOff } from 'lucide-react';
import { getLocale, getT } from '@/i18n/server';
import { publicMetadata } from '@/lib/seo/metadata';
import { placeName } from '@/lib/place';
import { cn } from '@/lib/utils';
import { activePitruPaksha, parsePanchangView, pujaNamesFrom } from '@/components/ritual/observance';
import { FestivalCalendar } from '@/components/ritual/festival-calendar';
import { fetchCatalog, loadPanchang } from '@/components/ritual/panchang-server';
import { PanchangViews } from '@/components/ritual/panchang-views';
import { PlaceSync } from '@/components/ritual/place-control';
import { PanchangToday } from '@/components/ritual/panchang-today';
import { PitruPakshaBand } from '@/components/ritual/pitru-paksha-band';
import { SacredDays } from '@/components/ritual/sacred-days';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('panchang');
  return publicMetadata({ path: '/panchang', title: t('meta.title'), description: t('meta.description') });
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Festivals are sparse, so their tab looks a year ahead. */
const FESTIVAL_DAYS = 366;

export default async function PanchangPage({ searchParams }: Props) {
  const [{ requested, place, today, day, upcoming, festivals }, catalog, t, locale, query] = await Promise.all([
    loadPanchang(90, { festivalDays: FESTIVAL_DAYS }),
    fetchCatalog(),
    getT('panchang'),
    getLocale(),
    searchParams,
  ]);
  const pitru = activePitruPaksha(today, day?.observances, upcoming);
  const pujaNames = pujaNamesFrom(catalog);
  const placeLabel = placeName(place, locale) ?? t('place.yourLocation');
  const h2 = cn('text-3xl sm:text-4xl', locale === 'hi' ? 'leading-[1.3]' : 'leading-tight');

  return (
    <>
      <PlaceSync requested={requested} />
      <PanchangToday day={day} today={today} place={place} requested={requested} />

      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {pitru && <PitruPakshaBand observance={pitru} className="mb-16" tz={place.tz} />}

        <section id="sacred-days" className="scroll-mt-24">
          <PanchangViews
            initial={parsePanchangView(query.view)}
            all={
              <>
                <div className="max-w-2xl">
                  <h2 className={h2}>{t('upcoming.title')}</h2>
                  <p className="mt-2 text-muted-foreground">{t('upcoming.intro', { place: placeLabel })}</p>
                </div>
                <div className="mt-8">
                  {upcoming === null ? (
                    <Unavailable text={t('upcoming.unavailable')} />
                  ) : upcoming.length === 0 ? (
                    <p className="text-muted-foreground">{t('upcoming.empty')}</p>
                  ) : (
                    <SacredDays items={upcoming} pujaNames={pujaNames} tz={place.tz} />
                  )}
                </div>
              </>
            }
            festivals={
              <>
                <div className="max-w-2xl">
                  <h2 className={h2}>{t('festivals.title')}</h2>
                  <p className="mt-2 text-muted-foreground">{t('festivals.intro', { place: placeLabel })}</p>
                </div>
                <div className="mt-8">
                  {festivals === null ? (
                    <Unavailable text={t('festivals.unavailable')} />
                  ) : festivals.length === 0 ? (
                    <p className="text-muted-foreground">{t('festivals.empty')}</p>
                  ) : (
                    <FestivalCalendar items={festivals} pujaNames={pujaNames} tz={place.tz} />
                  )}
                </div>
              </>
            }
          />
        </section>

        <aside className="mt-16 flex flex-col items-start gap-4 border-t pt-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <BellRing className="mt-1 size-6 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-heading text-2xl leading-snug text-heading">{t('cta.title')}</p>
              <p className="mt-1 max-w-xl text-muted-foreground">{t('cta.text')}</p>
            </div>
          </div>
          <Link
            href="/reminders?tab=preferences"
            className="inline-flex min-h-11 shrink-0 items-center rounded-lg border bg-card px-5 font-medium transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {t('cta.action')}
          </Link>
        </aside>
      </div>
    </>
  );
}

function Unavailable({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-dashed p-5 text-muted-foreground">
      <CloudOff className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <p>{text}</p>
    </div>
  );
}
