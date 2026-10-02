/** Public origin of the site (no trailing slash). Set NEXT_PUBLIC_SITE_URL in production / tunnels. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:6002').replace(/\/$/, '');

/** Absolute URL for a site path ('/pujas' → 'https://…/pujas'). */
export function absoluteUrl(path = '/'): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Path with `?lang=` set (the crawlable language variant handled by src/proxy.ts). */
export function withLang(path: string, lang: string): string {
  return `${path}${path.includes('?') ? '&' : '?'}lang=${lang}`;
}
