import type { Locale } from '@/i18n/config';
import { pick } from '@/i18n/translate';

/**
 * Business details shown on /contact and the legal pages (/terms, /privacy,
 * /refund-policy). The owner edits them in Admin → Settings → Business details;
 * the site reads them from GET /public/business-profile (see
 * src/lib/business-profile.ts). The values below are only the fallback used
 * when the API can't be reached.
 *
 * Empty strings are never rendered: a blank field simply doesn't appear, so
 * no placeholder number or address is ever shown to visitors.
 */

/** As returned by the API. `*_hi` fields fall back to the English value. */
export type BusinessProfile = {
  legal_name: string;
  legal_name_hi: string;
  support_email: string;
  support_phone: string;
  support_hours: string;
  support_hours_hi: string;
  /** One line per address line. */
  postal_address: string;
  postal_address_hi: string;
  gstin: string;
  grievance_officer_name: string;
  grievance_officer_email: string;
  grievance_officer_phone: string;
  jurisdiction_city: string;
  jurisdiction_city_hi: string;
  /** Typical first-reply time promised on /contact; null hides the sentence. */
  response_hours: number | null;
  /** "Last updated" date on the legal pages (ISO yyyy-mm-dd). */
  legal_last_updated: string;
};

/** Brand used in running text (not editable: it's the product name). */
export const BRAND_NAME = 'Pooja Sevak';

/** Fallback when the API is down; mirrors the backend's seeded defaults. */
export const FALLBACK_BUSINESS_PROFILE: BusinessProfile = {
  legal_name: 'Pooja Sevak',
  legal_name_hi: 'पूजा सेवक',
  support_email: 'support@poojasevak.in',
  support_phone: '',
  support_hours: '',
  support_hours_hi: '',
  postal_address: '',
  postal_address_hi: '',
  gstin: '',
  grievance_officer_name: '',
  grievance_officer_email: '',
  grievance_officer_phone: '',
  jurisdiction_city: '',
  jurisdiction_city_hi: '',
  response_hours: 48,
  legal_last_updated: '2026-10-02',
};

/** The profile resolved for one language, ready to render. */
export type SiteInfo = {
  brandName: string;
  legalName: string;
  supportEmail: string;
  supportPhone: string;
  supportHours: string;
  postalAddress: readonly string[];
  jurisdictionCity: string;
  gstin: string;
  responseHours: number | null;
  grievanceOfficer: { name: string; email: string; phone: string };
  /** The grievance officer's address, else the support inbox. */
  grievanceEmail: string;
  legalLastUpdated: string;
};

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** Accepts anything (an API body) and returns a complete, trimmed profile. */
export function normalizeBusinessProfile(raw: unknown): BusinessProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const out = { ...FALLBACK_BUSINESS_PROFILE };
  for (const key of Object.keys(out) as (keyof BusinessProfile)[]) {
    if (key === 'response_hours') continue;
    (out as Record<string, unknown>)[key] = str(r[key]);
  }
  const hours = r.response_hours;
  out.response_hours = typeof hours === 'number' && Number.isInteger(hours) && hours > 0 ? hours : null;
  // Fields every page relies on keep their fallback if the API sends them blank.
  out.legal_name ||= FALLBACK_BUSINESS_PROFILE.legal_name;
  out.support_email ||= FALLBACK_BUSINESS_PROFILE.support_email;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(out.legal_last_updated)) {
    out.legal_last_updated = FALLBACK_BUSINESS_PROFILE.legal_last_updated;
  }
  return out;
}

export function siteInfoFor(p: BusinessProfile, locale: Locale): SiteInfo {
  const officerEmail = p.grievance_officer_email;
  return {
    brandName: BRAND_NAME,
    legalName: pick(p, 'legal_name', locale),
    supportEmail: p.support_email,
    supportPhone: p.support_phone,
    supportHours: pick(p, 'support_hours', locale),
    postalAddress: pick(p, 'postal_address', locale)
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean),
    jurisdictionCity: pick(p, 'jurisdiction_city', locale),
    gstin: p.gstin,
    responseHours: p.response_hours,
    grievanceOfficer: {
      name: p.grievance_officer_name,
      email: officerEmail,
      phone: p.grievance_officer_phone,
    },
    grievanceEmail: officerEmail || p.support_email,
    legalLastUpdated: p.legal_last_updated,
  };
}
