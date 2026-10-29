/**
 * Content Security Policy for pages, set per request by src/proxy.ts with a fresh nonce.
 * Next.js reads the nonce from the request's CSP header and puts it on its own scripts;
 * 'strict-dynamic' then lets those scripts load others (Razorpay Checkout, pdf.js).
 *
 * Third-party scripts added later (e.g. Google Analytics via next/script) must carry the
 * nonce: in a server component, `nonce={(await headers()).get(NONCE_HEADER) ?? undefined}`.
 */

/** Request header carrying this request's nonce to server components. */
export const NONCE_HEADER = 'x-nonce';

// Google Analytics 4 (gtag.js): the loader, its collection endpoints and pixel images.
const GA_SCRIPT = 'https://www.googletagmanager.com';
const GA_CONNECT = [
  'https://www.googletagmanager.com',
  'https://www.google-analytics.com',
  'https://*.google-analytics.com',
  'https://*.analytics.google.com',
];
const GA_IMG = ['https://www.googletagmanager.com', 'https://www.google-analytics.com', 'https://*.google-analytics.com'];

function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/** A random per-request nonce (base64 of a UUID, as in the Next.js CSP guide). */
export function createNonce(): string {
  return btoa(crypto.randomUUID());
}

export function buildCsp(nonce: string, isDev = process.env.NODE_ENV !== 'production'): string {
  // Absolute NEXT_PUBLIC_API_URL = a separate API host the browser calls directly.
  const apiOrigin = originOf(process.env.NEXT_PUBLIC_API_URL);
  // Profile photos redirect to presigned URLs on the private S3 bucket (see next.config.ts).
  const mediaImgOrigin =
    originOf(process.env.MEDIA_IMG_ORIGIN) ?? 'https://pooja-sevak-dev-media-aps1.s3.ap-south-1.amazonaws.com';
  return [
    "default-src 'self'",
    // Host sources only matter to browsers without 'strict-dynamic' (CSP2), which ignore it.
    // 'wasm-unsafe-eval' lets pdf.js compile its WebAssembly decoders (no JS eval);
    // dev needs 'unsafe-eval' for React's debugging helpers.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ''} https://checkout.razorpay.com ${GA_SCRIPT}`,
    // React and the UI kit set style attributes; a style nonce would turn those off.
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${mediaImgOrigin} ${GA_IMG.join(' ')} https:`,
    "font-src 'self' data:",
    `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ''} https://api.razorpay.com https://lumberjack.razorpay.com ${GA_CONNECT.join(' ')}${isDev ? ' ws: wss:' : ''}`,
    'frame-src https://api.razorpay.com https://checkout.razorpay.com',
    // pdf.js (samagri list viewer) runs in a module worker under /_next ('self'), or from a Blob.
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
  ].join('; ');
}
