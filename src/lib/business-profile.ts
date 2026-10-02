import 'server-only';
import { cache } from 'react';
import { serverApiBase } from '@/lib/api';
import { getLocale } from '@/i18n/server';
import {
  FALLBACK_BUSINESS_PROFILE,
  normalizeBusinessProfile,
  siteInfoFor,
  type BusinessProfile,
  type SiteInfo,
} from '@/lib/site-info';

/** Cache tag; POST /api/revalidate/business-profile expires it after an admin save. */
export const BUSINESS_PROFILE_TAG = 'business-profile';
const REVALIDATE = 300;
const TIMEOUT_MS = 4000;

/** The owner-edited business details; falls back to site-info.ts when the API is down. */
export const fetchBusinessProfile = cache(async (): Promise<BusinessProfile> => {
  try {
    const res = await fetch(`${serverApiBase()}/public/business-profile`, {
      next: { revalidate: REVALIDATE, tags: [BUSINESS_PROFILE_TAG] },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return FALLBACK_BUSINESS_PROFILE;
    return normalizeBusinessProfile(await res.json()) ?? FALLBACK_BUSINESS_PROFILE;
  } catch {
    return FALLBACK_BUSINESS_PROFILE;
  }
});

/** Business details resolved for the visitor's language. */
export async function getSiteInfo(): Promise<SiteInfo> {
  const [profile, locale] = await Promise.all([fetchBusinessProfile(), getLocale()]);
  return siteInfoFor(profile, locale);
}
