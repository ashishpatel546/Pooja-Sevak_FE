'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CalendarCheck, CalendarDays, CircleAlert, RefreshCw, Sun, XCircle } from 'lucide-react';
import { useRequireAuth } from '@/lib/use-require-auth';
import type { Booking } from '@/lib/types';
import { useFormat, useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader, PageShell } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { useApi } from '@/components/dashboard/use-api';
import { istKeyOf } from '@/components/dashboard/time';
import { PanditBookingCard } from '@/components/pandit/booking-card';
import { groupPanditBookings, replaceBooking, type PanditBookingTab } from '@/components/pandit/booking-groups';

const TABS: { value: PanditBookingTab; icon: typeof Sun }[] = [
  { value: 'upcoming', icon: CalendarDays },
  { value: 'today', icon: Sun },
  { value: 'completed', icon: CalendarCheck },
  { value: 'cancelled', icon: XCircle },
];

export default function PanditBookingsPage() {
  return (
    <Suspense>
      <PanditBookings />
    </Suspense>
  );
}

function PanditBookings() {
  const { ready, token } = useRequireAuth(['pandit']);
  const router = useRouter();
  const chatParam = useSearchParams().get('chat');
  const t = useT('pandit');
  const tc = useT('common');
  const bookings = useApi<Booking[]>(ready ? '/bookings/pandit/me' : null, token);
  const groups = groupPanditBookings(bookings.data);
  const [tab, setTab] = useState<PanditBookingTab | null>(null);
  // `?chat=<bookingId>` (from a "new message" notification) opens that chat.
  const [closedChat, setClosedChat] = useState<string | null>(null);
  const chatId = chatParam && chatParam !== closedChat ? chatParam : null;
  const chatTab = chatId
    ? TABS.find((x) => groups[x.value].some((b) => b.id === chatId))?.value
    : undefined;
  // Open on the chat's tab, else Today when there is something today, else requests.
  const active: PanditBookingTab = tab ?? chatTab ?? (groups.today.length ? 'today' : 'upcoming');
  const closeChat = () => {
    setClosedChat(chatParam);
    router.replace('/pandit/bookings', { scroll: false });
  };

  const onChanged = (u: Booking | null) => (u ? bookings.mutate((l) => replaceBooking(l, u)) : bookings.reload());

  return (
    <PageShell>
      <PageHeader
        back={
          <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden="true" /> {t('nav.dashboard')}
          </Link>
        }
        title={t('bookings.title')}
        description={t('bookings.desc')}
        actions={
          <Button variant="outline" onClick={bookings.reload} disabled={!ready || bookings.refreshing}>
            <RefreshCw className={bookings.refreshing ? 'animate-spin' : undefined} aria-hidden="true" /> {t('bookings.refresh')}
          </Button>
        }
      />

      {!ready || bookings.loading ? (
        <div className="grid gap-4">
          <Skeleton className="h-10 w-full max-w-xl rounded-lg" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : bookings.error && !bookings.data ? (
        <EmptyState icon={CircleAlert} title={t('bookings.loadError')} action={<Button onClick={bookings.reload}>{tc('action.retry')}</Button>}>
          {bookings.error}
        </EmptyState>
      ) : (
        <Tabs value={active} onValueChange={(v) => setTab(v as PanditBookingTab)} className="gap-6">
          <div className="-mx-4 overflow-x-auto overflow-y-hidden px-4 py-1 sm:mx-0 sm:px-0">
            <TabsList className="h-11! w-max" aria-label={t('bookings.tabsLabel')}>
              {TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="min-h-9 px-3">
                  {t(`bookings.tab.${tab.value}`)}
                  <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground tabular-nums">
                    {groups[tab.value].length}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              {groups[tab.value].length === 0 ? (
                <EmptyState icon={tab.icon} title={t(`bookings.empty.${tab.value}.title`)}>
                  {t(`bookings.empty.${tab.value}`)}
                </EmptyState>
              ) : (
                <DayGroups
                  list={groups[tab.value]}
                  token={token}
                  onChanged={onChanged}
                  chatId={chatId}
                  onChatClosed={closeChat}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </PageShell>
  );
}

/** Bookings grouped under a date heading (IST). */
function DayGroups({
  list,
  token,
  onChanged,
  chatId,
  onChatClosed,
}: {
  list: Booking[];
  token: string | null;
  onChanged: (u: Booking | null) => void;
  chatId: string | null;
  onChatClosed: () => void;
}) {
  const f = useFormat();
  const days: { key: string; items: Booking[] }[] = [];
  for (const b of list) {
    const k = istKeyOf(b.start_time);
    const last = days[days.length - 1];
    if (last && last.key === k) last.items.push(b);
    else days.push({ key: k, items: [b] });
  }
  return (
    <div className="grid gap-8">
      {days.map((d) => (
        <section key={d.key} aria-label={f.date(d.items[0].start_time, { year: undefined })}>
          <h2 className="mb-3 text-lg text-muted-foreground">
            {f.date(d.items[0].start_time, { weekday: 'long', year: undefined })}
          </h2>
          <div className="grid gap-4">
            {d.items.map((b) => (
              <PanditBookingCard
                key={b.id}
                booking={b}
                token={token}
                onChanged={onChanged}
                chatOpen={b.id === chatId}
                onChatOpenChange={(o) => !o && onChatClosed()}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
