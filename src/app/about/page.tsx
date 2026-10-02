import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarHeart, HandHeart, ListChecks, NotebookPen } from 'lucide-react';
import { getLocale, getT } from '@/i18n/server';
import { PageHeader, PageShell } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { JsonLd } from '@/components/seo/json-ld';
import { Prose } from '@/components/info/prose';
import { siteNodes } from '@/components/info/site-nodes';
import { publicMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema } from '@/lib/seo/schema';

const STEPS = [
  { icon: ListChecks, key: 'step1' },
  { icon: NotebookPen, key: 'step2' },
  { icon: HandHeart, key: 'step3' },
  { icon: CalendarHeart, key: 'step4' },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('info');
  return publicMetadata({ path: '/about', title: t('about.meta.title'), description: t('about.meta.description') });
}

export default async function AboutPage() {
  const [t, ts, locale] = await Promise.all([getT('info'), getT('seo'), getLocale()]);
  const nodes = await siteNodes();
  return (
    <>
      <JsonLd
        data={breadcrumbSchema(
          [
            { name: ts('breadcrumb.home'), path: '/' },
            { name: t('about.breadcrumb'), path: '/about' },
          ],
          locale,
        )}
      />
      <PageShell>
        <PageHeader title={t('about.title')} className="mb-6" />
        <p className="max-w-[70ch] text-lg leading-relaxed text-foreground/90">{t('about.lead')}</p>
        <div className="toran mt-8 mb-12 max-w-[70ch]" aria-hidden="true" />

        <section aria-labelledby="what-h" className="max-w-[70ch]">
          <h2 id="what-h" className="text-2xl sm:text-3xl">
            {t('about.what.title')}
          </h2>
          <div className="mt-3 space-y-4 leading-relaxed text-foreground/90">
            <Prose text={t('about.what.body')} nodes={nodes} />
          </div>
        </section>

        <section aria-labelledby="how-h" className="mt-14 rounded-2xl border bg-chandan p-5 sm:p-8">
          <h2 id="how-h" className="text-2xl sm:text-3xl">
            {t('about.how.title')}
          </h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.key} className="flex min-w-0 gap-4 lg:flex-col lg:gap-3">
                <span className="flex items-center gap-3">
                  <span
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-primary font-heading text-lg text-primary-foreground"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <s.icon className="hidden size-5 text-primary lg:block" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-medium text-heading">{t(`about.how.${s.key}.title`)}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{t(`about.how.${s.key}.text`)}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="verify-h" className="mt-14 max-w-[70ch]">
          <h2 id="verify-h" className="text-2xl sm:text-3xl">
            {t('about.verify.title')}
          </h2>
          <div className="mt-3 space-y-4 leading-relaxed text-foreground/90">
            <Prose text={t('about.verify.body')} nodes={nodes} />
          </div>
        </section>

        <section aria-labelledby="values-h" className="mt-14 max-w-[70ch]">
          <h2 id="values-h" className="text-2xl sm:text-3xl">
            {t('about.values.title')}
          </h2>
          <div className="mt-3 space-y-4 leading-relaxed text-foreground/90">
            <Prose text={t('about.values.body')} nodes={nodes} />
          </div>
        </section>

        <aside
          aria-labelledby="about-cta-h"
          className="mt-16 flex flex-col items-start gap-5 border-t pt-10 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h2 id="about-cta-h" className="text-2xl leading-snug">
              {t('about.cta.title')}
            </h2>
            <p className="mt-1 max-w-xl text-muted-foreground">{t('about.cta.text')}</p>
            <Link
              href="/signup?role=pandit"
              className="mt-3 inline-flex min-h-9 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t('about.cta.pandit')}
            </Link>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button size="lg" render={<Link href="/pujas" />} nativeButton={false}>
              {t('about.cta.pujas')}
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/online" />} nativeButton={false}>
              {t('about.cta.online')}
            </Button>
          </div>
        </aside>
      </PageShell>
    </>
  );
}
