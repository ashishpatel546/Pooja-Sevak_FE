'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { MoonStar, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/i18n';

export function ThemeToggle() {
  const t = useT('customer');
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Theme is only known on the client; render a stable icon until mounted.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? t('theme.toDay') : t('theme.toEvening')}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <Sun className="size-5" aria-hidden="true" /> : <MoonStar className="size-5" aria-hidden="true" />}
    </Button>
  );
}
