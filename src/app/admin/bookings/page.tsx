'use client';

import { useState } from 'react';
import { CalendarDays, CheckCircle2, CircleAlert, Home, Lock, LockOpen, Video } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Booking, BookingStatus } from '@/lib/types';
import { bookingFee, bookingSamagri, customerPayable } from '@/lib/customer-fee';
import { pick, useFormat, useLocale, useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { BookingStatusBadge, PaymentStatusBadge } from '@/components/common/status-badge';
import { PujaIcon } from '@/components/common/puja-icon';
import { useApi } from '@/components/dashboard/use-api';
import { FilterChips } from '@/components/admin/filter-chips';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/dashboard/confirm-dialog';
import { errorMessage } from '@/components/dashboard/use-api';

type Filter = 'all' | BookingStatus;
const STATUSES: BookingStatus[] = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

/** Completion state an admin may need to act on (lock, override, payout). */
function CompletionInfo({ b }: { b: Booking }) {
  const t = useT('admin');
  const attempts = b.completion_code_attempts ?? 0;
  return (
    <>
      {b.completion_code_locked_at ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
          <Lock className="size-3.5" aria-hidden="true" /> {t('bookings.locked')}
        </span>
      ) : attempts > 0 && (b.booking_status === 'confirmed' || b.booking_status === 'in_progress') ? (
        <span className="text-xs text-muted-foreground">{t('bookings.attempts', { count: attempts })}</span>
      ) : null}
      {b.booking_status === 'completed' && b.completed_via === 'admin' && (
        <span className="text-xs text-muted-foreground">{t('bookings.completedByAdmin')}</span>
      )}
      {b.booking_status === 'completed' && b.payout_status && b.payout_status !== 'not_due' && (
        <span className="text-xs text-muted-foreground">
          {t('bookings.payout', { status: t(`payout.${b.payout_status}`) })}
        </span>
      )}
    </>
  );
}

type AdminAction = { kind: 'complete' | 'unlock'; booking: Booking };

function canComplete(b: Booking, now: number) {
  return (b.booking_status === 'confirmed' || b.booking_status === 'in_progress') && +new Date(b.start_time) <= now;
}
function canUnlock(b: Booking) {
  return (
    (b.booking_status === 'confirmed' || b.booking_status === 'in_progress') &&
    (!!b.completion_code_locked_at || (b.completion_code_attempts ?? 0) > 0)
  );
}

function Actions({ b, now, onPick }: { b: Booking; now: number; onPick: (a: AdminAction) => void }) {
  const t = useT('admin');
  if (!canComplete(b, now) && !canUnlock(b)) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {canUnlock(b) && (
        <Button size="sm" variant="outline" onClick={() => onPick({ kind: 'unlock', booking: b })}>
          <LockOpen aria-hidden="true" /> {t('bookings.unlock')}
        </Button>
      )}
      {canComplete(b, now) && (
        <Button size="sm" variant="outline" onClick={() => onPick({ kind: 'complete', booking: b })}>
          <CheckCircle2 aria-hidden="true" /> {t('bookings.complete')}
        </Button>
      )}
    </div>
  );
}

function TypeLabel({ b }: { b: Booking }) {
  const t = useT('admin');
  return b.booking_type === 'online' ? (
    <span className="inline-flex items-center gap-1">
      <Video className="size-4 text-muted-foreground" aria-hidden="true" /> {t('bookings.type.online')}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1">
      <Home className="size-4 text-muted-foreground" aria-hidden="true" /> {t('bookings.type.home')}
    </span>
  );
}

