'use client';

import { useCallback, useRef, useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useFormat, useT } from '@/i18n';
import { CheckoutDismissedError, openRazorpayCheckout } from '@/lib/razorpay';
import type { Booking, PaymentOrder } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type MockRequest = { order: PaymentOrder; resolve: (paymentId: string | null) => void };

export type PaymentResult =
  | { status: 'paid'; booking: Booking }
  | { status: 'abandoned' };

/**
 * Shared payment flow: create order → open checkout (Razorpay or the
 * test-payment dialog) → verify. Render `paymentDialog` once in the page.
 * `pay()` throws on API errors; returns `abandoned` if the window is closed.
 */
export function usePayment() {
  const { token, user } = useAuth();
  const t = useT('customer');
  const f = useFormat();
  const [paying, setPaying] = useState(false);
  const [mock, setMock] = useState<MockRequest | null>(null);
  const settled = useRef(false);

  const pay = useCallback(
    async (booking: Pick<Booking, 'id'> & { description?: string }): Promise<PaymentResult> => {
      setPaying(true);
      try {
        const order = await api<PaymentOrder>(`/payments/bookings/${booking.id}/order`, {
          method: 'POST',
          token,
        });

        let proof: { order_id: string; payment_id: string; signature?: string } | null = null;

        if (order.provider === 'razorpay' && order.key_id) {
          try {
            const res = await openRazorpayCheckout({
              key_id: order.key_id,
              order_id: order.order_id,
              amount: Number(order.amount),
              currency: order.currency,
              description: booking.description,
              prefill: {
                name: user?.name,
                email: user?.email,
                contact: user?.mobile ?? undefined,
              },
            });
            proof = {
              order_id: res.razorpay_order_id,
              payment_id: res.razorpay_payment_id,
              signature: res.razorpay_signature,
            };
          } catch (e) {
            if (e instanceof CheckoutDismissedError) return { status: 'abandoned' };
            throw e;
          }
        } else {
          settled.current = false;
          const paymentId = await new Promise<string | null>((resolve) => setMock({ order, resolve }));
          if (!paymentId) return { status: 'abandoned' };
          proof = { order_id: order.order_id, payment_id: paymentId };
        }

        const verified = await api<Booking>(`/payments/bookings/${booking.id}/verify`, {
          method: 'POST',
          token,
          body: proof,
        });
        return { status: 'paid', booking: verified };
      } finally {
        setPaying(false);
      }
    },
    [token, user],
  );

  const finishMock = (paymentId: string | null) => {
    if (!mock || settled.current) return;
    settled.current = true;
    mock.resolve(paymentId);
    setMock(null);
  };

  const paymentDialog = (
    <Dialog
      open={!!mock}
      onOpenChange={(open) => {
        if (!open) finishMock(null);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="mb-1 grid size-11 place-items-center rounded-full bg-accent text-accent-foreground">
            <FlaskConical className="size-5" aria-hidden="true" />
          </span>
          <DialogTitle className="text-xl">{t('pay.testTitle')}</DialogTitle>
          <DialogDescription>{t('pay.testBody')}</DialogDescription>
        </DialogHeader>
        {mock && (
          <p className="flex items-baseline justify-between gap-3 rounded-xl bg-muted px-4 py-3 text-sm">
            {t('pay.amount')}
            <span className="font-semibold tabular-nums">{f.inr(Number(mock.order.amount) / 100)}</span>
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => finishMock(null)}>
            {t('pay.notNow')}
          </Button>
          <Button onClick={() => finishMock(`mock_pay_${Date.now()}`)}>{t('pay.complete')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { pay, paying, paymentDialog };
}
