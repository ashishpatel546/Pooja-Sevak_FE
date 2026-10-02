import type { Metadata } from 'next';
import { getLocale, getT } from '@/i18n/server';
import { JsonLd } from '@/components/seo/json-ld';
import { LegalDocument } from '@/components/info/legal-document';
import { LastUpdated, siteNodes } from '@/components/info/site-nodes';
import { publicMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema } from '@/lib/seo/schema';

// Mirrors backend/src/booking: cancel allowed until completed, full automatic
// refund of paid bookings, unpaid bookings expire after 30 minutes.
const SECTIONS = ['glance', 'paying', 'byYou', 'byUs', 'timeline', 'failed', 'completed', 'reschedule', 'contact'] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('legal');
  return publicMetadata({
    path: '/refund-policy',
    title: t('refund.meta.title'),
    description: t('refund.meta.description'),
  });
}

export default async function RefundPolicyPage() {
  const [t, ts, locale] = await Promise.all([getT('legal'), getT('seo'), getLocale()]);
  return (
    <>
      <JsonLd
        data={breadcrumbSchema(
          [
            { name: ts('breadcrumb.home'), path: '/' },
            { name: t('common.breadcrumb.refund'), path: '/refund-policy' },
          ],
          locale,
        )}
      />
      <LegalDocument
        title={t('refund.title')}
        intro={t('refund.intro')}
        updated={<LastUpdated locale={locale} />}
        tocLabel={t('common.toc')}
        nodes={await siteNodes()}
        sections={SECTIONS.map((id) => ({
          id: id === 'byYou' ? 'by-you' : id === 'byUs' ? 'by-us' : id,
          title: t(`refund.${id}.title`),
          body: t(`refund.${id}.body`),
        }))}
      />
    </>
  );
}
