import { useId } from 'react';
import { cn } from '@/lib/utils';

/** Clay diya with a gently flickering flame. Decorative. */
export function Diya({ className, lit = true }: { className?: string; lit?: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const glow = `dg-${uid}`;
  const flame = `df-${uid}`;
  const clay = `dc-${uid}`;
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={cn('size-8 overflow-visible', className)}
    >
      <defs>
        <radialGradient id={glow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd98a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffd98a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={flame} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#c2410c" />
          <stop offset="45%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fff3c4" />
        </linearGradient>
        <linearGradient id={clay} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d9783a" />
          <stop offset="100%" stopColor="#8a3b12" />
        </linearGradient>
      </defs>
      {lit && <circle className="diya-glow" cx="32" cy="24" r="22" fill={`url(#${glow})`} />}
      {lit && (
        <path
          className="diya-flame"
          d="M32 8c4 7 7 11 7 16a7 7 0 0 1-14 0c0-5 3-9 7-16z"
          fill={`url(#${flame})`}
        />
      )}
      <path
        d="M6 36c0 0 6 16 26 16s26-16 26-16c-6 2-14 3-26 3S12 38 6 36z"
        fill={`url(#${clay})`}
      />
      <path d="M50 37c4-1 7-3 9-6-1 4-3 7-6 9z" fill="#8a3b12" />
      <ellipse cx="32" cy="37" rx="22" ry="3" fill="#5c2509" opacity="0.55" />
    </svg>
  );
}
