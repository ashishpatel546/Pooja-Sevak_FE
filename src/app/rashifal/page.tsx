import type { Metadata } from 'next';
import Link from 'next/link';
import { CloudOff, MoonStar } from 'lucide-react';
import { getLocale, getT } from '@/i18n/server';
import { publicMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema } from '@/lib/seo/schema';
import { civilDateLabel, todayIst } from '@/lib/rashifal';
import { JsonLd } from '@/components/seo/json-ld';
import { fetchRashifalOverview } from '@/components/rashifal/rashifal-server';
import { MyRashiPicker, RashiGrid } from '@/components/rashifal/rashi-ui';

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getT('rashifal'), getLocale()]);
  return publicMetadata({
    path: '/rashifal',
    title: t('meta.title', { date: civilDateLabel(todayIst(), locale) }),
    description: t('meta.description'),
    imageBase: '/rashifal',
  });
}

export default async function RashifalPage() {
  const locale = await getLocale();
  const today = todayIst();
  const [data, t, ts] = await Promise.all([fetchRashifalOverview(today, locale), getT('rashifal'), getT('seo')]);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema(
          [
            { name: ts('breadcrumb.home'), path: '/' },
            { name: t('breadcrumb.rashifal'), path: '/rashifal' },
          ],
          locale,
        )}
      />
      <section className="sandhya stars relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pt-12 pb-10 sm:px-6 sm:pt-16">
          <p lang="sa" className="font-heading text-lg text-diya">
            {t('hero.invocation')}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl leading-tight text-balance sm:text-5xl">
            {t('hero.title')} <span className="block text-2xl sm:text-3xl">{civilDateLabel(today, locale)}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg">{t('hero.intro')}</p>
          {data && (
            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
              <MoonStar className="size-5 text-diya" aria-hidden="true" />
              <span>
                {t('panchang.line', {
                  weekday: data.weekday_name,
                  tithi: data.tithi,
                  nakshatra: data.nakshatra,
                  moon: data.moon_sign_name,
                })}
              </span>
              <Link href="/panchang" className="font-medium underline underline-offset-4">
                {t('panchang.link')}
              </Link>
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="text-3xl">{t('grid.title')}</h2>
          <MyRashiPicker className="lg:max-w-md" />
        </div>
        {data ? (
          <RashiGrid signs={data.signs} />
        ) : (
          <div className="flex items-start gap-3 rounded-xl border border-dashed p-5 text-muted-foreground">
            <CloudOff className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <p>{t('error.unavailable')}</p>
          </div>
        )}
        {data && <p className="mt-10 max-w-3xl text-sm text-muted-foreground">{data.method}</p>}
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{t('note.disclaimer')}</p>
      </div>
    </>
  );
}
