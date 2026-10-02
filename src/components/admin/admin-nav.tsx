'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, CalendarDays, LayoutDashboard, Settings2, UsersRound, Wallet, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';

const LINKS = [
  { href: '/admin', key: 'overview', icon: LayoutDashboard },
  { href: '/admin/pandits', key: 'pandits', icon: UsersRound },
  { href: '/admin/bookings', key: 'bookings', icon: CalendarDays },
  { href: '/admin/settlements', key: 'settlements', icon: Wallet },
  { href: '/admin/catalog', key: 'catalog', icon: BookOpen },
  { href: '/admin/settings', key: 'settings', icon: Settings2 },
] as const satisfies readonly { href: string; key: string; icon: LucideIcon }[];

/** Section navigation for the admin console. Scrolls horizontally on phones. */
export function AdminNav() {
  const pathname = usePathname();
  const t = useT('admin');
  const isActive = (href: string) =>
    href === '/admin' ? pathname === href : pathname === href || pathname.startsWith(href + '/');
  return (
    <nav aria-label={t('nav.label')} className="-mx-4 mb-8 overflow-x-auto overflow-y-hidden border-b px-4 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-1">
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              aria-current={isActive(l.href) ? 'page' : undefined}
              className={cn(
                'relative inline-flex min-h-11 items-center gap-2 rounded-t-lg px-3 text-sm whitespace-nowrap font-medium text-muted-foreground transition-colors hover:text-foreground',
                'aria-[current=page]:text-primary',
                'after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary after:opacity-0 aria-[current=page]:after:opacity-100',
              )}
            >
              <l.icon className="size-4" aria-hidden="true" />
              {t(`nav.${l.key}`)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
