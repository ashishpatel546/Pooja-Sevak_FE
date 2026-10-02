'use client';

import { useState } from 'react';
import { Laptop, Loader2, LogOut, MonitorSmartphone, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n';
import { useFormat } from '@/i18n/use-format';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { AuthResponse, AuthSession } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/dashboard/field';
import { errorMessage, useApi } from '@/components/dashboard/use-api';
import { SectionIcon } from './sections';

function DeviceIcon({ device }: { device: string }) {
  const Icon = /Android|iOS/.test(device) ? Smartphone : /Windows|macOS|Linux/.test(device) ? Laptop : MonitorSmartphone;
  return <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />;
}

/** "Signed-in devices": the account's live refresh-token sessions. */
export function SessionsSection() {
  const t = useT('account');
  const tc = useT('common');
  const f = useFormat();
  const { token, setSession } = useAuth();
  const sessions = useApi<AuthSession[]>('/auth/sessions', token);
  const [busy, setBusy] = useState<string | null>(null);
  const list = sessions.data ?? [];
  const others = list.filter((s) => !s.current);

  const signOutOne = async (id: string) => {
    setBusy(id);
    try {
      await api(`/auth/sessions/${id}`, { method: 'DELETE', token });
      sessions.mutate((prev) => (prev ?? []).filter((s) => s.id !== id));
      toast.success(t('sessions.signedOutOne'));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const signOutOthers = async () => {
    setBusy('others');
    try {
      // Also invalidates their access tokens; this device gets a fresh one.
      const res = await api<AuthResponse & { revoked: number }>('/auth/sessions', { method: 'DELETE', token });
      if (res.access_token) await setSession(res);
      sessions.mutate((prev) => (prev ?? []).filter((s) => s.current));
      toast.success(t('sessions.signedOutOthers'));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Panel
      title={t('sessions.title')}
      description={t('sessions.description')}
      icon={
        <SectionIcon>
          <MonitorSmartphone className="size-5" aria-hidden="true" />
        </SectionIcon>
      }
    >
      <div aria-live="polite" className="grid gap-4">
        {sessions.loading && !sessions.data ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {tc('state.loading')}
          </p>
        ) : sessions.error && !sessions.data ? (
          <div className="flex flex-wrap items-center gap-3 text-sm text-destructive">
            <span>{t('sessions.loadError')}</span>
            <Button variant="outline" className="min-h-11" onClick={sessions.reload}>
              {t('delete.retry')}
            </Button>
          </div>
        ) : (
          <>
            <ul className="grid gap-3">
              {list.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border p-4 sm:flex-nowrap">
                  <DeviceIcon device={s.device} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      {s.device}
                      {s.current && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                          {t('sessions.thisDevice')}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('sessions.lastActive', { when: f.dateTime(s.last_used_at) })}
                      {s.ip ? ` · ${s.ip}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('sessions.signedIn', { when: f.date(s.created_at) })}
                    </p>
                  </div>
                  {!s.current && (
                    <Button
                      variant="ghost"
                      className="min-h-11"
                      disabled={!!busy}
                      onClick={() => signOutOne(s.id)}
                      aria-label={t('sessions.signOutDeviceLabel', { device: s.device })}
                    >
                      {busy === s.id && <Loader2 className="animate-spin" aria-hidden="true" />}
                      {t('sessions.signOutDevice')}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
            {others.length > 0 ? (
              <div>
                <Button variant="outline" size="lg" className="min-h-11" disabled={!!busy} onClick={signOutOthers}>
                  {busy === 'others' ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  ) : (
                    <LogOut aria-hidden="true" />
                  )}
                  {t('sessions.signOutOthers')}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('sessions.onlyThis')}</p>
            )}
          </>
        )}
      </div>
    </Panel>
  );
}
