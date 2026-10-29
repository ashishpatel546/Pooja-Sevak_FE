import { NextResponse, type NextRequest } from 'next/server';
import { LANG_PARAM, LOCALE_COOKIE, LOCALE_HEADER, isLocale } from '@/i18n/config';
import { buildCsp, createNonce, NONCE_HEADER } from '@/lib/csp';

/**
 * Every page request:
 * - Content Security Policy with a fresh nonce (src/lib/csp.ts). Next.js reads the nonce
 *   from the request's CSP header and applies it to its scripts; pages are all rendered
 *   per request already, so this costs no static pages.
 * - Crawlable language URLs: `?lang=en` / `?lang=hi` overrides the ps_locale cookie for
 *   this request (via a request header read by getLocale()) and remembers the choice in
 *   the cookie. Without `?lang=` the normal cookie behaviour is unchanged.
 */
export function proxy(request: NextRequest) {
  const nonce = createNonce();
  const csp = buildCsp(nonce);
  const headers = new Headers(request.headers);
  headers.set(NONCE_HEADER, nonce);
  headers.set('Content-Security-Policy', csp);

  const lang = request.nextUrl.searchParams.get(LANG_PARAM);
  if (isLocale(lang)) headers.set(LOCALE_HEADER, lang);

  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy', csp);
  if (isLocale(lang) && request.cookies.get(LOCALE_COOKIE)?.value !== lang) {
    response.cookies.set(LOCALE_COOKIE, lang, { path: '/', maxAge: 31536000, sameSite: 'lax' });
  }
  return response;
}

export const config = {
  matcher: [
    {
      // Pages only: skip Next internals, the same-origin API (/v1) and files with an extension.
      // Prefetches still run it, so a prefetched `?lang=` page comes in the right language.
      source: '/((?!_next/|v1/|.*\\..*).*)',
    },
  ],
};
