import { api } from './api';

/**
 * Web Push (browser notifications even when the app is closed). The backend
 * holds the VAPID key pair; a subscription is per browser and belongs to the
 * account signed in on it.
 */

export type PushStatus =
  /** Browser can't do Web Push (or iOS Safari outside a home-screen app). */
  | 'unsupported'
  /** Server has no VAPID keys configured. */
  | 'disabled'
  /** User blocked notifications for this site. */
  | 'denied'
  /** Not asked yet, or allowed but this browser isn't subscribed. */
  | 'off'
  | 'on';

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

let keyPromise: Promise<string | null> | null = null;

function publicKey(token: string): Promise<string | null> {
  keyPromise ??= api<{ public_key: string | null }>('/notifications/push/key', { token })
    .then((r) => r.public_key)
    .catch((e) => {
      keyPromise = null; // retry next time
      throw e;
    });
  return keyPromise;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  // register() is idempotent; the install prompt registers the same worker.
  await navigator.serviceWorker.register('/sw.js');
  return navigator.serviceWorker.ready;
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = (value + '='.repeat((4 - (value.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function sameKey(sub: PushSubscription, key: Uint8Array): boolean {
  const current = sub.options.applicationServerKey;
  if (!current) return false;
  const a = new Uint8Array(current);
  return a.length === key.length && a.every((b, i) => b === key[i]);
}

export async function pushStatus(token: string): Promise<PushStatus> {
  if (!isPushSupported()) return 'unsupported';
  if (!(await publicKey(token))) return 'disabled';
  if (Notification.permission === 'denied') return 'denied';
  if (Notification.permission !== 'granted') return 'off';
  const sub = await (await registration()).pushManager.getSubscription();
  return sub ? 'on' : 'off';
}

/**
 * Subscribes this browser and saves it for the signed-in user. With `ask`, shows
 * the permission prompt (call it from a click); without, only proceeds when
 * permission was already granted. Returns the resulting status.
 */
export async function enablePush(token: string, { ask }: { ask: boolean }): Promise<PushStatus> {
  if (!isPushSupported()) return 'unsupported';
  const key = await publicKey(token);
  if (!key) return 'disabled';
  let permission = Notification.permission;
  if (permission === 'default' && ask) permission = await Notification.requestPermission();
  if (permission === 'denied') return 'denied';
  if (permission !== 'granted') return 'off';

  const keyBytes = base64UrlToBytes(key);
  const pushManager = (await registration()).pushManager;
  let sub = await pushManager.getSubscription();
  if (sub && !sameKey(sub, keyBytes)) {
    // Server key changed: the old subscription can no longer receive pushes.
    await sub.unsubscribe().catch(() => {});
    sub = null;
  }
  sub ??= await pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes });
  await api('/notifications/push/subscribe', { method: 'POST', token, body: sub.toJSON() });
  return 'on';
}

/** Stops pushes to this browser (sign-out, or the user turns them off). Never throws. */
export async function disablePush(token: string | null): Promise<void> {
  if (!isPushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return;
    if (token) {
      await api('/notifications/push/unsubscribe', {
        method: 'POST',
        token,
        body: { endpoint: sub.endpoint },
      }).catch(() => {});
    }
    await sub.unsubscribe();
  } catch {
    /* best effort */
  }
}
