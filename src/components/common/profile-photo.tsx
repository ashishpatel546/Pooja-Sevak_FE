'use client';

import { useState } from 'react';
import type { PhotoUrls } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * Pick the profile-photo URL for a rendered size: the 128px thumbnail up to
 * 64 CSS px (sharp on 2x screens), else the 512px photo.
 */
export function photoSrc(photo: PhotoUrls | null | undefined, px: number): string | null {
  if (!photo) return null;
  if (px <= 64) return photo.photo_thumb_url ?? photo.photo_url ?? null;
  return photo.photo_url ?? photo.photo_thumb_url ?? null;
}

/**
 * A profile photo filling its (round, fixed-size) parent, or `fallback` when
 * there is none or it fails to load. Plain <img>: the same-origin
 * /v1/media URL redirects to a short-lived S3 URL, which next/image's
 * optimizer would cache past its expiry. width/height + a sized parent keep
 * layout stable.
 */
export function ProfilePhoto({
  src,
  px,
  fallback,
  className,
  alt = '',
}: {
  src: string | null | undefined;
  /** Rendered size in CSS pixels (sets the intrinsic width/height). */
  px: number;
  fallback: React.ReactNode;
  className?: string;
  alt?: string;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) return <>{fallback}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- see component doc
    <img
      src={src}
      alt={alt}
      width={px}
      height={px}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setFailed(src)}
      className={cn('size-full rounded-full object-cover', className)}
    />
  );
}
