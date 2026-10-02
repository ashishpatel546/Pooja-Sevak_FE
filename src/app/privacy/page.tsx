import type { Metadata } from 'next';
import { getLocale, getT } from '@/i18n/server';
import { JsonLd } from '@/components/seo/json-ld';
import { LegalDocument } from '@/components/info/legal-document';
import { LastUpdated, siteNodes } from '@/components/info/site-nodes';
import { linkClass } from '@/components/info/prose';
import { publicMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema } from '@/lib/seo/schema';
import { getSiteInfo } from '@/lib/business-profile';

const SECTIONS = [
  'collect',
  'location',
  'purposes',
  'consent',
  'sharing',
  'cookies',
  'retention',
  'rights',
  'children',
  'security',
  'location2',
  'grievance',
  'changes',
] as const;

const ANCHOR: Partial<Record<(typeof SECTIONS)[number], string>> = { location2: 'data-location' };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('legal');
  return publicMetadata({
    path: '/privacy',
    title: t('privacy.meta.title'),
    description: t('privacy.meta.description'),
  });
}

export default async function PrivacyPage() {
  const [t, tb, ts, locale, info] = await Promise.all([
    getT('legal'),
    getT('business'),
    getT('seo'),
    getLocale(),
    getSiteInfo(),
  ]);
  const officer = info.grievanceOfficer;
  const email = info.grievanceEmail;
  // Only filled-in fields are shown (edited in Admin → Settings → Business details).
  const rows: [string, React.ReactNode][] = [
    ...(officer.name ? [[t('privacy.grievance.name'), officer.name] as [string, React.ReactNode]] : []),
    [
      t('privacy.grievance.email'),
      <a key="e" href={`mailto:${email}`} className={linkClass}>
        {email}
      </a>,
    ],
    ...(officer.phone
      ? [
          [
            tb('public.phone'),
            <a key="p" href={`tel:${officer.phone.replace(/[^\d+]/g, '')}`} className={linkClass}>
              {officer.phone}
            </a>,
          ] as [string, React.ReactNode],
        ]
      : []),
    ...(info.postalAddress.length
      ? [
          [
            t('privacy.grievance.address'),
            <address key="a" className="not-italic">
              {info.postalAddress.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>,
          ] as [string, React.ReactNode],
        ]
      : []),
  ];
  const grievance = (
    <dl className="grid gap-x-6 gap-y-2 rounded-xl border bg-card p-5 sm:grid-cols-[auto_1fr]">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="font-medium text-heading">{label}</dt>
          <dd className="min-w-0 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );

  return (
    <>
      <JsonLd
        data={breadcrumbSchema(
          [
            { name: ts('breadcrumb.home'), path: '/' },
            { name: t('common.breadcrumb.privacy'), path: '/privacy' },
          ],
          locale,
        )}
      />
      <LegalDocument
        title={t('privacy.title')}
        intro={t('privacy.intro')}
        updated={<LastUpdated locale={locale} />}
        tocLabel={t('common.toc')}
        nodes={await siteNodes(info)}
        sections={SECTIONS.map((id) => ({
          id: ANCHOR[id] ?? id,
          title: t(`privacy.${id}.title`),
          body: t(`privacy.${id}.body`),
          extra: id === 'grievance' ? grievance : undefined,
        }))}
      />
    </>
  );
}
