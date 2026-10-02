import type { Metadata } from 'next';
import { getLocale, getT } from '@/i18n/server';
import { JsonLd } from '@/components/seo/json-ld';
import { LegalDocument } from '@/components/info/legal-document';
import { LastUpdated, siteNodes } from '@/components/info/site-nodes';
import { publicMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema } from '@/lib/seo/schema';
import { getSiteInfo } from '@/lib/business-profile';

const SECTIONS = [
  'service',
  'accounts',
  'booking',
  'payments',
  'cancel',
  'online',
  'home',
  'pandits',
  'conduct',
  'reviews',
  'disclaimer',
  'liability',
  'termination',
  'changes',
  'law',
  'contact',
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('legal');
  return publicMetadata({ path: '/terms', title: t('terms.meta.title'), description: t('terms.meta.description') });
}

export default async function TermsPage() {
  const [t, ts, locale, info] = await Promise.all([getT('legal'), getT('seo'), getLocale(), getSiteInfo()]);
  const city = info.jurisdictionCity;
  return (
    <>
      <JsonLd
        data={breadcrumbSchema(
          [
            { name: ts('breadcrumb.home'), path: '/' },
            { name: t('common.breadcrumb.terms'), path: '/terms' },
          ],
          locale,
        )}
      />
      <LegalDocument
        title={t('terms.title')}
        intro={t('terms.intro')}
        updated={<LastUpdated locale={locale} />}
        tocLabel={t('common.toc')}
        nodes={await siteNodes(info)}
        sections={SECTIONS.map((id) => ({
          id,
          title: t(`terms.${id}.title`),
          body: id === 'law' && city ? `${t('terms.law.body')}\n\n${t('terms.law.city', { city })}` : t(`terms.${id}.body`),
        }))}
      />
    </>
  );
}
