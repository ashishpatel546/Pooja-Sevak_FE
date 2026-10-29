'use client';

import { useEffect, useRef, useState } from 'react';
import { BellRing, Check } from 'lucide-react';
import { useT } from '@/i18n';
import { track } from '@/lib/analytics';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { usePush } from './use-push';

const SNOOZE_KEY = 'ps_push_preprompt_snooze';
const SNOOZE_MS = 14 * 24 * 60 * 60_000;

function snoozed(): boolean {
  try {
    return Number(localStorage.getItem(SNOOZE_KEY) || 0) > Date.now();
  } catch {
    return false;
  }
}

function snooze() {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
  } catch {
    /* storage unavailable: the card may show again next time */
  }
}

function permissionUnasked(): boolean {
  return typeof Notification !== 'undefined' && Notification.permission === 'default';
}

function Card({ token, source, className }: { token: string; source: string; className?: string }) {
  const t = useT('tools');
  const push = usePush(token);
  const [hidden, setHidden] = useState(true);
  const [done, setDone] = useState(false);
  const shown = useRef(false);

  // Our own card first; the browser's prompt only after "Turn on". Shown to a
  // signed-in family who has not been asked yet and has not said "not now" lately.
  const eligible = push.status === 'off' && permissionUnasked();
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is client-only
    setHidden(!eligible || snoozed());
  }, [eligible]);
  useEffect(() => {
    if (!hidden && !shown.current) {
      shown.current = true;
      track('push_prompt_shown', { source });
    }
  }, [hidden, source]);

  if (done) {
    return (
      <p role="status" className={cn('flex items-center gap-2 rounded-2xl border bg-tulsi/10 p-4 print:hidden', className)}>
        <Check className="size-5 text-tulsi" aria-hidden="true" />
        {t('push.done')}
      </p>
    );
  }
  if (hidden) return null;

  const accept = async () => {
    await push.enable();
    // enable() leaves the result in push.status; read the permission directly instead.
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      track('push_prompt_accepted', { source });
      setDone(true);
    } else {
      snooze();
      setHidden(true);
    }
  };
  const later = () => {
    snooze();
    setHidden(true);
  };

  return (
    <aside
      aria-labelledby="push-preprompt-title"
      className={cn(
        'flex flex-col gap-4 rounded-2xl border border-diya/50 bg-chandan/60 p-5 sm:flex-row sm:items-center sm:justify-between print:hidden',
        className,
      )}
    >
      <div className="flex gap-3">
        <BellRing className="mt-1 size-6 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <p id="push-preprompt-title" className="font-heading text-xl text-heading">
            {t('push.title')}
          </p>
          <p className="mt-1 text-sm">{t('push.text')}</p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button onClick={accept} disabled={push.busy}>
          {t('push.accept')}
        </Button>
        <Button variant="ghost" onClick={later}>
          {t('push.later')}
        </Button>
      </div>
    </aside>
  );
}

/**
 * Soft pre-prompt for Web Push at a high-value moment (after a kundali or milan,
 * a muhurat search, on the panchang). Renders nothing for visitors who are signed
 * out, already subscribed, blocked notifications, or snoozed it (14 days).
 */
export function PushPrePrompt({ source, className }: { source: string; className?: string }) {
  const { user, token } = useAuth();
  if (!user || !token) return null;
  return <Card key={user.id} token={token} source={source} className={className} />;
}
