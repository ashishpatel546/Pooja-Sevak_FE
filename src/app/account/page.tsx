'use client';

import Link from 'next/link';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useT } from '@/i18n';
import { useAuth } from '@/lib/auth-context';
import { useRequireAuth } from '@/lib/use-require-auth';
import type { AuthUser } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PageHeader, PageShell } from '@/components/common/page-header';
import { DiyaLoader } from '@/components/common/loading';
import { EmailSection, LanguageSection, PasswordSection, ProfileSection } from './_components/sections';
import { KulParichaySection } from './_components/kul-parichay';
import { DeleteAccountSection } from './_components/delete-account';
import { SessionsSection } from './_components/sessions';
import { PhotoPicker } from '@/components/common/photo-picker';

export default function AccountPage() {
  const t = useT('account');
  const tc = useT('common');
  const { ready, user } = useRequireAuth();
  return (
    <PageShell size="narrow">
      <PageHeader
        back={
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> {t('back')}
          </Link>
        }
        title={t('title')}
        description={t('description')}
      />
      {!ready || !user ? <DiyaLoader label={tc('state.loading')} /> : <AccountSections key={user.id} user={user} />}
    </PageShell>
  );
}

function AccountSections({ user }: { user: AuthUser }) {
  const t = useT('account');
  const { token, logout } = useAuth();
  const showKul = user.role === 'customer';

  const sections = [
    { id: 'profile', label: t('jump.profile') },
    { id: 'photo', label: t('jump.photo') },
    { id: 'email', label: t('jump.email') },
    { id: 'language', label: t('jump.language') },
    { id: 'password', label: t('jump.password') },
    { id: 'sessions', label: t('jump.sessions') },
    ...(showKul ? [{ id: 'kul-parichay', label: t('jump.kul') }] : []),
    { id: 'delete-account', label: t('jump.delete') },
  ];

  const signOut = () => {
    logout();
    // Hard navigation so the auth guard on this page doesn't bounce to /login.
    window.location.assign('/');
  };

  return (
    <div className="grid gap-6">
      <nav aria-label={t('jump.label')} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex w-max gap-2 pb-1">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="inline-flex min-h-11 items-center rounded-full border bg-card px-4 text-sm font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div id="profile" className="scroll-mt-24">
        <ProfileSection key={`${user.name}|${user.mobile}`} user={user} />
      </div>
      <div id="photo" className="scroll-mt-24">
        <PhotoPicker variant={user.role === 'pandit' ? 'pandit' : 'customer'} />
      </div>
      <div id="email" className="scroll-mt-24">
        <EmailSection user={user} />
      </div>
      <div id="language" className="scroll-mt-24">
        <LanguageSection />
      </div>
      <div id="password" className="scroll-mt-24">
        <PasswordSection email={user.email} />
      </div>
      <div id="sessions" className="scroll-mt-24">
        <SessionsSection />
      </div>
      {showKul && token && (
        <div id="kul-parichay" className="scroll-mt-24">
          <KulParichaySection token={token} />
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-dashed p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="break-all text-muted-foreground">{t('signedInAs', { email: user.email })}</p>
        <Button variant="outline" className="min-h-11 shrink-0" onClick={signOut}>
          <LogOut aria-hidden="true" /> {t('signOut')}
        </Button>
      </div>

      <div id="delete-account" className="scroll-mt-24">
        <DeleteAccountSection user={user} />
      </div>
    </div>
  );
}
