'use client';

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

export type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (res: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void; confirm_close?: boolean };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, cb: (res: unknown) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export type CheckoutErrorCode = 'browser' | 'load' | 'unavailable';

/**
 * Checkout could not open. `code` maps to the 'customer' message
 * `error.checkout.<code>` (errorMessage() translates it); `message` is English.
 */
export class CheckoutError extends Error {
  constructor(public code: CheckoutErrorCode) {
    super(
      {
        browser: 'Checkout needs a browser.',
        load: 'Could not load the payment window. Check your connection and try again.',
        unavailable: 'The payment window is unavailable right now.',
      }[code],
    );
    this.name = 'CheckoutError';
  }
}

let loader: Promise<void> | null = null;

/** Load Razorpay Checkout once per page lifetime. */
export function loadRazorpay(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new CheckoutError('browser'));
  if (window.Razorpay) return Promise.resolve();
  if (loader) return loader;
  loader = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loader = null;
      script.remove();
      reject(new CheckoutError('load'));
    };
    document.body.appendChild(script);
  });
  return loader;
}

/** Thrown when the devotee closes the checkout without paying. */
export class CheckoutDismissedError extends Error {
  constructor() {
    super('Payment window closed');
    this.name = 'CheckoutDismissedError';
  }
}

export async function openRazorpayCheckout(opts: {
  key_id: string;
  order_id: string;
  amount: number; // paise
  currency?: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
}): Promise<RazorpaySuccess> {
  await loadRazorpay();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new CheckoutError('unavailable');
  return new Promise<RazorpaySuccess>((resolve, reject) => {
    const rzp = new Razorpay({
      key: opts.key_id,
      order_id: opts.order_id,
      amount: opts.amount,
      currency: opts.currency ?? 'INR',
      name: 'Pooja Sevak',
      description: opts.description,
      prefill: opts.prefill,
      theme: { color: '#C2410C' },
      handler: (res) => resolve(res),
      modal: { ondismiss: () => reject(new CheckoutDismissedError()) },
    });
    rzp.open();
  });
}
