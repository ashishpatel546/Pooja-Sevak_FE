import { fetchPujaBySlug } from '@/lib/seo/data';
import { brandCard, DEFAULT_CARD, OG_SIZE } from '@/lib/seo/og';

export const alt = 'Pooja Sevak — book a verified pandit for this puja';
export const size = OG_SIZE;
export const contentType = 'image/png';

// English name only (see src/lib/seo/og.tsx for why the card has no Devanagari).
export default async function PujaOpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: puja } = await fetchPujaBySlug(slug);
  if (!puja) return brandCard(DEFAULT_CARD);
  const price = puja.starting_price === null || puja.starting_price === undefined ? null : Number(puja.starting_price);
  return brandCard({
    eyebrow: 'Book a verified pandit',
    title: puja.name,
    subtitle:
      (puja.tagline ?? 'At your home or online.') +
      (price !== null && Number.isFinite(price) ? `  ·  Dakshina from ₹${price.toLocaleString('en-IN')}` : ''),
  });
}
