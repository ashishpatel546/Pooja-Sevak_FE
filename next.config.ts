import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Browser API calls go to "/v1" on this site and are proxied to the backend
// (see rewrites below), so they are same-origin and never need CORS. An
// absolute NEXT_PUBLIC_API_URL (a separate API host) still works.
const backendApi = (process.env.API_INTERNAL_URL ?? "http://localhost:6001/v1").replace(/\/$/, "");

/**
 * Baseline CSP for every response (API proxy, files). Pages get the full nonce-based
 * policy from src/proxy.ts (src/lib/csp.ts); a page carrying both is held to both,
 * and these directives are all part of the full one.
 */
const baselineCsp = [
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
].join("; ");

// Stage and preview builds must stay out of search engines: only a production build
// with NEXT_PUBLIC_INDEXABLE=true is indexable (also read by robots.ts and the root layout).
const indexable = process.env.NEXT_PUBLIC_INDEXABLE === "true";
const NOINDEX_HEADER = { key: "X-Robots-Tag", value: "noindex, nofollow" };

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
  { key: "Content-Security-Policy", value: baselineCsp },
  ...(indexable ? [] : [NOINDEX_HEADER]),
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
      // The renderer's print page holds a private report behind a token in the URL.
      { source: "/kundali/print/:path*", headers: [NOINDEX_HEADER] },
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
