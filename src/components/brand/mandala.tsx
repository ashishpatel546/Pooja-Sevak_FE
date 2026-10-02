import { cn } from '@/lib/utils';

/** Line-art mandala built from rotated lotus petals. Decorative. */
export function Mandala({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const petals = Array.from({ length: 16 }, (_, i) => i * 22.5);
  const inner = Array.from({ length: 8 }, (_, i) => i * 45 + 22.5);
  return (
    <svg
      viewBox="-100 -100 200 200"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      className={cn('pointer-events-none', className)}
      style={style}
    >
      <circle r="96" strokeWidth="0.5" />
      <circle r="90" strokeWidth="0.35" strokeDasharray="1 3" />
      {petals.map((a) => (
        <path
          key={`o${a}`}
          transform={`rotate(${a})`}
          d="M0 -86 C 14 -70 14 -52 0 -40 C -14 -52 -14 -70 0 -86 Z"
          strokeWidth="0.6"
        />
      ))}
      <circle r="40" strokeWidth="0.5" />
      {inner.map((a) => (
        <path
          key={`i${a}`}
          transform={`rotate(${a})`}
          d="M0 -38 C 10 -28 10 -18 0 -12 C -10 -18 -10 -28 0 -38 Z"
          strokeWidth="0.6"
        />
      ))}
      <circle r="10" strokeWidth="0.6" />
      <circle r="3" strokeWidth="0.6" />
    </svg>
  );
}
