'use client';

import { useSyncExternalStore } from 'react';
import { Link2, MessageCircle, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const noop = () => () => {};

/** True in browsers with the Web Share API (most phones); false during SSR. */
export function useCanShare(): boolean {
  return useSyncExternalStore(
    noop,
    () => typeof navigator !== 'undefined' && typeof navigator.share === 'function',
    () => false,
  );
}

/** Absolute URL for a site path on the current origin (links are public pages only). */
export function shareUrl(path: string): string {
  return typeof window === 'undefined' ? path : new URL(path, window.location.origin).toString();
}

export function whatsappHref(text: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
}

/**
 * WhatsApp, copy link and (on phones) the native share sheet. `text` and `path`
 * must never carry personal data: only public page paths and public facts.
 */
export function ShareButtons({
  text,
  path,
  source,
  className,
  size = 'sm',
}: {
  text: string;
  /** Public site path to share, e.g. '/muhurat?kind=vivah'. */
  path: string;
  /** Analytics: what is being shared ('muhurat', 'panchang', 'puja', 'milan'). */
  source: string;
  className?: string;
  size?: 'sm' | 'default';
}) {
  const t = useT('tools');
  const canShare = useCanShare();
  // Empty during SSR/hydration (so the markup matches), the real origin after.
  const origin = useSyncExternalStore(noop, () => window.location.origin, () => '');

  const copy = async () => {
    track('share_clicked', { channel: 'copy', source });
    try {
      await navigator.clipboard.writeText(shareUrl(path));
      toast.success(t('share.copied'));
    } catch {
      toast.error(shareUrl(path));
    }
  };
  const native = async () => {
    track('share_clicked', { channel: 'native', source });
    try {
      await navigator.share({ text, url: shareUrl(path) });
    } catch {
      /* cancelled */
    }
  };

  return (
    <div role="group" aria-label={t('share.label')} className={cn('flex flex-wrap items-center gap-2', className)}>
      <Button
        size={size}
        variant="outline"
        nativeButton={false}
        render={
          <a
            href={whatsappHref(text, `${origin}${path}`)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('share_clicked', { channel: 'whatsapp', source })}
          />
        }
      >
        <MessageCircle aria-hidden="true" />
        {t('share.whatsapp')}
      </Button>
      <Button size={size} variant="outline" onClick={copy}>
        <Link2 aria-hidden="true" />
        {t('share.copy')}
      </Button>
      {canShare && (
        <Button size={size} variant="outline" onClick={native}>
          <Share2 aria-hidden="true" />
          {t('share.native')}
        </Button>
      )}
    </div>
  );
}
