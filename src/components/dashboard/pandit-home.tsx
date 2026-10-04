'use client';

import Link from 'next/link';
import { ArrowRight, CalendarDays, Landmark, ListChecks, TriangleAlert, UserRound } from 'lucide-react';
import type { AuthUser, Booking, PanditEarnings, PanditProfile, PanditServiceItem } from '@/lib/types';
import { useFormat, useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { VerifiedPill } from '@/components/common/pandit-avatar';
import { PanditBookingCard } from '@/components/pandit/booking-card';
import { groupPanditBookings, replaceBooking } from '@/components/pandit/booking-groups';
import { SetupChecklist, setupSteps } from '@/components/pandit/setup-checklist';
import { WelcomeBand } from './welcome-band';
import { MobilePrompt } from './mobile-prompt';
import { Ledger, LedgerRow } from './ledger';
import { useApi } from './use-api';
import { lighterListMissing } from '@/lib/samagri';

export function PanditHome({ user, token }: { user: AuthUser; token: string | null }) {
  const t = useT('dashboard');
  const ts = useT('samagri');
  const f = useFormat();
  const profile = useApi<PanditProfile>('/pandits/me/profile', token);
  const services = useApi<PanditServiceItem[]>('/pandits/me/services', token);
  const earnings = useApi<PanditEarnings>('/pandits/me/earnings', token);
  const bookings = useApi<Booking[]>('/bookings/pandit/me', token);

  const groups = groupPanditBookings(bookings.data);
  const todayCount = groups.today.length;
  const requests = groups.upcoming.filter((b) => b.booking_status === 'pending').length;
  const shortlist = [...groups.today, ...groups.upcoming].slice(0, 3);

  const verified = profile.data?.is_verified;
  const missingLists = (services.data ?? []).filter((sv) => !sv.samagri_list || lighterListMissing(sv)).length;
  const steps = profile.data && services.data ? setupSteps(profile.data, services.data, !!user.photo_url) : null;

  const line = bookings.loading
    ? t('pandit.line.loading')
    : todayCount
      ? [t.plural('pandit.line.today', todayCount), requests ? t.plural('pandit.line.requests', requests) : '']
          .filter(Boolean)
          .join(' ')
      : requests
        ? t.plural('pandit.line.requests', requests)
        : groups.upcoming.length
          ? t('pandit.line.upcomingOnly')
          : t('pandit.line.quiet');

  return (
    <div className="grid gap-8">
      <WelcomeBand name={user.name} line={line} pandit>
        {verified && <VerifiedPill className="bg-white/10 text-[#fbe3b6] ring-[#fbe3b6]/30" />}
      </WelcomeBand>

      {!user.mobile_verified && <MobilePrompt role="pandit" />}

      {profile.loading || services.loading ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : steps && !verified ? (
        <SetupChecklist steps={steps} profile={profile.data!} token={token} onUpdated={(u) => profile.mutate(() => u)} />
      ) : missingLists > 0 ? (
        <section
          aria-labelledby="lists-heading"
          className="flex flex-col gap-4 rounded-2xl border border-diya/40 bg-card p-5 sm:flex-row sm:items-center sm:p-6"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-diya/15 text-sindoor" aria-hidden="true">
            <TriangleAlert className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="lists-heading" className="text-xl leading-tight">
              {ts('services.listMissing')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{ts.plural('checklist.listsHint', missingLists)}</p>
          </div>
          <Button variant="outline" render={<Link href="/pandit/services" />} nativeButton={false} className="min-h-11 shrink-0">
            {ts('services.listUpload')} <ArrowRight aria-hidden="true" />
          </Button>
        </section>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="bookings-heading" className="min-w-0">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
            <h2 id="bookings-heading" className="min-w-0 text-2xl">
              {t('pandit.bookings.title')}
            </h2>
            <Link
              href="/pandit/bookings"
              className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t('pandit.bookings.all')} <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          {bookings.loading ? (
            <div className="grid gap-3">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          ) : bookings.error ? (
            <p className="text-sm text-destructive" role="alert">
              {bookings.error}
            </p>
          ) : shortlist.length ? (
            <div className="grid gap-3">
              {shortlist.map((b) => (
                <PanditBookingCard
                  key={b.id}
                  booking={b}
                  token={token}
                  compact
                  onChanged={(u) => (u ? bookings.mutate((l) => replaceBooking(l, u)) : bookings.reload())}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={CalendarDays} title={t('pandit.bookings.empty.title')}>
              {verified ? t('pandit.bookings.empty.verified') : t('pandit.bookings.empty.unverified')}
            </EmptyState>
          )}
        </section>

        <aside className="grid content-start gap-6">
          {earnings.loading ? (
            <Skeleton className="h-64 w-full rounded-2xl" />
          ) : earnings.data ? (
            <Ledger title={t('pandit.earnings.title')} caption={t('pandit.earnings.caption')}>
              <LedgerRow
                label={t('pandit.earnings.net')}
                value={f.inr(earnings.data.net_earned)}
                emphasis
                hint={
                  Number(earnings.data.samagri) > 0
                    ? ts('admin.inclSamagri', { amount: f.inr(earnings.data.samagri ?? 0) })
                    : undefined
                }
              />
              <LedgerRow
                label={t('pandit.earnings.due')}
                value={f.inr(earnings.data.payout_due ?? 0)}
                hint={
                  earnings.data.payout_due_count
                    ? t.plural('pandit.earnings.dueHint', earnings.data.payout_due_count)
                    : undefined
                }
              />
              {Number(earnings.data.payout_on_hold) > 0 && (
                <LedgerRow
                  label={t('pandit.earnings.onHold')}
                  value={f.inr(earnings.data.payout_on_hold)}
                  hint={t('pandit.earnings.holdHint')}
                />
              )}
              <LedgerRow label={t('pandit.earnings.settled')} value={f.inr(earnings.data.payout_settled ?? 0)} />
              <LedgerRow label={t('pandit.earnings.month')} value={f.inr(earnings.data.this_month_net)} />
              <LedgerRow label={t('pandit.earnings.upcoming')} value={Number(earnings.data.upcoming)} />
              <LedgerRow label={t('pandit.earnings.completed')} value={Number(earnings.data.completed)} />
            </Ledger>
          ) : null}

          <nav aria-label={t('pandit.shortcuts.label')} className="grid gap-2">
            <Button variant="outline" size="lg" className="justify-start" render={<Link href="/pandit/services" />} nativeButton={false}>
              <ListChecks aria-hidden="true" /> {t('pandit.shortcuts.services')}
            </Button>
            <Button variant="outline" size="lg" className="justify-start" render={<Link href="/pandit/profile" />} nativeButton={false}>
              <UserRound aria-hidden="true" /> {t('pandit.shortcuts.profile')}
            </Button>
            <Button variant="outline" size="lg" className="justify-start" render={<Link href="/pandit/payouts" />} nativeButton={false}>
              <Landmark aria-hidden="true" /> {t('pandit.shortcuts.payouts')}
            </Button>
          </nav>
        </aside>
      </div>
    </div>
  );
}
