'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Popover } from '@base-ui/react/popover';
import {
  Bell,
  BellRing,
  CalendarCheck,
  CalendarX,
  CheckCheck,
  IndianRupee,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useFormat, useT } from '@/i18n';
import { INTL_LOCALE } from '@/i18n/config';
import type { AppNotification } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Diya } from '@/components/brand/diya';
import { useNotifications } from './use-notifications';

function iconFor(type: string): LucideIcon {
  if (/cancel/.test(type)) return CalendarX;
  if (/refund|payment/.test(type)) return IndianRupee;
  if (/review/.test(type)) return Star;
  if (/reminder|observance|remembrance/.test(type)) return BellRing;
  if (/booking/.test(type)) return CalendarCheck;
  return Bell;
}

/** Turns a notification link into an in-app path, or null when it points elsewhere. */
function internalPath(link: string | null): { path: string } | { external: string } | null {
  if (!link) return null;
  if (link.startsWith('/') && !link.startsWith('//')) return { path: link };
  try {
    const url = new URL(link);
    if (url.origin === window.location.origin) return { path: url.pathname + url.search + url.hash };
    if (url.protocol === 'https:') return { external: url.toString() };
  } catch {
    /* not a URL */
  }
  return null;
}

/** Bell with unread badge; opens a panel listing recent notifications. */
export function NotificationBell({ token }: { token: string }) {
  const t = useT('notifications');
  const f = useFormat();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const { items, unread, loaded, error, fetchedAt, reload, markRead, markAllRead } = useNotifications(token);

  const rtf = new Intl.RelativeTimeFormat(INTL_LOCALE[f.locale], { numeric: 'auto' });
  const when = (iso: string) => {
    const then = new Date(iso).getTime();
    if (!fetchedAt || Number.isNaN(then)) return f.dateTime(iso);
    const mins = Math.round((fetchedAt - then) / 60_000);
    if (mins < 1) return t('time.justNow');
    if (mins < 60) return rtf.format(-mins, 'minute');
    const hours = Math.round(mins / 60);
    if (hours < 24) return rtf.format(-hours, 'hour');
    const days = Math.round(hours / 24);
    if (days < 7) return rtf.format(-days, 'day');
    return f.date(iso, { day: 'numeric', month: 'short' });
  };

  const openItem = (n: AppNotification) => {
    if (!n.read_at) void markRead(n.id);
    const target = internalPath(n.link);
    setOpen(false);
    if (!target) return;
    if ('path' in target) router.push(target.path);
    else window.open(target.external, '_blank', 'noopener,noreferrer');
  };

  const onMarkAll = async () => {
    setMarkingAll(true);
    try {
      await markAllRead();
    } catch {
      toast.error(t('panel.markAllFailed'));
    } finally {
      setMarkingAll(false);
    }
  };

  const badge = unread > 9 ? '9+' : String(unread);
  const label = unread > 0 ? t.plural('bell.labelUnread', unread) : t('bell.label');

  return (
    <>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {loaded ? (unread > 0 ? t.plural('live.unread', unread) : t('live.none')) : ''}
      </span>
      <Popover.Root
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (o) void reload();
        }}
      >
        <Popover.Trigger
          render={<Button variant="ghost" size="icon" className="relative size-10" aria-label={label} title={t('bell.label')} />}
        >
          {unread > 0 ? <BellRing className="size-5" aria-hidden="true" /> : <Bell className="size-5" aria-hidden="true" />}
          {unread > 0 && (
            <span
              aria-hidden="true"
              className="absolute top-1 right-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-primary px-1 text-[0.65rem] leading-none font-semibold text-primary-foreground tabular-nums ring-2 ring-background"
            >
              {badge}
            </span>
          )}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner side="bottom" align="end" sideOffset={8} collisionPadding={8} className="z-50">
            <Popover.Popup
              className={cn(
                'flex w-[min(24rem,calc(100vw-1rem))] origin-(--transform-origin) flex-col overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-[0_24px_60px_-28px_rgb(42_31_74/0.55)] outline-none',
                'transition-[opacity,transform] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none',
              )}
            >
              <div className="flex items-center justify-between gap-3 border-b px-4 py-2">
                <Popover.Title className="font-heading text-lg leading-relaxed text-heading">
                  {t('panel.title')}
                </Popover.Title>
                {unread > 0 && (
                  <Button variant="ghost" size="sm" className="min-h-11 text-primary" onClick={onMarkAll} disabled={markingAll}>
                    <CheckCheck aria-hidden="true" />
                    {t('panel.markAll')}
                  </Button>
                )}
              </div>

              <div className="max-h-[min(28rem,70vh)] overflow-y-auto overscroll-contain">
                {!loaded && !error ? (
                  <p role="status" className="px-4 py-10 text-center text-sm text-muted-foreground">
                    {t('panel.loading')}
                  </p>
                ) : !loaded && error ? (
                  <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                    <p className="text-sm text-muted-foreground">{t('panel.error')}</p>
                    <Button variant="outline" onClick={() => void reload()}>
                      {t('panel.retry')}
                    </Button>
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center px-6 py-10 text-center">
                    <Diya className="size-10" lit={false} />
                    <p className="mt-3 font-heading text-lg leading-relaxed text-heading">{t('empty.title')}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t('empty.body')}</p>
                  </div>
                ) : (
                  <ul className="divide-y">
                    {items.map((n) => {
                      const Icon = iconFor(n.type);
                      const isUnread = !n.read_at;
                      return (
                        <li key={n.id}>
                          <button
                            type="button"
                            onClick={() => openItem(n)}
                            className={cn(
                              'flex min-h-11 w-full gap-3 px-4 py-3 text-left transition-colors outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset',
                              isUnread && 'bg-accent/40',
                            )}
                          >
                            <span
                              className={cn(
                                'mt-0.5 grid size-9 shrink-0 place-items-center rounded-full',
                                isUnread ? 'bg-accent text-accent-foreground ring-1 ring-diya/40' : 'bg-muted text-muted-foreground',
                              )}
                            >
                              <Icon className="size-4" aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-start justify-between gap-2">
                                <span className={cn('leading-snug', isUnread ? 'font-semibold' : 'font-medium')}>{n.title}</span>
                                {isUnread && (
                                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary">
                                    <span className="sr-only">{t('item.unread')}</span>
                                  </span>
                                )}
                              </span>
                              {n.body && (
                                <span className="mt-0.5 line-clamp-2 block text-sm leading-relaxed text-muted-foreground">
                                  {n.body}
                                </span>
                              )}
                              <time dateTime={n.created_at} className="mt-1 block text-xs text-muted-foreground">
                                {when(n.created_at)}
                              </time>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </>
  );
}
