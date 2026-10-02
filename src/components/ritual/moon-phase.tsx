import { cn } from '@/lib/utils';

/**
 * The moon as it looks on a given tithi (1–30; 15 = Purnima, 30 = Amavasya).
 * Waxing (shukla) lights the right side, waning (krishna) the left. Decorative
 * unless `label` is given.
 */
export function MoonPhase({
  tithi,
  className,
  label,
  tone = 'gold',
}: {
  tithi: number;
  className?: string;
  label?: string;
  /** gold on twilight surfaces; ink on light cards. */
  tone?: 'gold' | 'ink';
}) {
  const t = Math.min(30, Math.max(1, Math.round(tithi)));
  const waxing = t <= 15;
  const lit = waxing ? t / 15 : (30 - t) / 15; // 0 (new) … 1 (full)
  const r = 20;
  const cx = 24;
  const cy = 24;
  const top = `${cx} ${cy - r}`;
  const bottom = `${cx} ${cy + r}`;
  const rx = Math.abs(1 - 2 * lit) * r;
  const crescent = lit < 0.5;

  let litPath: string | null = null;
  if (lit >= 0.995) {
    litPath = null; // full disc drawn below
  } else if (lit > 0.02) {
    // Outer limb on the lit side, then back along the terminator ellipse.
    const limbSweep = waxing ? 1 : 0;
    const termSweep = waxing ? (crescent ? 0 : 1) : crescent ? 1 : 0;
    litPath = `M ${top} A ${r} ${r} 0 0 ${limbSweep} ${bottom} A ${rx.toFixed(2)} ${r} 0 0 ${termSweep} ${top} Z`;
  }

  const litFill = tone === 'gold' ? '#fbe3b6' : 'var(--diya)';
  const darkFill = tone === 'gold' ? 'rgb(255 236 200 / 0.08)' : 'color-mix(in oklab, var(--muted-foreground) 14%, transparent)';
  const rim = tone === 'gold' ? 'rgb(251 227 182 / 0.35)' : 'color-mix(in oklab, var(--diya) 55%, transparent)';

  return (
    <svg
      viewBox="0 0 48 48"
      className={cn('size-8 shrink-0', className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <circle cx={cx} cy={cy} r={r} fill={darkFill} stroke={rim} strokeWidth="1" />
      {lit >= 0.995 && <circle cx={cx} cy={cy} r={r} fill={litFill} />}
      {litPath && <path d={litPath} fill={litFill} />}
    </svg>
  );
}
