// Google Analytics 4, loaded only in production builds with NEXT_PUBLIC_GA_MEASUREMENT_ID
// set (see components/analytics/google-analytics.tsx). `track()` is a no-op otherwise.
//
// Never send personal data: no names, birth details, phone numbers, emails or
// free text. Params are limited to the keys below, with short enum-like values.

const RAW_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? '';

/** The measurement id, when it looks like one ("G-XXXXXXX"); anything else disables GA. */
export const GA_MEASUREMENT_ID = /^G-[A-Z0-9]{4,16}$/.test(RAW_ID) ? RAW_ID : null;
export const GA_ENABLED = !!GA_MEASUREMENT_ID && process.env.NODE_ENV === 'production';

export type AnalyticsTool = 'kundali' | 'milan' | 'muhurat' | 'panchang' | 'rashifal';

export type AnalyticsEvent =
  | 'tool_view'
  | 'tool_submit'
  | 'preview_shown'
  | 'login_from_tool'
  | 'report_opened'
  | 'share_clicked'
  | 'ask_pandit_clicked'
  | 'booking_started'
  | 'booking_paid'
  | 'push_prompt_shown'
  | 'push_prompt_accepted'
  | 'install_prompt_accepted';

export type AnalyticsParams = {
  tool?: AnalyticsTool;
  /** share: whatsapp | copy | native | image */
  channel?: 'whatsapp' | 'copy' | 'native' | 'image';
  /** What was shared or where an action started (e.g. 'milan', 'muhurat', 'puja', 'report'). */
  source?: string;
  /** Muhurat tab or booking type. */
  kind?: string;
  /** Catalog slug of a puja (public data). */
  puja?: string;
  /** Payment amount in rupees (booking_paid). */
  value?: number;
  currency?: 'INR';
};

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

/** gtag() that queues into dataLayer even before the GA script has loaded. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- typed signature; the body pushes `arguments`
export function gtag(..._args: unknown[]) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  // gtag.js expects the Arguments object itself, not an array.
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

export function track(event: AnalyticsEvent, params: AnalyticsParams = {}) {
  if (!GA_ENABLED || typeof window === 'undefined') return;
  const clean: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === 'number' && Number.isFinite(v)) clean[k] = v;
    else if (typeof v === 'string' && v && v.length <= 64) clean[k] = v;
  }
  gtag('event', event, clean);
}
