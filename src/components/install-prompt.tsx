'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Diya } from '@/components/brand/diya';
import { useT } from '@/i18n';

const DISMISS_KEY = 'pwa_install_dismissed';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function InstallPrompt() {
  const t = useT('customer');
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const standalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !standalone;
    // User agent is only readable in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsIos(isIosDevice);

    if (localStorage.getItem(DISMISS_KEY)) return;

    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  const install = async () => {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    await deferredEvent.userChoice;
    setDeferredEvent(null);
    dismiss();
  };

  // Stay out of the way while someone is signing in or booking.
  if (!visible || /^\/(login|signup|auth|pandits\/[^/]+\/book)/.test(pathname)) return null;
  if (!deferredEvent && !isIos) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 p-4 sm:flex sm:justify-center">
      <Card className="w-full sm:max-w-md">
        <CardContent className="flex items-start gap-3">
          <Diya className="size-9" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">{t('install.title')}</p>
            {isIos ? (
              <p className="text-sm text-muted-foreground">{t('install.ios')}</p>
            ) : (
              <p className="text-sm text-muted-foreground">{t('install.other')}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {!isIos && <Button size="sm" onClick={install}>{t('install.install')}</Button>}
              <Button size="sm" variant="outline" onClick={dismiss}>
                {isIos ? t('install.gotIt') : t('install.notNow')}
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={dismiss} aria-label={t('install.dismiss')}>
            <XIcon className="size-4" aria-hidden="true" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
