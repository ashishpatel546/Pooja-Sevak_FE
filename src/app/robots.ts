import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/site';

// Private areas are also marked noindex in their layouts; this keeps crawlers
// from spending time on them. Keep in step with the NOINDEX layouts.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/v1/',
        '/account',
        '/admin',
        '/pandit/',
        '/dashboard',
        '/bookings',
        '/reminders',
        '/addresses',
        '/login',
        '/signup',
        '/forgot-password',
        '/reset-password',
        '/verify-email',
        '/verify-mobile',
        '/auth/',
        '/pandits/*/book',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
