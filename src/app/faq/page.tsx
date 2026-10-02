import type { Metadata } from 'next';
import { ChevronDown } from 'lucide-react';
import { getLocale, getT } from '@/i18n/server';
import { PageHeader, PageShell } from '@/components/common/page-header';
import { JsonLd } from '@/components/seo/json-ld';
import { Prose, inline, plainText } from '@/components/info/prose';
import { siteNodes, siteText } from '@/components/info/site-nodes';
import { publicMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, faqPageSchema } from '@/lib/seo/schema';

// Grouped questions; each id has `faq.<id>.q` and `faq.<id>.a` in the info namespace.
const GROUPS = [
  { key: 'booking', ids: ['book', 'area', 'online', 'samagri', 'verify'] },
  { key: 'payment', ids: ['pay', 'cancel', 'refund'] },
  { key: 'calendar', ids: ['smaran', 'panchang'] },
  { key: 'pandits', ids: ['pandits', 'fee', 'join'] },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('info');
  return publicMetadata({ path: '/faq', title: t('faq.meta.title'), description: t('faq.meta.description') });
}

export default async function FaqPage() {
  const [t, ts, locale] = await Promise.all([getT('info'), getT('seo'), getLocale()]);
  const nodes = await siteNodes();
  const text = await siteText();
  const all = GROUPS.flatMap((g) => g.ids);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(
            [
              { name: ts('breadcrumb.home'), path: '/' },
              { name: t('faq.breadcrumb'), path: '/faq' },
            ],
            locale,
          ),
          faqPageSchema(
            all.map((id) => ({
              question: plainText(t(`faq.${id}.q`), text),
              answer: plainText(t(`faq.${id}.a`), text),
            })),
            locale,
          ),
        ]}
      />
      <PageShell>
        <PageHeader title={t('faq.title')} description={inline(t('faq.lead'), nodes)} />

        <div className="max-w-[70ch]">
          {GROUPS.map((g) => (
            <section key={g.key} aria-labelledby={`faq-${g.key}`} className="mt-10 first:mt-0">
              <h2 id={`faq-${g.key}`} className="text-2xl sm:text-3xl">
                {t(`faq.group.${g.key}`)}
              </h2>
              <div className="mt-4 divide-y rounded-2xl border bg-card">
                {g.ids.map((id) => (
                  <details key={id} id={id} className="group scroll-mt-24 px-5">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-medium text-heading marker:hidden focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                      <span>{t(`faq.${id}.q`)}</span>
                      <ChevronDown
                        className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
                        aria-hidden="true"
                      />
                    </summary>
                    <div className="space-y-3 pb-5 leading-relaxed text-foreground/90">
                      <Prose text={t(`faq.${id}.a`)} nodes={nodes} />
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </PageShell>
    </>
  );
}
