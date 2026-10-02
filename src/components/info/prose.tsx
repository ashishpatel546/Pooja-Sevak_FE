import { Fragment, type ReactNode } from 'react';
import Link from 'next/link';

/**
 * Renders long-form translated copy (about, FAQ, legal pages) from a tiny,
 * predictable markup so the dictionaries stay readable:
 *
 *   - blocks are separated by a blank line;
 *   - a block whose lines all start with "- " is a bulleted list;
 *   - inline: **bold**, `code`, [label](/path or mailto:…), and {name} placeholders
 *     filled from `nodes` (unknown placeholders are left as-is).
 */
export function Prose({ text, nodes = {} }: { text: string; nodes?: Record<string, ReactNode> }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length && lines.every((l) => l.startsWith('- '))) {
          return (
            <ul key={i} className="list-disc space-y-2 ps-5 marker:text-primary/70">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.slice(2), nodes)}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{inline(lines.join(' '), nodes)}</p>;
      })}
    </>
  );
}

const TOKEN = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\)|\{\w+\})/g;

export const linkClass =
  'font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none';

/** Inline markup only (no blocks): for one-line strings such as a FAQ answer's lead. */
export function inline(text: string, nodes: Record<string, ReactNode> = {}): ReactNode {
  return text.split(TOKEN).map((part, i) => {
    if (i % 2 === 0) return part;
    if (part.startsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`')) {
      return (
        <code key={i} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('[')) {
      const m = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
      if (!m) return part;
      const [, label, href] = m;
      return href.startsWith('/') ? (
        <Link key={i} href={href} className={linkClass}>
          {label}
        </Link>
      ) : (
        <a key={i} href={href} className={linkClass}>
          {label}
        </a>
      );
    }
    const name = part.slice(1, -1);
    return <Fragment key={i}>{name in nodes ? nodes[name] : part}</Fragment>;
  });
}

/** The same markup flattened to plain text (for meta tags and JSON-LD). */
export function plainText(text: string, vars: Record<string, string> = {}): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1')
    .replace(/\{(\w+)\}/g, (m, name: string) => vars[name] ?? m)
    .replace(/^- /gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}
