'use client';

import { CheckCircle2, HandHeart, ScrollText } from 'lucide-react';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

export type SignupRole = 'customer' | 'pandit';

const ROLES = [
  { value: 'customer', icon: HandHeart, title: 'signup.role.customer.title', text: 'signup.role.customer.text' },
  { value: 'pandit', icon: ScrollText, title: 'signup.role.pandit.title', text: 'signup.role.pandit.text' },
] as const;

/** "भक्त — पूजा बुक करें / पंडित जी — अपनी पूजा-सेवाएँ दें" radio cards (signup and choose-role). */
export function RoleCards({
  value,
  onChange,
  legend,
  className,
}: {
  value: SignupRole | null;
  onChange: (role: SignupRole) => void;
  legend: string;
  className?: string;
}) {
  const t = useT('auth');
  return (
    <fieldset className={className}>
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div className="grid grid-cols-2 gap-3">
        {ROLES.map((r) => {
          const active = value === r.value;
          return (
            <label
              key={r.value}
              className={cn(
                'relative flex min-h-28 cursor-pointer flex-col gap-1.5 rounded-xl border-2 p-3 transition-colors sm:p-4',
                'has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
                active
                  ? 'border-primary bg-accent/70 text-accent-foreground'
                  : 'border-input hover:border-primary/40 hover:bg-muted/60',
              )}
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={active}
                onChange={() => onChange(r.value)}
                className="sr-only"
              />
              {active && <CheckCircle2 className="absolute top-2.5 right-2.5 size-5 text-primary" aria-hidden="true" />}
              <r.icon className={cn('size-6', active ? 'text-primary' : 'text-muted-foreground')} aria-hidden="true" />
              <span className="text-base leading-snug font-semibold">{t(r.title)}</span>
              <span className="text-xs leading-snug text-muted-foreground">{t(r.text)}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
