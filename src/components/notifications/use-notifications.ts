'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { NotificationList } from '@/lib/types';

/**
 * Polling is only a fallback now that new notifications arrive by Web Push, so
 * it is slow, and every delay is randomised (±20 %) so that clients that loaded
 * at the same moment (e.g. after a deploy) drift apart instead of hitting the
 * API in lockstep.
 */
const POLL_MS = 5 * 60_000;
const POLL_JITTER = 0.2;
/** Focus / tab switches refetch only when the data is older than this. */
const STALE_MS = 60_000;
/** A push can reach many open tabs at once; spread their refetches over this window. */
const PUSH_REFRESH_SPREAD_MS = 3_000;

function nextPollDelay(): number {
  return POLL_MS * (1 - POLL_JITTER + Math.random() * 2 * POLL_JITTER);
}

/**
 * In-app notifications for the signed-in user. Fetches on mount, about every
 * 5 minutes while the tab is visible, when the window regains focus (if stale)
 * and shortly after a Web Push arrives. Mount it keyed by user id so a
 * different account never sees stale data.
 */
export function useNotifications(token: string | null) {
  const [data, setData] = useState<NotificationList | null>(null);
  const [error, setError] = useState(false);
  /** Time of the last response, used to render relative times without calling Date.now() in render. */
  const [fetchedAt, setFetchedAt] = useState(0);
  const seq = useRef(0);
  /** Wall-clock time of the last completed fetch (ref: read inside timers). */
  const lastFetch = useRef(0);

  const load = useCallback(async () => {
    if (!token) return;
    const id = ++seq.current;
    try {
      const res = await api<NotificationList>('/notifications', { token, query: { limit: 20 } });
      if (id !== seq.current) return; // a newer request is in flight
      setData(res);
      setError(false);
    } catch {
      if (id !== seq.current) return;
      setError(true);
    }
    lastFetch.current = Date.now();
    setFetchedAt(lastFetch.current);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const visible = () => document.visibilityState === 'visible';
    const refreshIfStale = () => {
      if (visible() && Date.now() - lastFetch.current >= STALE_MS) void load();
    };
    // load() only sets state after the network response (an external system),
    // never synchronously, so this doesn't cause a cascading render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();

    let pollTimer = 0;
    const schedule = () => {
      pollTimer = window.setTimeout(() => {
        if (visible()) void load();
        schedule();
      }, nextPollDelay());
    };
    schedule();

    let pushTimer = 0;
    const onWorkerMessage = (e: MessageEvent) => {
      if ((e.data as { type?: string } | null)?.type !== 'notifications:changed') return;
      window.clearTimeout(pushTimer);
      pushTimer = window.setTimeout(() => void load(), Math.random() * PUSH_REFRESH_SPREAD_MS);
    };
    const worker = 'serviceWorker' in navigator ? navigator.serviceWorker : null;

    window.addEventListener('focus', refreshIfStale);
    document.addEventListener('visibilitychange', refreshIfStale);
    worker?.addEventListener('message', onWorkerMessage);
    return () => {
      window.clearTimeout(pollTimer);
      window.clearTimeout(pushTimer);
      window.removeEventListener('focus', refreshIfStale);
      document.removeEventListener('visibilitychange', refreshIfStale);
      worker?.removeEventListener('message', onWorkerMessage);
    };
  }, [token, load]);

  const markRead = useCallback(
    async (id: string) => {
      if (!token) return;
      seq.current++; // ignore any poll that started before this change
      setData((prev) => {
        if (!prev) return prev;
        const target = prev.items.find((n) => n.id === id);
        if (!target || target.read_at) return prev;
        const now = new Date().toISOString();
        return {
          unread: Math.max(0, prev.unread - 1),
          items: prev.items.map((n) => (n.id === id ? { ...n, read_at: now } : n)),
        };
      });
      try {
        await api(`/notifications/${encodeURIComponent(id)}/read`, { method: 'POST', token });
      } catch {
        void load();
      }
    },
    [token, load],
  );

  const markAllRead = useCallback(async () => {
    if (!token) return;
    seq.current++;
    const previous = data;
    const now = new Date().toISOString();
    setData((prev) =>
      prev ? { unread: 0, items: prev.items.map((n) => (n.read_at ? n : { ...n, read_at: now })) } : prev,
    );
    try {
      await api('/notifications/read-all', { method: 'POST', token });
    } catch (e) {
      setData(previous);
      throw e;
    }
  }, [token, data]);

  return {
    items: data?.items ?? [],
    unread: data?.unread ?? 0,
    loaded: data !== null,
    error,
    fetchedAt,
    reload: load,
    markRead,
    markAllRead,
  };
}
