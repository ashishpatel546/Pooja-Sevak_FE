import 'server-only';
import type { ReactNode } from 'react';
import { INTL_LOCALE, type Locale } from '@/i18n/config';
import { getT } from '@/i18n/server';
import { getSiteInfo } from '@/lib/business-profile';
import type { SiteInfo } from '@/lib/site-info';
import { rich } from '@/components/common/rich';
import { linkClass } from './prose';

function mail(address: string) {
  return (
    <a href={`mailto:${address}`} className={linkClass}>
      {address}
    </a>
  );
}

/** Placeholder values for <Prose> copy on the info and legal pages. */
export async function siteNodes(info?: SiteInfo): Promise<Record<string, ReactNode>> {
  const s = info ?? (await getSiteInfo());
  return {
    brand: s.brandName,
    legalName: s.legalName,
    email: mail(s.supportEmail),
    grievanceEmail: mail(s.grievanceEmail),
  };
}

/** Plain-text versions of the same placeholders (for JSON-LD). */
export async function siteText(info?: SiteInfo): Promise<Record<string, string>> {
  const s = info ?? (await getSiteInfo());
  return {
    brand: s.brandName,
    legalName: s.legalName,
    email: s.supportEmail,
    grievanceEmail: s.grievanceEmail,
  };
}

/** "Last updated: 2 October 2026" with a machine-readable <time>. */
export async function LastUpdated({ locale }: { locale: Locale }) {
  const [t, info] = await Promise.all([getT('legal'), getSiteInfo()]);
  const iso = info.legalLastUpdated;
  if (!iso) return null;
  const date = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
  return <>{rich(t('common.updated'), { date: <time dateTime={iso}>{date}</time> })}</>;
}
