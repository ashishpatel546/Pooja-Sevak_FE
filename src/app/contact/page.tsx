import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { getLocale, getT } from '@/i18n/server';
import { PageHeader, PageShell } from '@/components/common/page-header';
import { JsonLd } from '@/components/seo/json-ld';
import { Prose, linkClass } from '@/components/info/prose';
import { siteNodes } from '@/components/info/site-nodes';
import { getSiteInfo } from '@/lib/business-profile';
import { publicMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema } from '@/lib/seo/schema';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('info');
  return publicMetadata({
    path: '/contact',
    title: t('contact.meta.title'),
    description: t('contact.meta.description'),
  });
}

function Channel({ icon: Icon, title, children }: { icon: typeof Mail; title: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 gap-4 rounded-2xl border bg-card p-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h2 className="font-sans text-base font-semibold text-heading">{title}</h2>
        <div className="mt-1 break-words">{children}</div>
      </div>
    </div>
  );
}

export default async function ContactPage() {
  const [t, ts, locale, info] = await Promise.all([getT('info'), getT('seo'), getLocale(), getSiteInfo()]);
  const nodes = await siteNodes(info);
  const { legalName, supportEmail, supportPhone, supportHours, postalAddress, gstin, responseHours } = info;

  return (
    <>
      <JsonLd
        data={breadcrumbSchema(
          [
            { name: ts('breadcrumb.home'), path: '/' },
            { name: t('contact.breadcrumb'), path: '/contact' },
          ],
          locale,
        )}
      />
      <PageShell>
        <PageHeader title={t('contact.title')} description={t('contact.lead')} />

        <div className="grid gap-4 md:grid-cols-2">
          <Channel icon={Mail} title={t('contact.email.title')}>
            <a href={`mailto:${supportEmail}`} className={`${linkClass} text-lg`}>
              {supportEmail}
            </a>
            <p className="mt-1 text-sm text-muted-foreground">{t('contact.email.text')}</p>
          </Channel>
          {supportPhone && (
            <Channel icon={Phone} title={t('contact.phone.title')}>
              <a href={`tel:${supportPhone.replace(/[^\d+]/g, '')}`} className={`${linkClass} text-lg`}>
                {supportPhone}
              </a>
              {supportHours && <p className="mt-1 text-sm text-muted-foreground">{supportHours}</p>}
            </Channel>
          )}
          {postalAddress.length > 0 && (
            <Channel icon={MapPin} title={t('contact.address.title')}>
              <address className="not-italic">
                <span className="block font-medium">{legalName}</span>
                {postalAddress.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
              {gstin && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('contact.gstin')}: {gstin}
                </p>
              )}
            </Channel>
          )}
        </div>

        {responseHours != null && (
          <p className="mt-6 flex max-w-[70ch] items-start gap-2 text-muted-foreground">
            <Clock className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span>{t('contact.response', { hours: responseHours })}</span>
          </p>
        )}

        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <section aria-labelledby="tips-h" className="max-w-[70ch]">
            <h2 id="tips-h" className="text-2xl">
              {t('contact.tips.title')}
            </h2>
            <div className="mt-3 space-y-4 leading-relaxed text-foreground/90">
              <Prose text={t('contact.tips.body')} nodes={nodes} />
            </div>
          </section>

          <section aria-labelledby="quick-h" className="rounded-2xl border bg-chandan p-5 sm:p-6">
            <h2 id="quick-h" className="text-2xl">
              {t('contact.quick.title')}
            </h2>
            <ul className="mt-3 space-y-1">
              {(
                [
                  ['/faq', t('contact.quick.faq')],
                  ['/refund-policy', t('contact.quick.refund')],
                  ['/bookings', t('contact.quick.bookings')],
                ] as const
              ).map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className={`${linkClass} inline-flex min-h-10 items-center`}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section aria-labelledby="pandit-h" className="mt-12 max-w-[70ch]">
          <h2 id="pandit-h" className="text-2xl">
            {t('contact.pandit.title')}
          </h2>
          <div className="mt-3 space-y-4 leading-relaxed text-foreground/90">
            <Prose text={t('contact.pandit.body')} nodes={nodes} />
          </div>
        </section>

        <div className="mt-10 max-w-[70ch] border-t pt-6 text-sm text-muted-foreground">
          <Prose text={t('contact.grievance')} nodes={nodes} />
        </div>
      </PageShell>
    </>
  );
}
