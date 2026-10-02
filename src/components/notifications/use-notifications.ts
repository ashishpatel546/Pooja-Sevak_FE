'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { NotificationList } from '@/lib/types';

const POLL_MS = 60_000;

/**
 * In-app notifications for the signed-in user. Fetches on mount, every 60 s
 * while the tab is visible, and whenever the window regains focus.
 * Mount it keyed by user id so a different account never sees stale data.
 */
export function useNotifications(token: string | null) {
  const [data, setData] = useState<NotificationList | null>(null);
  const [error, setError] = useState(false);
  /** Time of the last response, used to render relative times without calling Date.now() in render. */
  const [fetchedAt, setFetchedAt] = useState(0);
  const seq = useRef(0);

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
    setFetchedAt(Date.now());
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') void load();
    };
    // load() only sets state after the network response (an external system),
    // never synchronously, so this doesn't cause a cascading render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const timer = window.setInterval(refreshIfVisible, POLL_MS);
    window.addEventListener('focus', refreshIfVisible);
    document.addEventListener('visibilitychange', refreshIfVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshIfVisible);
      document.removeEventListener('visibilitychange', refreshIfVisible);
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
