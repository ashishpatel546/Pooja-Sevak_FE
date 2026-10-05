'use client';

import { useCallback, useEffect, useState } from 'react';
import { disablePush, enablePush, pushStatus, type PushStatus } from '@/lib/push';

/**
 * Web Push state for this browser and the signed-in user. On mount it quietly
 * re-saves an existing subscription (permission already granted), so a browser
 * shared by two accounts notifies whoever signed in last.
 * Mount it keyed by user id, like useNotifications.
 */
export function usePush(token: string | null) {
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const hasToken = !!token;

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const sync = async () => {
      let next: PushStatus;
      try {
        next = await pushStatus(token);
        if (next === 'on' || (next === 'off' && Notification.permission === 'granted')) {
          next = await enablePush(token, { ask: false });
        }
      } catch {
        next = 'unsupported';
      }
      if (!cancelled) setStatus(next);
    };
    void sync();
    return () => {
      cancelled = true;
    };
    // Once per signed-in user: the access token rotates every few minutes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasToken]);

  const enable = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    try {
      setStatus(await enablePush(token, { ask: true }));
    } finally {
      setBusy(false);
    }
  }, [token]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      await disablePush(token);
      setStatus('off');
    } finally {
      setBusy(false);
    }
  }, [token]);

  return { status, busy, enable, disable };
}
