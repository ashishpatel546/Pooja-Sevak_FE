'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, TicketPercent, X } from 'lucide-react';
import { useFormat, useT } from '@/i18n';
import { api, ApiError } from '@/lib/api';
import type { BookingType, CouponQuote, MyCoupon, PujaMode } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Pricing = {
  pandit_service_id: string;
  puja_mode: PujaMode;
  booking_type: BookingType;
  samagri_by?: 'pandit';
};

const CODE = /^[A-Z0-9][A-Z0-9_-]{2,31}$/;
const normalize = (s: string) => s.trim().replace(/\s+/g, '').toUpperCase();

/** Machine code of a coupon rejection (422 { code: 'coupon_*' }), if any. */
export function couponErrorCode(e: unknown): string | null {
  if (!(e instanceof ApiError)) return null;
  const code = (e.payload as { code?: unknown } | null)?.code;
  return typeof code === 'string' && code.startsWith('coupon_') ? code : null;
}

/**
 * Coupon input for the booking wizard's review step. Previews the discount via
 * POST /coupons/validate (the server re-checks it when the booking is made),
 * re-checks when the price inputs change, and applies the customer's own
 * personal coupon (e.g. the referral welcome) automatically once.
 */
export function CouponField({
  token,
  pricing,
  quote,
  onQuote,
  disabled,
}: {
  token: string | null;
  pricing: Pricing;
  quote: CouponQuote | null;
  onQuote: (q: CouponQuote | null) => void;
  disabled?: boolean;
}) {
  const t = useT('growth');
  const f = useFormat();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auto, setAuto] = useState(false);
  const touched = useRef(false);
  const autoTried = useRef(false);
  const pricingKey = JSON.stringify(pricing);
  const lastKey = useRef(pricingKey);

  const messageFor = (e: unknown) => {
    const c = couponErrorCode(e);
    return c ? t(`coupon.error.${c}` as 'coupon.error.generic') : t('coupon.error.generic');
  };

  const validate = (raw: string) =>
    api<CouponQuote>('/coupons/validate', { method: 'POST', token, body: { code: raw, ...pricing } });

  const apply = async (raw = code) => {
    const c = normalize(raw);
    touched.current = true;
    if (!CODE.test(c)) {
      setError(t('coupon.error.coupon_not_found'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onQuote(await validate(c));
      setAuto(false);
      setCode('');
    } catch (e) {
      setError(messageFor(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    touched.current = true;
    setAuto(false);
    setError(null);
    onQuote(null);
  };

  // The customer's own coupon (referral welcome/reward) is applied once, silently.
  useEffect(() => {
    if (!token || disabled || autoTried.current || quote) return;
    autoTried.current = true;
    let cancelled = false;
    (async () => {
      try {
        const mine = await api<MyCoupon[]>('/coupons/mine', { token });
        for (const c of mine.filter((m) => m.status === 'available')) {
          try {
            const q = await validate(c.code);
            if (cancelled || touched.current) return;
            onQuote(q);
            setAuto(true);
            return;
          } catch {
            // not usable for this order (e.g. first-booking only): try the next
          }
        }
      } catch {
        // no personal coupons: nothing to do
      }
    })();
    return () => {
      // Unmounted (or re-run) before finishing: let the next run try again.
      cancelled = true;
      autoTried.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, disabled]);

  // Price inputs changed (mode, samagri kit, place): re-check the applied coupon.
  useEffect(() => {
    if (lastKey.current === pricingKey) return;
    lastKey.current = pricingKey;
    if (!quote || disabled) return;
    let cancelled = false;
    validate(quote.coupon.code)
      .then((q) => !cancelled && onQuote(q))
      .catch((e: unknown) => {
        if (cancelled) return;
        onQuote(null);
        setError(messageFor(e));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricingKey]);

  const amount = quote ? f.inr(quote.discount_paise / 100) : '';

  if (quote) {
    return (
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-tulsi/40 bg-tulsi/10 px-4 py-3">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-tulsi" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm" role="status">
          {auto
            ? t('coupon.yours', { code: quote.coupon.code, amount })
            : t('coupon.applied', { code: quote.coupon.code, amount })}
        </p>
        {!disabled && (
          <Button type="button" variant="ghost" size="sm" onClick={remove} className="min-h-11">
            <X aria-hidden="true" />
            {t('coupon.remove')}
          </Button>
        )}
      </div>
    );
  }

  if (disabled) return null;

  return (
    <form
      className="mt-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void apply();
      }}
    >
      <Label htmlFor="coupon-code" className="flex items-center gap-1.5">
        <TicketPercent className="size-4 text-primary" aria-hidden="true" />
        {t('coupon.label')}
      </Label>
      <div className="mt-2 flex gap-2">
        <Input
          id="coupon-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          placeholder={t('coupon.placeholder')}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={32}
          aria-invalid={!!error}
          aria-describedby={error ? 'coupon-code-error' : undefined}
          className="font-mono uppercase"
        />
        <Button type="submit" variant="outline" disabled={busy || !code.trim()} className="min-h-11">
          {busy ? t('coupon.applying') : t('coupon.apply')}
        </Button>
      </div>
      {error && (
        <p id="coupon-code-error" role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
