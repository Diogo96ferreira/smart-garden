'use client';

import { useState, useEffect } from 'react';
import { Roboto, Fredoka } from 'next/font/google';
import './globals.css';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import BottomBar from '@/components/ui/BottomBar';

const roboto = Roboto({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

const fredoka = Fredoka({
  subsets: ['latin'],
  variable: '--font-fredoka',
  weight: ['400', '500', '700'],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hasMounted, setHasMounted] = useState(false);
  const [dashboardAnimated, setDashboardAnimated] = useState(false);

  useEffect(() => setHasMounted(true), []);

  // 🪴 Verifica se o dashboard já animou (localStorage)
  useEffect(() => {
    const animated = localStorage.getItem('dashboardAnimated');
    if (animated === 'true') setDashboardAnimated(true);
  }, []);

  const skipAnimation =
    pathname === '/' ||
    pathname.startsWith('/welcome') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/splash');

  const isDashboard = pathname.startsWith('/dashboard');
  const shouldAnimateDashboard = isDashboard && !dashboardAnimated;

  // Quando anima o dashboard pela primeira vez, grava isso
  useEffect(() => {
    if (shouldAnimateDashboard) {
      const timer = setTimeout(() => {
        localStorage.setItem('dashboardAnimated', 'true');
        setDashboardAnimated(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [shouldAnimateDashboard]);

  // ⚙️ Escolher se vamos usar AnimatePresence
  const enableGlobalAnimation = !isDashboard || !dashboardAnimated;

  return (
    <html lang="en">
      <body
        className={`${roboto.variable} ${fredoka.variable} bg-gradient-to-b from-[#b8f3b1] via-[#def8d6] to-[#f9fff9] text-gray-900`}
      >
        {skipAnimation ? (
          <div className="min-h-screen">{children}</div>
        ) : enableGlobalAnimation ? (
          // 🌿 Usa AnimatePresence só quando queremos animar
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={
                hasMounted && (shouldAnimateDashboard || !isDashboard)
                  ? { opacity: 0, y: 20 }
                  : false
              }
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
              className="min-h-screen pb-24"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        ) : (
          // 🚫 Dashboard já animou → sem AnimatePresence
          <div className="min-h-screen pb-24">{children}</div>
        )}

        {!skipAnimation && <BottomBar />}
      </body>
    </html>
  );
}
