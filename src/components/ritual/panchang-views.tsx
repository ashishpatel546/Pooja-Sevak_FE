'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parsePanchangView, type PanchangView } from './observance';
import { usePanchangText } from './use-panchang-text';

/**
 * "All sacred days" / "Festivals" on /panchang. The choice is mirrored into
 * `?view=` (without a navigation) so it survives a reload and can be linked to.
 */
export function PanchangViews({
  initial,
  all,
  festivals,
}: {
  initial: PanchangView;
  all: React.ReactNode;
  festivals: React.ReactNode;
}) {
  const { t } = usePanchangText();
  const [view, setView] = useState<PanchangView>(initial);

  // A link such as the home page's "Explore all festivals" points at #sacred-days;
  // after a client-side navigation the browser does not scroll there by itself.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) document.getElementById(hash)?.scrollIntoView();
  }, []);

  const choose = (next: PanchangView) => {
    setView(next);
    const url = new URL(window.location.href);
    if (next === 'all') url.searchParams.delete('view');
    else url.searchParams.set('view', next);
    window.history.replaceState(window.history.state, '', url);
  };

  return (
    <Tabs value={view} onValueChange={(v) => choose(parsePanchangView(v))} className="gap-8">
      <TabsList className="h-12! w-full sm:w-fit" aria-label={t('view.label')}>
        <TabsTrigger value="all" className="min-h-10 px-4 text-base">
          <CalendarDays aria-hidden="true" />
          {t('view.all')}
        </TabsTrigger>
        <TabsTrigger value="festivals" className="min-h-10 px-4 text-base">
          <Sparkles aria-hidden="true" />
          {t('view.festivals')}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="all" className="text-base">
        {all}
      </TabsContent>
      <TabsContent value="festivals" className="text-base">
        {festivals}
      </TabsContent>
    </Tabs>
  );
}
