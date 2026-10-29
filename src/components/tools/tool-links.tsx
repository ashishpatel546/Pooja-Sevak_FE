import Link from 'next/link';
import { CalendarHeart, HeartHandshake, MoonStar, ScrollText, Sparkles, type LucideIcon } from 'lucide-react';
import { getT } from '@/i18n/server';
import { TOOLS, type ToolKey } from '@/lib/tools';
import { cn } from '@/lib/utils';

export const TOOL_ICON: Record<ToolKey, LucideIcon> = {
  kundali: ScrollText,
  milan: HeartHandshake,
  muhurat: CalendarHeart,
  panchang: MoonStar,
  rashifal: Sparkles,
};

/**
 * Cards linking the free tools. `current` is left out (the strip on a tool page);
 * on the home page every tool is shown.
 */
export async function ToolCards({ current, className }: { current?: ToolKey; className?: string }) {
  const t = await getT('tools');
  return (
    <ul className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-4', !current && 'lg:grid-cols-5', className)}>
      {TOOLS.filter((tool) => tool.key !== current).map(({ key, href }) => {
        const Icon = TOOL_ICON[key];
        return (
          <li key={key}>
            <Link
              href={href}
              className="group flex h-full gap-3 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <Icon className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2 font-heading text-lg text-heading group-hover:text-primary">
                  {t(`tool.${key}.name`)}
                  <span className="rounded-full bg-tulsi/15 px-2 py-0.5 font-sans text-xs font-medium text-tulsi">
                    {t('tool.free')}
                  </span>
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">{t(`tool.${key}.text`)}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** "More free tools" strip at the foot of every tool page. */
export async function ToolLinks({ current, className }: { current: ToolKey; className?: string }) {
  const t = await getT('tools');
  return (
    <nav aria-label={t('links.label')} className={cn('border-t pt-10', className)}>
      <h2 className="font-heading text-2xl text-heading">{t('links.title')}</h2>
      <ToolCards current={current} className="mt-5" />
    </nav>
  );
}
