import { brandCard, OG_SIZE } from '@/lib/seo/og';

export const alt = 'Pooja Sevak — free janam kundali';
export const size = OG_SIZE;
export const contentType = 'image/png';

// English only (see src/lib/seo/og.tsx for why the card has no Devanagari).
export default function OpengraphImage() {
  return brandCard({
    eyebrow: 'Free jyotish tool',
    title: 'Free Janam Kundali',
    subtitle: 'Lagna, nine grahas, nakshatra, Manglik dosha and Vimshottari dasha, in Hindi or English. Lahiri ayanamsa.',
  });
}
