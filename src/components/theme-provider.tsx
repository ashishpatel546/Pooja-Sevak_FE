'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

/**
 * next-themes renders its no-flash <script> from a client component. The server
 * HTML runs it before paint; on the client React only warns that the script
 * can't execute ("Encountered a script tag…"). Marking it inert on the client
 * keeps the server behaviour and silences that warning.
 */
const scriptProps =
  typeof window === 'undefined'
    ? undefined
    : ({ type: 'application/json', suppressHydrationWarning: true } as ComponentProps<
        typeof NextThemesProvider
      >['scriptProps']);

export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider scriptProps={scriptProps} {...props} />;
}
