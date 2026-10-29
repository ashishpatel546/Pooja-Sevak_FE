import { brandCard, OG_SIZE } from '@/lib/seo/og';

export const alt = 'Pooja Sevak — shubh muhurat dates';
export const size = OG_SIZE;
export const contentType = 'image/png';

// English only (see src/lib/seo/og.tsx for why the card has no Devanagari).
export default function OpengraphImage() {
  return brandCard({
    eyebrow: 'Free muhurat finder',
    title: 'Shubh Muhurat',
    subtitle: 'Wedding and griha pravesh dates for your city, with choghadiya and Rahu kaal for any day.',
  });
}
