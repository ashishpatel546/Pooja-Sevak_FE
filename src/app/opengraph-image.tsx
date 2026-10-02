import { brandCard, DEFAULT_CARD, OG_SIZE } from '@/lib/seo/og';

export const alt = 'Pooja Sevak — verified pandits for home and online pujas';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function OpengraphImage() {
  return brandCard(DEFAULT_CARD);
}
