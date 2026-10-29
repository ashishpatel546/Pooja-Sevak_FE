/**
 * Referral code the visitor arrived with (`?ref=CODE` on any page), kept for
 * 30 days so a later signup can still claim it. Storage failures are ignored:
 * the referral is a nicety, never a blocker.
 */
const KEY = 'ps_ref';
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const CODE = /^[A-Z0-9]{4,16}$/;

export const normalizeRef = (raw: string | null | undefined) =>
  (raw ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

export function storeRef(raw: string | null | undefined) {
  const code = normalizeRef(raw);
  if (!CODE.test(code)) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ code, exp: Date.now() + TTL_MS }));
  } catch {
    // private mode / blocked storage
  }
}

export function readRef(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { code?: string; exp?: number };
    if (!v.code || !CODE.test(v.code) || !v.exp || v.exp < Date.now()) {
      localStorage.removeItem(KEY);
      return null;
    }
    return v.code;
  } catch {
    return null;
  }
}

export function clearRef() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** "₹101" from paise. */
export const rupeesFromPaise = (paise: number) => paise / 100;
