import { brandCard, OG_SIZE } from '@/lib/seo/og';

export const alt = 'Pooja Sevak — today’s rashifal for all twelve moon signs';
export const size = OG_SIZE;
export const contentType = 'image/png';

// English only (see src/lib/seo/og.tsx for why the card has no Devanagari).
export default function RashifalImage() {
  return brandCard({
    eyebrow: 'Daily rashifal',
    title: 'Today’s Horoscope for All 12 Rashis',
    subtitle: 'Read from today’s planetary positions (gochar, Lahiri ayanamsa) — work, money, family, health and a simple remedy.',
  });
}
