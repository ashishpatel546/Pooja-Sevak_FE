/**
 * One-shot toast that survives a full page navigation (e.g. sign-out after
 * account deletion). setFlash() before navigating; the Toaster shows it on the
 * next page load and clears it.
 */
const FLASH_KEY = 'ps_flash';

export type Flash = { type: 'success' | 'info'; message: string };

export function setFlash(flash: Flash) {
  try {
    sessionStorage.setItem(FLASH_KEY, JSON.stringify(flash));
  } catch {
    /* storage unavailable: the toast is a nicety */
  }
}

export function takeFlash(): Flash | null {
  try {
    const raw = sessionStorage.getItem(FLASH_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(FLASH_KEY);
    const f = JSON.parse(raw) as Flash;
    return typeof f?.message === 'string' ? f : null;
  } catch {
    return null;
  }
}
