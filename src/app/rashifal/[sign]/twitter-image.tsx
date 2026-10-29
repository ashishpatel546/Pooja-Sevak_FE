import { rashiBySlug } from '@/lib/rashifal';
import { brandCard, DEFAULT_CARD, OG_SIZE } from '@/lib/seo/og';

export const alt = 'Pooja Sevak — today’s rashifal for this moon sign';
export const size = OG_SIZE;
export const contentType = 'image/png';

// English only (see src/lib/seo/og.tsx for why the card has no Devanagari).
export default async function RashifalSignImage({ params }: { params: Promise<{ sign: string }> }) {
  const r = rashiBySlug((await params).sign);
  if (!r) return brandCard(DEFAULT_CARD);
  return brandCard({
    eyebrow: 'Daily rashifal',
    title: `${r.en} (${r.western}) Horoscope Today`,
    subtitle: 'Work, money, family, health, lucky colour and a traditional remedy — from today’s gochar.',
  });
}
