import { cn } from '@/lib/utils';
import { Diya } from '@/components/brand/diya';
import { MoonPhase } from '@/components/ritual/moon-phase';

const PHASES = [15, 18, 22, 26, 30, 4, 8, 11];

/** A diya inside a ring of the moon's phases — the lunar year turning. Decorative. */
export function MoonRing({ className }: { className?: string }) {
  return (
    <div className={cn('relative aspect-square', className)} aria-hidden="true">
      <div className="absolute inset-[14%] rounded-full border border-dashed border-diya/40" />
      <div className="absolute inset-[30%] rounded-full bg-[radial-gradient(circle,rgb(226_162_59/0.35),transparent_70%)]" />
      {PHASES.map((tithi, i) => {
        const angle = (i / PHASES.length) * 2 * Math.PI - Math.PI / 2;
        const x = 50 + 36 * Math.cos(angle);
        const y = 50 + 36 * Math.sin(angle);
        return (
          <span
            key={tithi}
            className="absolute grid size-[17%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-sandhya ring-1 ring-diya/30"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <MoonPhase tithi={tithi} tone="gold" className="size-[70%]" />
          </span>
        );
      })}
      <div className="absolute inset-0 grid place-items-center">
        <Diya className="size-[34%]" />
      </div>
    </div>
  );
}
