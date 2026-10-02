'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ChevronRight, Flame, Home, Package, RefreshCw, Star, Video } from 'lucide-react';
import { pick, useFormat, useLocale, useT } from '@/i18n';
import type { Booking, BookingStatus, Review } from '@/lib/types';
import { canEditReview, canRate } from '@/lib/review-rules';
import { Stars } from '@/components/common/rating-breakdown';
import { CompletionCodeInline, hasLiveCode } from '@/components/customer/completion-code-card';
import { ReviewDialog } from '@/components/customer/booking-actions';
import { customerPayable } from '@/lib/customer-fee';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader, PageShell } from '@/components/common/page-header';
import { PujaIcon } from '@/components/common/puja-icon';
import { BookingStatusBadge } from '@/components/common/status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApiQuery, useNow } from '@/components/customer/use-api';
import { useRequireCustomer } from '@/components/customer/use-require-customer';
import { CustomerOnly } from '@/components/customer/wrong-role';
import { hasSamagri, SamagriListButton, samagriForMode } from '@/components/common/samagri-list';

const GROUPS: { value: 'upcoming' | 'past' | 'cancelled'; statuses: BookingStatus[] }[] = [
  { value: 'upcoming', statuses: ['pending', 'confirmed', 'in_progress'] },
  { value: 'past', statuses: ['completed'] },
  { value: 'cancelled', statuses: ['cancelled'] },
];

