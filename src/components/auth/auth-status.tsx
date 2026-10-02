import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Outcome screen inside an auth card: icon, heading, message and actions. */
export function AuthStatus({
  icon: Icon,
  tone = 'neutral',
  title,
  children,
  actions,
}: {
  icon: LucideIcon;
  tone?: 'success' | 'warning' | 'neutral';
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div role="status" className="flex flex-col items-start">
      <span
        className={cn(
          'mb-5 grid size-12 place-items-center rounded-full ring-1',
          tone === 'success' && 'bg-tulsi/10 text-tulsi ring-tulsi/30',
          tone === 'warning' && 'bg-kumkum/10 text-kumkum ring-kumkum/30',
          tone === 'neutral' && 'bg-accent text-accent-foreground ring-diya/40',
        )}
      >
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h2 className="text-3xl leading-snug">{title}</h2>
      {children && <div className="mt-2 leading-relaxed text-muted-foreground">{children}</div>}
      {actions && <div className="mt-7 grid w-full gap-3">{actions}</div>}
    </div>
  );
}
