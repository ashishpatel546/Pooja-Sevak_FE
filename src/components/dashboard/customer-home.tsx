'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  MapPin,
  Search,
  Video,
  type LucideIcon,
} from 'lucide-react';
import type { AuthUser, Booking } from '@/lib/types';
import { pick, useFormat, useLocale, useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookingStatusBadge } from '@/components/common/status-badge';
import { PujaIcon } from '@/components/common/puja-icon';
import { WelcomeBand } from './welcome-band';
import { MobilePrompt } from './mobile-prompt';
import { useApi } from './use-api';
import { hasStarted, relativeWhen } from './time';

const ACTIVE = new Set(['pending', 'confirmed', 'in_progress']);

const ACTIONS = [
  { href: '/pujas', key: 'pujas', icon: BookOpen },
  { href: '/browse', key: 'browse', icon: Search },
  { href: '/online', key: 'online', icon: Video },
  { href: '/bookings', key: 'bookings', icon: CalendarCheck },
  { href: '/addresses', key: 'addresses', icon: MapPin },
] as const satisfies readonly { href: string; key: string; icon: LucideIcon }[];

export function nextUpcoming(bookings: Booking[] | null): Booking | null {
  if (!bookings) return null;
  const now = Date.now();
  return (
    bookings
      .filter((b) => ACTIVE.has(b.booking_status) && new Date(b.end_time).getTime() > now)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0] ?? null
  );
}

export function CustomerHome({ user, token }: { user: AuthUser; token: string | null }) {
  const { data: bookings, loading } = useApi<Booking[]>('/bookings/me', token);
  const next = nextUpcoming(bookings);
  const t = useT('dashboard');
  const f = useFormat();
  const { locale } = useLocale();

  const nextDef = next?.pandit_service?.service_definition;
  const nextName = nextDef ? pick(nextDef, 'name', locale) : t('puja.fallback');
  const line = loading
    ? t('customer.line.loading')
    : next
      ? hasStarted(next.start_time)
        ? t('customer.line.underway', { puja: nextName })
        : t('customer.line.upcoming', { puja: nextName, when: relativeWhen(next.start_time, t, f.time) })
      : t('customer.line.empty');

  return (
    <div className="grid gap-8">
      <WelcomeBand name={user.name} line={line} />

      {!user.mobile_verified && <MobilePrompt role="customer" />}

      <section aria-labelledby="next-heading">
        <h2 id="next-heading" className="mb-4 text-2xl">
          {t('customer.next.title')}
        </h2>
        {loading ? (
          <Skeleton className="h-36 w-full rounded-2xl" />
        ) : next ? (
          <UpcomingHighlight booking={next} />
        ) : (
          <div className="flex flex-col gap-4 rounded-2xl border border-dashed bg-card/60 p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">
              {t('customer.next.empty')}
            </p>
            <Button render={<Link href="/pujas" />} nativeButton={false} className="shrink-0">
              {t('customer.next.explore')}
            </Button>
          </div>
        )}
      </section>

      <section aria-labelledby="actions-heading">
        <h2 id="actions-heading" className="mb-4 text-2xl">
          {t('customer.actions.title')}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACTIONS.map((a) => (
            <li key={a.href}>
              <Link
                href={a.href}
                className="group flex h-full items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                  <a.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{t(`customer.action.${a.key}`)}</span>
                  <span className="block text-sm text-muted-foreground">{t(`customer.action.${a.key}.blurb`)}</span>
                </span>
                <ArrowRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function UpcomingHighlight({ booking: b }: { booking: Booking }) {
  const t = useT('dashboard');
  const f = useFormat();
  const { locale } = useLocale();
  const def = b.pandit_service?.service_definition;
  return (
    <article className="flex flex-col gap-5 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center sm:p-6">
      <PujaIcon category={def?.category} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="min-w-0 text-xl leading-tight break-words">{def ? pick(def, 'name', locale) : t('puja.fallback')}</h3>
          <BookingStatusBadge status={b.booking_status} />
        </div>
        <p className="mt-1 text-muted-foreground">
          {f.dateTime(b.start_time)} · {b.booking_type === 'online' ? t('customer.next.online') : t('customer.next.atHome')}
          {b.pandit?.user?.name && <> · {t('customer.next.withPandit', { name: b.pandit.user.name })}</>}
        </p>
        <p className="mt-1 text-sm font-medium text-primary">
          {hasStarted(b.start_time)
            ? t('customer.next.underwaySince', { time: f.time(b.start_time) })
            : t('customer.next.begins', { when: relativeWhen(b.start_time, t, f.time) })}
        </p>
      </div>
      <Button
        variant="outline"
        render={<Link href={`/bookings/${b.id}`} />}
        nativeButton={false}
        className="shrink-0 self-start sm:self-auto"
      >
        {t('customer.next.view')} <ArrowRight aria-hidden="true" />
      </Button>
    </article>
  );
}
