import Link from 'next/link';
import { ChevronDown, Video } from 'lucide-react';
import { getLocale, getT } from '@/i18n/server';
import { pick } from '@/i18n/translate';
import { PageShell } from '@/components/common/page-header';
import { JsonLd } from '@/components/seo/json-ld';
import { fetchCatalogList } from '@/lib/seo/data';
import { breadcrumbSchema, faqPageSchema } from '@/lib/seo/schema';
import { OnlineClient } from './online-client';

// Server-rendered below the interactive list so search engines always get the
// pujas offered online (internal links) and the online-puja FAQ (FAQPage).
const FAQ_IDS = ['what', 'which', 'join', 'abroad', 'sankalp', 'prasad'] as const;

export default async function OnlinePage() {
  const [t, ts, locale, catalog] = await Promise.all([
    getT('customer'),
    getT('seo'),
    getLocale(),
    fetchCatalogList(),
  ]);
  const online = (catalog ?? []).filter((p) => p.supports_online && p.is_active !== false);
  const faq = FAQ_IDS.map((id) => ({ id, question: t(`online.faq.${id}.q`), answer: t(`online.faq.${id}.a`) }));

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(
            [
              { name: ts('breadcrumb.home'), path: '/' },
              { name: t('online.breadcrumb'), path: '/online' },
            ],
            locale,
          ),
          faqPageSchema(faq, locale, '/online'),
        ]}
      />
      <OnlineClient />
      <PageShell size="wide" className="pt-0 sm:pt-0">
        {online.length > 0 && (
          <section aria-labelledby="online-pujas-h">
            <h2 id="online-pujas-h" className="text-2xl text-balance sm:text-3xl">
              {t('online.pujasTitle')}
            </h2>
            <p className="mt-2 max-w-[70ch] text-muted-foreground">{t('online.pujasLead')}</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {online.map((p) => (
                <li key={p.id} className="flex min-w-0">
                  <Link
                    href={`/pujas/${encodeURIComponent(p.slug)}`}
                    className="flex min-h-14 w-full min-w-0 items-center gap-3 rounded-xl border bg-card px-4 py-3 font-medium text-heading transition-colors hover:border-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <Video className="size-5 shrink-0 text-primary" aria-hidden="true" />
                    <span className="min-w-0">{t('online.pujaLink', { puja: pick(p, 'name', locale) })}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="online-faq-h" className="mt-12 max-w-[70ch]">
          <h2 id="online-faq-h" className="text-2xl sm:text-3xl">
            {t('online.faqTitle')}
          </h2>
          <div className="mt-4 divide-y rounded-2xl border bg-card">
            {faq.map((f) => (
              <details key={f.id} id={`online-${f.id}`} className="group scroll-mt-24 px-5">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-medium text-heading marker:hidden focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                  <span>{f.question}</span>
                  <ChevronDown
                    className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </summary>
                <p className="pb-5 leading-relaxed text-foreground/90">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </PageShell>
    </>
  );
}
