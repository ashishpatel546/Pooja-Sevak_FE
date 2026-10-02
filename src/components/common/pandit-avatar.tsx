'use client';

import { BadgeCheck } from 'lucide-react';
import { initials } from '@/lib/format';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';
import type { PhotoUrls } from '@/lib/types';
import { ProfilePhoto, photoSrc } from './profile-photo';

const BOX = { sm: 'size-10 text-xs', md: 'size-14 text-lg', lg: 'size-20 text-2xl', xl: 'size-28 text-4xl' } as const;
const PX = { sm: 40, md: 56, lg: 80, xl: 112 } as const;

/**
 * Profile photo (when the person has one) or initials on a sandhya-to-saffron
 * disc, with optional verified tick. `photo` is any object carrying
 * photo_url / photo_thumb_url (a user, a pandit list item, ...).
 */
export function PanditAvatar({
  name,
  photo,
  verified = false,
  size = 'md',
  className,
}: {
  name: string | null | undefined;
  photo?: PhotoUrls | null;
  verified?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const t = useT('customer');
  const box = BOX[size];
  const src = photoSrc(photo, PX[size]);
  return (
    <span className={cn('relative inline-grid shrink-0', className)}>
      <span
        className={cn(
          'grid place-items-center rounded-full font-heading text-[#fbe3b6] ring-2 ring-diya/50 ring-offset-2 ring-offset-background',
          'bg-[radial-gradient(circle_at_30%_25%,#c2410c,#2a1f4a_70%)]',
          box,
        )}
        aria-hidden="true"
      >
        <ProfilePhoto src={src} px={PX[size]} fallback={initials(name)} />
      </span>
      {verified && (
        <BadgeCheck
          className={cn(
            'absolute rounded-full bg-background fill-tulsi text-white',
            size === 'sm' ? '-right-1.5 -bottom-1.5 size-4' : '-right-1 -bottom-1 size-6',
          )}
          aria-label={t('pandit.verified')}
        />
      )}
    </span>
  );
}

export function VerifiedPill({ className }: { className?: string }) {
  const t = useT('customer');
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded-full bg-tulsi/10 px-2.5 text-xs font-medium text-tulsi ring-1 ring-tulsi/30 ring-inset',
        className,
      )}
    >
      <BadgeCheck className="size-3.5" aria-hidden="true" />
      {t('pandit.aadhaarVerified')}
    </span>
  );
}
