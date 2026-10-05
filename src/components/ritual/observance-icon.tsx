import {
  BookOpen,
  Crown,
  Feather,
  Flame,
  Flower2,
  Gem,
  HeartHandshake,
  MoonStar,
  Palette,
  Sun,
  Swords,
  TreeDeciduous,
  type LucideIcon,
} from 'lucide-react';
import type { FestivalId, ObservanceKey } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Diya } from '@/components/brand/diya';
import { MoonPhase } from './moon-phase';
import { TYPICAL_TITHI } from './observance';

/** A festival's own sign; anything not listed gets a flower offering. */
const FESTIVAL_GLYPH: Partial<Record<FestivalId, LucideIcon | 'diya'>> = {
  makar_sankranti: Sun,
  chhath_puja: Sun,
  vasant_panchami: BookOpen,
  guru_purnima: BookOpen,
  holika_dahan: Flame,
  holi: Palette,
  ram_navami: Crown,
  dussehra: Swords,
  janmashtami: Feather,
  akshaya_tritiya: Gem,
  vat_savitri: TreeDeciduous,
  raksha_bandhan: HeartHandshake,
  bhai_dooj: HeartHandshake,
  karwa_chauth: MoonStar,
  dhanteras: 'diya',
  diwali: 'diya',
};

/**
 * The mark for a sacred day: a festival's own sign, the moon's phase for lunar
 * days, the sun for Sankranti, and a diya for the fortnight of the ancestors
 * and for the loved ones a family remembers (pass `observanceKey={null}`).
 * Sits in a round well so lists line up. Decorative.
 */
export function ObservanceIcon({
  observanceKey,
  festival,
  tithi,
  size = 'md',
  tone = 'ink',
  className,
}: {
  observanceKey: ObservanceKey | null;
  festival?: FestivalId | null;
  tithi?: number | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  tone?: 'gold' | 'ink';
  className?: string;
}) {
  const well = { xs: 'size-6', sm: 'size-9', md: 'size-11', lg: 'size-14' }[size];
  const glyph = { xs: 'size-4', sm: 'size-6', md: 'size-7', lg: 'size-9' }[size];
  const surface =
    tone === 'gold' ? 'bg-white/5 ring-1 ring-[#fbe3b6]/20' : 'bg-chandan ring-1 ring-diya/30';

  let inner: React.ReactNode;
  const sign = festival ? (FESTIVAL_GLYPH[festival] ?? Flower2) : null;
  if (sign === 'diya') {
    inner = <Diya className={glyph} />;
  } else if (sign) {
    const Sign = sign;
    inner = <Sign className={cn(glyph, tone === 'gold' ? 'text-diya' : 'text-sindoor')} aria-hidden="true" />;
  } else if (observanceKey === 'sankranti') {
    inner = <Sun className={cn(glyph, tone === 'gold' ? 'text-diya' : 'text-sindoor')} aria-hidden="true" />;
  } else if (observanceKey === 'pitru_paksha' || observanceKey === null) {
    inner = <Diya className={glyph} />;
  } else {
    const t = tithi ?? (observanceKey ? TYPICAL_TITHI[observanceKey] : 15);
    inner = <MoonPhase tithi={t} tone={tone} className={glyph} />;
  }

  return (
    <span className={cn('grid shrink-0 place-items-center rounded-full', well, surface, className)} aria-hidden="true">
      {inner}
    </span>
  );
}
