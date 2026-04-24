'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Suppress React 19 warning for next-themes script tag in development
  React.useEffect(() => {
    const orig = console.error;
    console.error = (...args: unknown[]) => {
      if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag')) {
        return;
      }
      orig.apply(console, args);
    };
    return () => {
      console.error = orig;
    };
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
