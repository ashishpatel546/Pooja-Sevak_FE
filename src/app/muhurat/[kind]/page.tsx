import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CloudOff, Info } from 'lucide-react';
import { getLocale, getT } from '@/i18n/server';
import { kindFromParam, kindRoute, MUHURAT_PUJA_SLUGS, pujaNamesOf, yearsLabel, DELHI } from '@/lib/muhurat';
import { todayIst } from '@/lib/rashifal';
import { fetchCatalogList } from '@/lib/seo/data';
import { publicMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema } from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/json-ld';
import { BookPuja, MuhuratFinderBody } from '@/components/muhurat/muhurat-finder';
import { KindLinks } from '@/components/muhurat/kind-links';
import { fetchDelhiMuhurats, type ServerMuhuratDay } from '@/components/muhurat/muhurat-server';

type Props = { params: Promise<{ kind: string }> };

/** Only the hyphenated route form (/muhurat/griha-pravesh) is a page. */
function kindOf(param: string) {
  const kind = kindFromParam(param);
  return kind && kindRoute(kind) === param ? kind : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const kind = kindOf((await params).kind);
  if (!kind) return {};
  const t = await getT('muhurat');
  return publicMetadata({
    path: `/muhurat/${kindRoute(kind)}`,
    title: t(`page.title.${kind}`, { years: yearsLabel() }),
    description: t('page.description', { kind: t(`kind.${kind}`) }),
  });
}

const DAYS_SHOWN = 12;

function DayList({ days, locale }: { days: ServerMuhuratDay[]; locale: 'hi' | 'en' }) {
  const intl = locale === 'hi' ? 'hi-IN' : 'en-IN';
  const dateFmt = new Intl.DateTimeFormat(intl, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  const timeFmt = new Intl.DateTimeFormat(intl, { hour: 'numeric', minute: '2-digit', timeZone: DELHI.tz });
  const pick = (b: { en: string; hi: string }) => (locale === 'hi' ? b.hi : b.en);
  return (
    <ol className="grid gap-3">
      {days.map((d) => (
        <li key={d.date} className="grid gap-1 rounded-2xl border bg-card p-4 sm:grid-cols-[14rem_1fr] sm:gap-4">
          <p className="font-heading text-xl text-heading">{dateFmt.format(new Date(`${d.date}T00:00:00Z`))}</p>
          <div>
            <p>
              {pick(d.tithi_name)} · {pick(d.nakshatra_name)} · {pick(d.lunar_month)}
            </p>
            <p className="text-sm text-muted-foreground tabular-nums">
              {d.windows.map((w) => `${timeFmt.format(new Date(w.start))} – ${timeFmt.format(new Date(w.end))}`).join(', ')}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default async function MuhuratKindPage({ params }: Props) {
  const kind = kindOf((await params).kind);
  if (!kind) notFound();
  const today = todayIst();
  const [locale, t, ts, catalog, soon] = await Promise.all([
    getLocale(),
    getT('muhurat'),
    getT('seo'),
    fetchCatalogList(),
    fetchDelhiMuhurats(kind, today, 3),
  ]);
  // Nothing in three months (e.g. upanayan outside its months): look a year ahead.
  const later = soon && soon.length === 0 ? await fetchDelhiMuhurats(kind, today, 12) : null;
  const label = t(`kind.${kind}`);
  const pujaNames = pujaNamesOf(catalog);
  const pujas = MUHURAT_PUJA_SLUGS[kind].filter((s) => pujaNames[s]).map((slug) => ({ slug, name: pujaNames[slug] }));
  const place = locale === 'hi' ? DELHI.label_hi : DELHI.label;

  return (
    <>
      <JsonLd
        data={breadcrumbSchema(
          [
            { name: ts('breadcrumb.home'), path: '/' },
            { name: t('page.hub'), path: '/muhurat' },
            { name: t('page.h1', { kind: label }), path: `/muhurat/${kindRoute(kind)}` },
          ],
          locale,
        )}
      />
      <section className="sandhya stars relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-10 sm:px-6 sm:pt-14">
          <nav aria-label={ts('breadcrumb.home')} className="text-sm">
            <Link href="/muhurat" className="underline-offset-4 hover:underline">
              {t('page.hub')}
            </Link>
            <span aria-hidden="true"> / </span>
            <span>{label}</span>
          </nav>
          <h1 className="mt-3 max-w-3xl text-4xl leading-tight text-balance sm:text-5xl">
            {t('page.h1', { kind: label })} <span className="text-3xl">{yearsLabel()}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg">{t('page.intro', { kind: label })}</p>
          <p className="mt-2 max-w-2xl">{t(`kindDesc.${kind}`)}</p>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-12">
        <section aria-labelledby="soon">
          <h2 id="soon" className="text-3xl">
            {t('page.listTitle', { place })}
          </h2>
          <p className="mt-1 text-muted-foreground">{t('page.listNote')}</p>
          <div className="mt-5">
            {soon === null ? (
              <p className="flex items-start gap-3 rounded-xl border border-dashed p-5 text-muted-foreground">
                <CloudOff className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                {t('page.listError')}
              </p>
            ) : soon.length ? (
              <DayList days={soon.slice(0, DAYS_SHOWN)} locale={locale} />
            ) : later?.length ? (
              <>
                <p className="mb-3">{t('page.listLater')}</p>
                <DayList days={later.slice(0, DAYS_SHOWN)} locale={locale} />
              </>
            ) : (
              <p className="text-muted-foreground">{t('page.listNone')}</p>
            )}
          </div>
          <details className="mt-5 rounded-2xl border bg-card p-5">
            <summary className="cursor-pointer font-heading text-lg text-heading">{t('rules.title')}</summary>
            <div className="mt-3 grid gap-2 text-sm">
              <p>{t(`rules.${kind}`)}</p>
              <p>{t('rules.common')}</p>
            </div>
          </details>
        </section>

        <p className="flex gap-3 rounded-2xl border border-diya/50 bg-chandan/60 p-4 sm:p-5">
          <Info className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          {t('note.guidance')}
        </p>

        {pujas.length > 0 && <BookPuja kind={kind} pujas={pujas} />}

        <section aria-labelledby="finder">
          <h2 id="finder" className="mb-5 text-3xl">
            {t('page.finderTitle')}
          </h2>
          <MuhuratFinderBody kind={kind} pujaNames={pujaNames} withPlace />
        </section>

        <KindLinks current={kind} />
      </div>
    </>
  );
}
