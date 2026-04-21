'use client';

import { ReactNode, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import BottomBar from '@/components/ui/BottomBar';
import { LocaleContextProvider } from '@/lib/useLocale';
import { SETTINGS_KEY, DEFAULT_SETTINGS, type Settings } from '@/lib/settings';

const ROUTES_WITHOUT_BAR = ['/onboarding', '/splash'];

type LocaleLayoutClientProps = {
  children: ReactNode;
  locale: 'pt' | 'en';
};

export default function LocaleLayoutClient({ children, locale }: LocaleLayoutClientProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  // hide navigation bar on onboarding and splash screens
  const hideBottomBar = useMemo(
    () => ROUTES_WITHOUT_BAR.some((route) => pathname.startsWith(`/${locale}${route}`)),
    [locale, pathname],
  );

  // Apply persisted theme early on client navigation
  useEffect(() => {
    const apply = (theme: Settings['theme']) => {
      const root = document.documentElement;
      const sysDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      const dark = theme === 'dark' || (theme === 'system' && sysDark);
      root.classList.toggle('dark', dark);
      root.setAttribute('data-theme', dark ? 'dark' : 'light');
      root.style.setProperty('color-scheme', dark ? 'dark' : 'light');
    };

    let theme: Settings['theme'] = DEFAULT_SETTINGS.theme;
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) theme = (JSON.parse(raw) as Partial<Settings>).theme ?? theme;
    } catch {
      /* ignore */
    }
    apply(theme);

    if (theme === 'system' && window.matchMedia) {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => apply('system');
      try {
        mql.addEventListener('change', handler);
      } catch {
        mql.addListener(handler);
      }
      return () => {
        try {
          mql.removeEventListener('change', handler);
        } catch {
          mql.removeListener(handler);
        }
      };
    }
  }, []);

  return (
    <LocaleContextProvider value={locale}>
      <div className="app-shell">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={reduceMotion ? false : { opacity: 0, y: 14, filter: 'blur(6px)' }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
        {!hideBottomBar && <BottomBar locale={locale} currentPath={pathname} />}
      </div>
    </LocaleContextProvider>
  );
}