function BookingRow({ b, now, onReviewed }: { b: Booking; now: number; onReviewed: (r: Review) => void }) {
  const t = useT('customer');
  const [rateOpen, setRateOpen] = useState(false);
  const rateable = canRate(b, now) && (!b.review || canEditReview(b, now));
  const f = useFormat();
  const { locale } = useLocale();
  const def = b.pandit_service?.service_definition;
  const online = b.booking_type === 'online';
  const payDue = b.booking_status === 'pending' && b.payment_status === 'pending';
  const code = hasLiveCode(b);
  const ts = useT('samagri');
  const pujaName = def ? pick(def, 'name', locale) : t('puja.fallbackName');
  const samagriByPandit = b.samagri_by === 'pandit';
  const active = b.booking_status !== 'cancelled' && b.booking_status !== 'completed';
  // Families preparing an at-home puja can open the pandit's list right here.
  const modeSamagri = samagriForMode(ts, b.pandit_service ?? {}, b.puja_mode);
  const listProps = { ...modeSamagri, items: def?.samagri, pujaName };
  const showList = active && !online && !samagriByPandit && hasSamagri(listProps);
  return (
    // One card: the booking link on top, the code and rating in a strip along its bottom edge.
    <li className="overflow-hidden rounded-xl border bg-card transition-colors has-[a:hover]:border-primary/40">
      <Link
        href={`/bookings/${b.id}`}
        className="group flex items-start gap-4 p-4 transition-colors hover:bg-accent/20 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset sm:items-center sm:p-5"
      >
        <PujaIcon category={def?.category} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="min-w-0 text-lg leading-snug group-hover:text-primary">
              {pujaName}
            </h3>
            <BookingStatusBadge status={b.booking_status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {t('bookings.with', { name: b.pandit?.user?.name ?? t('pandit.fallbackName') })}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
              {t('bookings.when', { dateTime: f.dateTime(b.start_time) })}
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              {online ? (
                <Video className="size-4" aria-hidden="true" />
              ) : (
                <Home className="size-4" aria-hidden="true" />
              )}
              {online ? t('bookings.online') : t('bookings.atHome')}
            </span>
            {samagriByPandit && (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Package className="size-4" aria-hidden="true" />
                {ts('by.pandit')}
              </span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-semibold tabular-nums">{f.inr(customerPayable(b))}</span>
          {payDue && <span className="text-xs font-medium whitespace-nowrap text-primary">{t('bookings.payDue')}</span>}
          <ChevronRight className="hidden size-5 text-muted-foreground sm:block" aria-hidden="true" />
        </div>
      </Link>
      {(code || rateable || b.review || showList) && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-dashed border-diya/40 bg-chandan/50 px-4 py-2.5 sm:px-5">
          {code && <CompletionCodeInline booking={b} />}
          {showList && <SamagriListButton {...listProps} label={modeSamagri.modeLabel ?? ts('by.listLink')} className="text-sm" />}
          {b.review && (
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              {t('review.yours')}
              <Stars
                value={b.review.rating_overall ?? b.review.rating}
                label={t('rating.outOf5', { rating: b.review.rating_overall ?? b.review.rating })}
              />
            </span>
          )}
          {rateable && (
            <Button variant={b.review ? 'ghost' : 'outline'} size="sm" onClick={() => setRateOpen(true)}>
              <Star aria-hidden="true" />
              {b.review ? t('review.edit') : t('review.rate')}
            </Button>
          )}
          <ReviewDialog booking={b} open={rateOpen} onOpenChange={setRateOpen} onReviewed={onReviewed} />
        </div>
      )}
    </li>
  );
}

export default function BookingsPage() {
  const { ready, wrongRole, token } = useRequireCustomer();
  const t = useT('customer');
  const tc = useT('common');
  const { data, loading, error, reload, setData } = useApiQuery<Booking[]>(ready ? '/bookings/me' : null, { token });
  const now = useNow(60_000);
  const reviewed = (bookingId: string) => (r: Review) =>
    data && setData(data.map((x) => (x.id === bookingId ? { ...x, review: { ...x.review, ...r } } : x)));

  if (wrongRole) return <CustomerOnly />;

  const list = data ?? [];
  const byGroup = (statuses: BookingStatus[]) => {
    const items = list.filter((b) => statuses.includes(b.booking_status));
    // Upcoming: soonest first. Others: most recent first.
    return statuses.includes('pending')
      ? items.sort((a, b) => +new Date(a.start_time) - +new Date(b.start_time))
      : items.sort((a, b) => +new Date(b.start_time) - +new Date(a.start_time));
  };

  return (
    <PageShell>
      <PageHeader
        title={t('bookings.title')}
        description={t('bookings.description')}
        actions={
          <Button variant="outline" render={<Link href="/addresses" />} nativeButton={false}>
            {t('bookings.addresses')}
          </Button>
        }
      />

      {!ready || loading ? (
        <div className="grid gap-3" aria-hidden="true">
          <Skeleton className="h-10 w-72 rounded-lg" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={RefreshCw}
          title={t('bookings.loadError')}
          action={<Button onClick={reload}>{tc('action.retry')}</Button>}
        >
          {error}
        </EmptyState>
      ) : list.length === 0 ? (
        <EmptyState
          icon={Flame}
          title={t('bookings.emptyTitle')}
          action={
            <Button render={<Link href="/pujas" />} nativeButton={false}>
              {t('bookings.explore')}
            </Button>
          }
        >
          {t('bookings.emptyBody')}
        </EmptyState>
      ) : (
        <Tabs defaultValue="upcoming">
          <TabsList className="w-full sm:w-fit">
            {GROUPS.map((g) => (
              <TabsTrigger key={g.value} value={g.value} className="min-h-9 px-3">
                {t(`bookings.tab.${g.value}`)}
                <span className="text-xs text-muted-foreground tabular-nums">{byGroup(g.statuses).length}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {GROUPS.map((g) => {
            const items = byGroup(g.statuses);
            return (
              <TabsContent key={g.value} value={g.value} className="mt-4">
                {items.length === 0 ? (
                  <EmptyState
                    title={
                      g.value === 'upcoming'
                        ? t('bookings.noUpcoming')
                        : g.value === 'past'
                          ? t('bookings.noPast')
                          : t('bookings.noCancelled')
                    }
                    action={
                      g.value === 'upcoming' ? (
                        <Button render={<Link href="/pujas" />} nativeButton={false}>
                          {t('bookings.explore')}
                        </Button>
                      ) : undefined
                    }
                  >
                    {g.value === 'upcoming' ? t('bookings.upcomingHint') : undefined}
                  </EmptyState>
                ) : (
                  <ul className="grid gap-3">
                    {items.map((b) => (
                      <BookingRow key={b.id} b={b} now={now} onReviewed={reviewed(b.id)} />
                    ))}
                  </ul>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </PageShell>
  );
}
