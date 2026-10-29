'use client';

import { Suspense, useEffect } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { GA_ENABLED, GA_MEASUREMENT_ID, gtag } from '@/lib/analytics';

// Queue the setup once, when this module first loads in the browser, so it is in
// dataLayer before the first page_view (effects of children run before parents').
if (typeof window !== 'undefined' && GA_ENABLED && !(window as { __psGa?: boolean }).__psGa) {
  (window as { __psGa?: boolean }).__psGa = true;
  gtag('js', new Date());
  // Page views are sent by <PageViews>, so the automatic one is off.
  gtag('config', GA_MEASUREMENT_ID, { send_page_view: false, anonymize_ip: true });
}

/**
 * Sends a page_view on every App Router navigation. Only the path is sent —
 * never the query string or the page title, which could carry personal data.
 */
function PageViews() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    gtag('event', 'page_view', {
      page_path: pathname,
      page_location: `${window.location.origin}${pathname}`,
      language: document.documentElement.lang,
    });
  }, [pathname]);
  return null;
}

/**
 * GA4 via gtag.js; renders nothing unless this is a production build with a
 * measurement id. `nonce` is the request's CSP nonce (x-nonce, set by src/proxy.ts
 * under a nonce-based policy); the setup itself needs no inline script.
 */
export function GoogleAnalytics({ nonce }: { nonce?: string }) {
  if (!GA_ENABLED) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
        nonce={nonce}
      />
      <Suspense>
        <PageViews />
      </Suspense>
    </>
  );
}
