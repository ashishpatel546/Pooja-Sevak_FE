import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

// Browser API calls go to "/v1" on this site and are proxied to the backend
// (see rewrites below), so they are same-origin and never need CORS. An
// absolute NEXT_PUBLIC_API_URL (a separate API host) still works.
const apiOrigin = originOf(process.env.NEXT_PUBLIC_API_URL);
const backendApi = (process.env.API_INTERNAL_URL ?? "http://localhost:6001/v1").replace(/\/$/, "");

// Profile photos: /v1/media/avatars/... (same-origin) answers with a 302 to a
// short-lived presigned URL on the private S3 bucket, so the bucket host must
// be an allowed image source. MEDIA_IMG_ORIGIN overrides it (e.g. a CDN later).
const mediaImgOrigin =
  originOf(process.env.MEDIA_IMG_ORIGIN) ?? "https://pooja-sevak-dev-media-aps1.s3.ap-south-1.amazonaws.com";

/**
 * Enforced CSP: only directives that are safe without per-request nonces
 * (clickjacking, <base> hijacking, plugins, form targets).
 */
const enforcedCsp = [
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
].join("; ");

/**
 * Full policy in report-only mode: Next.js injects inline bootstrap scripts,
 * so a strict script-src needs nonces (proxy + dynamic rendering). Until then
 * violations are only reported to the console, never blocked.
 */
const reportOnlyCsp = [
  "default-src 'self'",
  // 'wasm-unsafe-eval' lets the PDF viewer compile pdf.js' WebAssembly decoders (no JS eval).
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isProd ? "" : " 'unsafe-eval'"} https://checkout.razorpay.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${mediaImgOrigin} https:`,
  "font-src 'self' data:",
  `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ""} https://api.razorpay.com https://lumberjack.razorpay.com${isProd ? "" : " ws: wss:"}`,
  "frame-src https://api.razorpay.com https://checkout.razorpay.com",
  // pdf.js (samagri list viewer) runs in a module worker bundled under /_next
  // ('self'); blob: covers its fallback of starting the worker from a Blob.
  // The PDF bytes are fetched same-origin (/v1/media/samagri/.../raw), so
  // connect-src needs no bucket host; rendered pages are blob: images.
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=(self)",
      'payment=(self "https://checkout.razorpay.com" "https://api.razorpay.com")',
      "usb=()",
      "browsing-topics=()",
    ].join(", "),
  },
  { key: "Content-Security-Policy", value: enforcedCsp },
  { key: "Content-Security-Policy-Report-Only", value: reportOnlyCsp },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  // Lets phones open the dev server through the Cloudflare tunnel (puja-sevak.appme.in).
  allowedDevOrigins: ["*.appme.in"],
  async rewrites() {
    return [{ source: "/v1/:path*", destination: `${backendApi}/:path*` }];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Browsers must see a new service worker as soon as it ships.
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "private, no-cache, max-age=0" }] },
      // Dev bundles keep their file names between rebuilds. Cloudflare's Browser
      // Cache TTL rewrites "no-cache" to 4 hours, so phones on the tunnel ran stale
      // code; "private, no-store" is left alone. Production files are content-hashed.
      ...(isProd
        ? []
        : [
            { source: "/_next/:path*", headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }] },
            // Browsers that cached dev bundles for 4 h before the rule above keep
            // using them (same file names, new contents). Dev pages tell the
            // browser to drop its HTTP cache for this site, so that can't recur.
            { source: "/((?!_next/|v1/|api/)(?!.*\\.\\w+$).*)", headers: [{ key: "Clear-Site-Data", value: '"cache"' }] },
          ]),
    ];
  },
};

export default nextConfig;
