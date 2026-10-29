import { brandCard, OG_SIZE } from '@/lib/seo/og';

export const alt = 'Pooja Sevak — free kundali milan (36 guna matching)';
export const size = OG_SIZE;
export const contentType = 'image/png';

// English only (see src/lib/seo/og.tsx for why the card has no Devanagari).
export default function OpengraphImage() {
  return brandCard({
    eyebrow: 'Free jyotish tool',
    title: 'Kundali Milan · 36 Gunas',
    subtitle: 'Free Ashtakoot guna milan with Manglik, Nadi and Bhakoot dosha checks. For guidance only.',
  });
}
