'use client';

import {
  Baby,
  BookOpen,
  Droplets,
  Flame,
  Home,
  type LucideIcon,
  Orbit,
  PartyPopper,
  Sparkles,
} from 'lucide-react';
import { createElement } from 'react';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

type CategoryKey = 'sanskar' | 'griha' | 'shanti' | 'path' | 'festival' | 'abhishek';

/** Known API category values. `key` picks the translated label in the 'catalog' namespace. */
export const CATEGORY_META: Record<string, { icon: LucideIcon; blurb: string; key: CategoryKey }> = {
  Sanskar: { icon: Baby, blurb: 'Rites of passage, from naming to marriage', key: 'sanskar' },
  'Griha & Vastu': { icon: Home, blurb: 'Blessings for a new home or land', key: 'griha' },
  'Shanti & Dosh': { icon: Orbit, blurb: 'Pacify planets and ease doshas', key: 'shanti' },
  'Path & Katha': { icon: BookOpen, blurb: 'Sacred recitations and kathas', key: 'path' },
  Festival: { icon: PartyPopper, blurb: 'Festive pujas done the right way', key: 'festival' },
  'Abhishek & Jaap': { icon: Droplets, blurb: 'Abhishek, jaap and havan', key: 'abhishek' },
};

/**
 * Translated category label and blurb. Unknown categories fall back to the
 * raw API value (label) and no blurb.
 */
export function useCategoryLabel() {
  const t = useT('catalog');
  return {
    label: (category: string | null | undefined): string => {
      if (!category) return '';
      const meta = CATEGORY_META[category];
      return meta ? t(`category.${meta.key}`) : category;
    },
    blurb: (category: string | null | undefined): string | null => {
      const meta = category ? CATEGORY_META[category] : undefined;
      return meta ? t(`category.${meta.key}.blurb`) : null;
    },
  };
}

export function categoryIcon(category: string | null | undefined): LucideIcon {
  return (category && CATEGORY_META[category]?.icon) || Sparkles;
}

/** Round icon token for a puja category. */
export function PujaIcon({
  category,
  className,
  size = 'md',
}: {
  category: string | null | undefined;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const box = size === 'sm' ? 'size-9' : size === 'lg' ? 'size-14' : 'size-11';
  const ico = size === 'sm' ? 'size-4' : size === 'lg' ? 'size-7' : 'size-5';
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-accent text-accent-foreground ring-1 ring-diya/30',
        box,
        className,
      )}
    >
      {createElement(categoryIcon(category) ?? Flame, { className: ico, 'aria-hidden': true })}
    </span>
  );
}
