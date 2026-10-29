'use client';

import { useEffect } from 'react';
import { track, type AnalyticsTool } from '@/lib/analytics';

/** Sends tool_view once for a server-rendered tool page. */
export function TrackToolView({ tool }: { tool: AnalyticsTool }) {
  useEffect(() => {
    track('tool_view', { tool });
  }, [tool]);
  return null;
}
