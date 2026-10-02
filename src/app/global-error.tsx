'use client';

import en from '@/i18n/messages/en/errors';
import hi from '@/i18n/messages/hi/errors';

/**
 * Last-resort boundary that replaces the root layout, so it can't rely on
 * providers, fonts or globals.css. Shows Hindi and English together.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="hi">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '24px 16px',
          background: '#140f24',
          color: '#f4e6d4',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", "Noto Sans Devanagari", sans-serif',
          lineHeight: 1.7,
        }}
      >
        <title>{`${hi['global.title']} · ${en['global.title']}`}</title>
        <main style={{ maxWidth: 480, textAlign: 'center' }}>
          <svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true" style={{ margin: '0 auto' }}>
            <path d="M32 10c5 8 8 13 8 18a8 8 0 0 1-16 0c0-5 3-10 8-18z" fill="#f0a84a" />
            <path d="M8 38h48c-2 10-12 16-24 16S10 48 8 38z" fill="#c2410c" />
          </svg>
          <h1 lang="hi" style={{ fontSize: 28, fontWeight: 400, margin: '20px 0 4px', color: '#fbe3b6' }}>
            {hi['global.title']}
          </h1>
          <p lang="hi" style={{ margin: 0 }}>{hi['global.body']}</p>
          <h2 lang="en" style={{ fontSize: 20, fontWeight: 400, margin: '24px 0 4px', color: '#fbe3b6' }}>
            {en['global.title']}
          </h2>
          <p lang="en" style={{ margin: 0, opacity: 0.85 }}>{en['global.body']}</p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            style={{
              marginTop: 28,
              minHeight: 48,
              padding: '0 24px',
              borderRadius: 12,
              border: 0,
              background: '#f0a84a',
              color: '#140f24',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {hi['global.retry']} · {en['global.retry']}
          </button>
          {error.digest && (
            <p style={{ marginTop: 24, fontSize: 12, opacity: 0.6, fontFamily: 'ui-monospace, monospace' }}>
              {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
