import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/** The evening-sky hero shared by the tool pages: invocation, keyword H1, lead and optional trust points. */
export function ToolHero({
  invocation,
  title,
  lead,
  trust,
  children,
}: {
  invocation: string;
  title: string;
  lead: string;
  trust?: { icon: LucideIcon; title: string; text: string }[];
  children?: ReactNode;
}) {
  return (
    <section className="sandhya stars relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 pt-12 pb-10 sm:px-6 sm:pt-16">
        <p lang="sa" className="font-heading text-lg text-diya">
          {invocation}
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl leading-tight text-balance sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-lg">{lead}</p>
        {trust && (
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {trust.map(({ icon: Icon, title: heading, text }) => (
              <li key={heading} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Icon className="size-6 text-diya" aria-hidden="true" />
                <p className="mt-2 font-medium text-[#fbe3b6]">{heading}</p>
                <p className="mt-1 text-sm">{text}</p>
              </li>
            ))}
          </ul>
        )}
        {children}
      </div>
    </section>
  );
}
