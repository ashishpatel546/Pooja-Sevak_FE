import { brandCard, OG_SIZE } from '@/lib/seo/og';

export const alt = 'Pooja Sevak — today’s panchang';
export const size = OG_SIZE;
export const contentType = 'image/png';

// English only (see src/lib/seo/og.tsx for why the card has no Devanagari).
export default function OpengraphImage() {
  return brandCard({
    eyebrow: 'Free daily panchang',
    title: 'Aaj ka Panchang',
    subtitle: 'Today’s tithi, nakshatra, sunrise and sunset for your city, with vrat and festivals ahead.',
  });
}
