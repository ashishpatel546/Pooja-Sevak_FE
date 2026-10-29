import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    // Bilingual: the app is Hindi-first, and the install sheet should read in both scripts.
    name: 'पूजा सेवक — Pooja Sevak',
    short_name: 'पूजा सेवक',
    description:
      'सत्यापित पंडित जी, घर पर या ऑनलाइन पूजा, मुफ़्त कुंडली, मुहूर्त और पंचांग। Verified pandits for home and online pujas, with free kundali, muhurat and panchang.',
    lang: 'hi',
    start_url: '/',
    display: 'standalone',
    background_color: '#fffaf3',
    theme_color: '#fffaf3',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
