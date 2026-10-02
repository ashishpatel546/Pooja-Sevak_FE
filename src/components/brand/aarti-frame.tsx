import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Card wrapped in the "aarti ring": a single flame of light that circles the
 * border clockwise. Speeds up while a field inside has focus. Static when the
 * user prefers reduced motion.
 */
export function AartiFrame({
  children,
  className,
  innerClassName,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div className={cn('aarti-ring shadow-[0_24px_60px_-28px_rgb(42_31_74/0.45)]', className)}>
      <div className={cn('aarti-inner', innerClassName)}>{children}</div>
    </div>
  );
}