export default function AdminBookingsPage() {
  const { token } = useAuth();
  const t = useT('admin');
  const ts = useT('samagri');
  const tc = useT('common');
  const f = useFormat();
  const { locale } = useLocale();
  const pujaName = (b: Booking) => {
    const def = b.pandit_service?.service_definition;
    return def ? pick(def, 'name', locale) : t('puja.fallback');
  };
  const bookings = useApi<Booking[]>('/admin/bookings', token);
  const [filter, setFilter] = useState<Filter>('all');
  const [action, setAction] = useState<AdminAction | null>(null);
  const [reason, setReason] = useState('');
  const [now] = useState(() => Date.now());
  const closeAction = () => {
    setAction(null);
    setReason('');
  };
  const runAction = async () => {
    if (!action) return;
    try {
      const path = action.kind === 'complete' ? 'complete' : 'unlock-completion';
      await api(`/admin/bookings/${action.booking.id}/${path}`, {
        method: 'POST',
        token,
        body: action.kind === 'complete' ? { reason: reason.trim() } : {},
      });
      toast.success(action.kind === 'complete' ? t('bookings.toast.completed') : t('bookings.toast.unlocked'));
      closeAction();
      bookings.reload();
    } catch (e) {
      toast.error(errorMessage(e));
      throw e;
    }
  };
  const all = bookings.data ?? [];
  const list = filter === 'all' ? all : all.filter((b) => b.booking_status === filter);

  return (
    <>
      <PageHeader title={t('bookings.title')} description={t('bookings.desc')} />

      <div className="mb-6">
        <FilterChips<Filter>
          label={t('bookings.filterLabel')}
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: t('filter.all'), count: bookings.data ? all.length : undefined },
            ...STATUSES.map((s) => ({
              value: s as Filter,
              label: t(`status.${s}`),
              count: bookings.data ? all.filter((b) => b.booking_status === s).length : undefined,
            })),
          ]}
        />
      </div>

      {bookings.loading ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : bookings.error && !bookings.data ? (
        <EmptyState icon={CircleAlert} title={t('bookings.loadError')} action={<Button onClick={bookings.reload}>{tc('action.retry')}</Button>}>
          {bookings.error}
        </EmptyState>
      ) : list.length === 0 ? (
        <EmptyState icon={CalendarDays} title={t('bookings.empty.title')}>
          {filter === 'all' ? t('bookings.empty.all') : t('bookings.empty.filtered')}
        </EmptyState>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border bg-card lg:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{t('bookings.title')}</caption>
              <thead className="border-b bg-muted/50 text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">{t('bookings.col.puja')}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t('bookings.col.family')}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t('bookings.col.pandit')}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t('bookings.col.when')}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t('bookings.col.type')}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t('bookings.col.status')}</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">{t('bookings.col.amount')}</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">{t('bookings.col.commission')}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t('bookings.col.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {list.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <PujaIcon category={b.pandit_service?.service_definition?.category} size="sm" />
                        <span className="font-medium">{pujaName(b)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{b.customer?.name ?? '—'}</td>
                    <td className="px-4 py-3">{b.pandit?.user?.name ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {f.date(b.start_time, { weekday: undefined })}
                      <span className="block text-muted-foreground">{f.time(b.start_time)}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <TypeLabel b={b} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <BookingStatusBadge status={b.booking_status} />
                        <PaymentStatusBadge status={b.payment_status} />
                        <CompletionInfo b={b} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {f.inr(customerPayable(b))}
                      {bookingFee(b) > 0 && (
                        <span className="block text-xs text-muted-foreground">
                          {t('bookings.inclFee', { amount: f.inr(bookingFee(b)) })}
                        </span>
                      )}
                      {bookingSamagri(b) > 0 && (
                        <span className="block text-xs text-muted-foreground">
                          {ts('admin.inclSamagri', { amount: f.inr(bookingSamagri(b)) })}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">{f.inr(b.platform_commission)}</td>
                    <td className="px-4 py-3">
                      <Actions b={b} now={now} onPick={setAction} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {list.map((b) => (
              <li key={b.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-start gap-3">
                  <PujaIcon category={b.pandit_service?.service_definition?.category} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{pujaName(b)}</p>
                    <p className="text-sm text-muted-foreground">
                      {f.date(b.start_time, { weekday: undefined })} · {f.time(b.start_time)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <BookingStatusBadge status={b.booking_status} />
                  <PaymentStatusBadge status={b.payment_status} />
                  <CompletionInfo b={b} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">{t('bookings.col.family')}</dt>
                    <dd>{b.customer?.name ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t('bookings.col.pandit')}</dt>
                    <dd>{b.pandit?.user?.name ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t('bookings.col.type')}</dt>
                    <dd>
                      <TypeLabel b={b} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t('bookings.col.amountFee')}</dt>
                    <dd className="tabular-nums">
                      {f.inr(customerPayable(b))} <span className="text-muted-foreground">· {f.inr(b.platform_commission)}</span>
                      {bookingFee(b) > 0 && (
                        <span className="block text-xs text-muted-foreground">
                          {t('bookings.inclFee', { amount: f.inr(bookingFee(b)) })}
                        </span>
                      )}
                      {bookingSamagri(b) > 0 && (
                        <span className="block text-xs text-muted-foreground">
                          {ts('admin.inclSamagri', { amount: f.inr(bookingSamagri(b)) })}
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
                <div className="mt-3 empty:hidden">
                  <Actions b={b} now={now} onPick={setAction} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <ConfirmDialog
        open={action?.kind === 'complete'}
        onOpenChange={(o) => !o && closeAction()}
        title={t('bookings.dialog.completeTitle')}
        description={t('bookings.dialog.completeDesc')}
        confirmLabel={t('bookings.dialog.completeConfirm')}
        disabled={reason.trim().length < 5}
        onConfirm={runAction}
      >
        <div className="grid gap-2">
          <Label htmlFor="admin-complete-reason">{t('bookings.dialog.reason')}</Label>
          <Textarea
            id="admin-complete-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('bookings.dialog.reasonPlaceholder')}
            maxLength={1000}
          />
        </div>
      </ConfirmDialog>
      <ConfirmDialog
        open={action?.kind === 'unlock'}
        onOpenChange={(o) => !o && closeAction()}
        title={t('bookings.dialog.unlockTitle')}
        description={t('bookings.dialog.unlockDesc')}
        confirmLabel={t('bookings.dialog.unlockConfirm')}
        onConfirm={runAction}
      />
    </>
  );
}
