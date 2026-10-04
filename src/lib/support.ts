/** Pooja Sevak support contacts (shown on /contact and in help prompts). */
export const SUPPORT_PHONE = '+917838160389';
export const SUPPORT_PHONE_DISPLAY = '+91 78381 60389';
export const SUPPORT_EMAIL = 'support@appme.in';

/** wa.me chat with support, optionally with a prefilled message. */
export function supportWhatsappUrl(text?: string): string {
  const base = `https://wa.me/${SUPPORT_PHONE.replace(/\D/g, '')}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
