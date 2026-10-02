/** Normalise "+91 98765-43210" / "098765 43210" to 10 digits. */
export function normaliseMobile(v: string) {
  const d = v.replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) return d.slice(2);
  if (d.length === 11 && d.startsWith('0')) return d.slice(1);
  return d;
}

/** Valid Indian mobile: 10 digits starting 6–9 (after normalising). */
export const isIndianMobile = (v: string) => /^[6-9]\d{9}$/.test(normaliseMobile(v));
