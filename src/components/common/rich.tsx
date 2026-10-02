import { Fragment, type ReactNode } from 'react';

/**
 * Renders a translated template, swapping `{name}` placeholders for React
 * nodes (e.g. a bold price). Call `t(key)` without the node vars so the
 * placeholders survive, then pass them here.
 */
export function rich(template: string, nodes: Record<string, ReactNode>): ReactNode {
  return template.split(/\{(\w+)\}/g).map((part, i) =>
    i % 2 === 1 ? <Fragment key={i}>{part in nodes ? nodes[part] : `{${part}}`}</Fragment> : part,
  );
}
