'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'Light' | 'Dark' | 'System';

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  isDark: boolean;
}

const ThemeCtx = createContext<ThemeContextValue>({
  theme: 'Light',
  setTheme: () => {},
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('Light');
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  const applyTheme = (t: ThemeMode) => {
    let dark = false;
    if (t === 'Dark') {
      dark = true;
    } else if (t === 'Light') {
      dark = false;
    } else {
      dark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    setIsDark(dark);
    if (typeof document !== 'undefined') {
      if (dark) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    }
  };

  useEffect(() => {
    setMounted(true);
    const saved = (typeof window !== 'undefined' ? localStorage.getItem('resolvia_theme') : null) as ThemeMode | null;
    const initial = saved || 'Light';
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  const setTheme = (t: ThemeMode) => {
    setThemeState(t);
    if (typeof window !== 'undefined') {
      localStorage.setItem('resolvia_theme', t);
    }
    applyTheme(t);
  };

  useEffect(() => {
    if (!mounted || theme !== 'System') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('System');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mounted, theme]);

  return (
    <ThemeCtx.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeCtx);
}
