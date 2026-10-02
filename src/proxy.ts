import { NextResponse, type NextRequest } from 'next/server';
import { LANG_PARAM, LOCALE_COOKIE, LOCALE_HEADER, isLocale } from '@/i18n/config';

/**
 * Crawlable language URLs: `?lang=en` / `?lang=hi` overrides the ps_locale
 * cookie for this request (via a request header read by getLocale()) and
 * remembers the choice in the cookie. Requests without `?lang=` never reach
 * this function (see the matcher), so normal cookie behaviour is unchanged.
 */
export function proxy(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get(LANG_PARAM);
  if (!isLocale(lang)) return NextResponse.next();

  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, lang);
  const response = NextResponse.next({ request: { headers } });
  if (request.cookies.get(LOCALE_COOKIE)?.value !== lang) {
    response.cookies.set(LOCALE_COOKIE, lang, { path: '/', maxAge: 31536000, sameSite: 'lax' });
  }
  return response;
}

export const config = {
  matcher: [
    {
      // Pages only: skip Next internals, the same-origin API (/v1) and files with an extension.
      source: '/((?!_next/|v1/|.*\\..*).*)',
      has: [{ type: 'query', key: 'lang' }],
    },
  ],
};
