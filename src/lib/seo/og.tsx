import { ImageResponse } from 'next/og';

// Branded 1200×630 social card. Text is English: ImageResponse (satori) can't
// shape Devanagari conjuncts and matras correctly, and the Hindi brand name is
// still carried by og:title / og:description.
export const OG_SIZE = { width: 1200, height: 630 };

export function brandCard({ title, subtitle, eyebrow }: { title: string; subtitle: string; eyebrow?: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: 'linear-gradient(135deg, #140f24 0%, #3a1d3f 55%, #b8430c 100%)',
          color: '#fbe3b6',
          fontFamily: 'serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* A simple diya: flame over a bowl. */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 72 }}>
            <div
              style={{
                width: 26,
                height: 40,
                borderRadius: '50% 50% 50% 50% / 65% 65% 35% 35%',
                background: 'linear-gradient(180deg, #fff3c4 0%, #f7b733 60%, #ea580c 100%)',
              }}
            />
            <div
              style={{
                width: 72,
                height: 30,
                marginTop: 4,
                borderRadius: '0 0 36px 36px',
                background: '#ea580c',
              }}
            />
          </div>
          <div style={{ display: 'flex', fontSize: 40, letterSpacing: 2, color: '#f4e6d4' }}>Pooja Sevak</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {eyebrow ? (
            <div style={{ display: 'flex', fontSize: 28, color: '#f7b733', textTransform: 'uppercase', letterSpacing: 3 }}>
              {eyebrow}
            </div>
          ) : null}
          <div style={{ display: 'flex', fontSize: title.length > 28 ? 64 : 80, lineHeight: 1.1, color: '#fff7e8' }}>
            {title}
          </div>
          <div style={{ display: 'flex', fontSize: 34, lineHeight: 1.35, color: '#f4e6d4', maxWidth: 960 }}>
            {subtitle}
          </div>
        </div>
        <div style={{ display: 'flex', height: 6, width: 220, borderRadius: 3, background: '#f7b733' }} />
      </div>
    ),
    OG_SIZE,
  );
}

export const DEFAULT_CARD = {
  title: 'Verified pandits for every sacred occasion',
  subtitle: 'Book home pujas with verified pandits, or join live online pujas from anywhere in the world.',
};
