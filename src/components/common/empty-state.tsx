import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-2xl border border-dashed bg-card/60 px-6 py-12 text-center',
        className,
      )}
    >
      {Icon && (
        <span className="mb-4 grid size-14 place-items-center rounded-full bg-accent text-accent-foreground">
          <Icon className="size-6" aria-hidden="true" />
        </span>
      )}
      <h2 className="text-xl">{title}</h2>
      {children && <div className="mt-2 max-w-md text-muted-foreground">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
