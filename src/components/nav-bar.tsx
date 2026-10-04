'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, UserRound } from 'lucide-react';
import { firstName } from '@/lib/format';
import { useAuth } from '@/lib/auth-context';
import type { Role } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Logo } from '@/components/brand/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { ProfilePhoto } from '@/components/common/profile-photo';

type LinkKey =
  | 'link.home'
  | 'link.dashboard'
  | 'link.pujas'
  | 'link.browse'
  | 'link.online'
  | 'link.panchang'
  | 'link.reminders'
  | 'link.myBookings'
  | 'link.panditBookings'
  | 'link.panditServices'
  | 'link.panditProfile'
  | 'link.admin'
  | 'link.contact';

type NavLink = { href: string; label: LinkKey };

const HOME: NavLink = { href: '/', label: 'link.home' };
const CONTACT: NavLink = { href: '/contact', label: 'link.contact' };

function linksFor(role: Role | undefined): NavLink[] {
  const discover: NavLink[] = [
    HOME,
    { href: '/pujas', label: 'link.pujas' },
    { href: '/browse', label: 'link.browse' },
    { href: '/online', label: 'link.online' },
    { href: '/panchang', label: 'link.panchang' },
  ];
  if (role === 'customer')
    return [
      ...discover,
      { href: '/reminders', label: 'link.reminders' },
      { href: '/bookings', label: 'link.myBookings' },
      CONTACT,
    ];
  if (role === 'pandit')
    return [
      { href: '/dashboard', label: 'link.dashboard' },
      { href: '/pandit/bookings', label: 'link.panditBookings' },
      { href: '/pandit/services', label: 'link.panditServices' },
      { href: '/pandit/profile', label: 'link.panditProfile' },
      { href: '/panchang', label: 'link.panchang' },
      CONTACT,
    ];
  if (role === 'admin')
    return [
      { href: '/admin', label: 'link.admin' },
      { href: '/pujas', label: 'link.pujas' },
    ];
  return [...discover, CONTACT];
}

const sheetLink =
  'flex min-h-11 items-center rounded-lg px-3 py-2.5 text-base font-medium hover:bg-muted aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground';

export function NavBar() {
  const { user, token, logout } = useAuth();
  const t = useT('nav');
  const tc = useT('common');
  const pathname = usePathname();
  const links = linksFor(user?.role);
  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href + '/'));
  const current = (href: string) => (isActive(href) ? 'page' : undefined);

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/70">
      <nav
        aria-label={t('aria.main')}
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-1.5 px-3 min-[360px]:px-4 sm:gap-3 sm:px-6"
      >
        <Logo className="shrink-0" />

        <div className="hidden min-w-0 items-center gap-0.5 xl:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={current(l.href)}
              className={cn(
                'relative rounded-lg px-2.5 py-2 text-[0.95rem] font-medium whitespace-nowrap text-foreground/75 transition-colors hover:text-foreground',
                'aria-[current=page]:text-primary',
                'after:absolute after:inset-x-2.5 after:-bottom-3.25 after:h-0.5 after:rounded-full after:bg-primary after:opacity-0 aria-[current=page]:after:opacity-100',
              )}
            >
              {t(l.label)}
            </Link>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <LanguageToggle />
          <ThemeToggle />
          {user && token && <NotificationBell key={user.id} token={token} />}
          <div className="hidden items-center gap-2 xl:flex">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  render={<Link href="/account" />}
                  nativeButton={false}
                  aria-label={t('account.aria', { name: user.name })}
                  aria-current={current('/account')}
                  className="max-w-44"
                >
                  {user.photo_thumb_url ? (
                    <span className="size-6 shrink-0 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                      <ProfilePhoto src={user.photo_thumb_url} px={24} fallback={<UserRound className="m-1 size-4" />} />
                    </span>
                  ) : (
                    <UserRound aria-hidden="true" />
                  )}
                  <span className="truncate">{firstName(user.name)}</span>
                </Button>
                <Button variant="outline" onClick={logout}>
                  {tc('action.signOut')}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" render={<Link href="/login" />} nativeButton={false}>
                  {tc('action.signIn')}
                </Button>
                <Button render={<Link href="/signup" />} nativeButton={false}>
                  {tc('action.signUp')}
                </Button>
              </>
            )}
          </div>

          <Sheet>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" className="size-10 xl:hidden" aria-label={t('menu.open')} />}
            >
              <Menu className="size-5" aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[86vw] max-w-sm overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="font-heading text-xl leading-relaxed text-heading">{tc('brand.name')}</SheetTitle>
                {user && (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    {user.photo_thumb_url && (
                      <span className="size-8 shrink-0 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                        <ProfilePhoto src={user.photo_thumb_url} px={32} fallback={null} />
                      </span>
                    )}
                    <span className="min-w-0">{t('menu.signedInAs', { name: user.name })}</span>
                  </p>
                )}
              </SheetHeader>
              <div className="flex flex-col gap-1 px-4 pb-6">
                {/* One home per role: site home (guests, devotees), dashboard (pandits), console (admins). */}
                {links.map((l) => (
                  <SheetClose
                    key={l.href}
                    render={
                      <Link href={l.href} aria-current={current(l.href)} className={sheetLink}>
                        {t(l.label)}
                      </Link>
                    }
                    nativeButton={false}
                  />
                ))}
                {user && (
                  <SheetClose
                    render={
                      <Link href="/account" aria-current={current('/account')} className={sheetLink}>
                        {t('link.account')}
                      </Link>
                    }
                    nativeButton={false}
                  />
                )}

                <div className="my-3 border-t" />
                <p className="px-1 pb-2 text-sm font-medium text-muted-foreground">{t('menu.language')}</p>
                <LanguageToggle variant="segmented" className="w-full" />

                <div className="my-3 border-t" />
                {user ? (
                  <SheetClose
                    render={
                      <Button variant="outline" size="lg" onClick={logout}>
                        <LogOut aria-hidden="true" /> {tc('action.signOut')}
                      </Button>
                    }
                  />
                ) : (
                  <div className="grid gap-2">
                    <SheetClose
                      render={
                        <Button size="lg" render={<Link href="/signup" />} nativeButton={false}>
                          {tc('action.signUp')}
                        </Button>
                      }
                      nativeButton={false}
                    />
                    <SheetClose
                      render={
                        <Button variant="outline" size="lg" render={<Link href="/login" />} nativeButton={false}>
                          {tc('action.signIn')}
                        </Button>
                      }
                      nativeButton={false}
                    />
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
