'use client';

import { Switch as SwitchPrimitive } from '@base-ui/react/switch';
import { cn } from '@/lib/utils';

/** Accessible on/off switch. Pass `aria-label` or wrap with a <label>. */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
  id,
  ...aria
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}) {
  return (
    <SwitchPrimitive.Root
      id={id}
      checked={checked}
      onCheckedChange={(c) => onCheckedChange(c)}
      disabled={disabled}
      {...aria}
      className={cn(
        // 44px hit area around a 24px track
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent bg-input transition-colors outline-none',
        'before:absolute before:-inset-2.5 before:content-[""]',
        'focus-visible:ring-3 focus-visible:ring-ring/50 data-checked:bg-tulsi',
        'data-disabled:cursor-not-allowed data-disabled:opacity-50',
        className,
      )}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-5 translate-x-0.5 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-200 data-checked:translate-x-[1.375rem]" />
    </SwitchPrimitive.Root>
  );
}
