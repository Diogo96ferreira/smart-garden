'use client';

import { useState, useEffect } from 'react';
import { Inter, Nunito_Sans } from 'next/font/google';
import './globals.css';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import BottomBar from '@/components/ui/BottomBar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const nunito = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
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
        className={`${inter.variable} ${nunito.variable} relative min-h-screen bg-[#DCFCE7] text-emerald-950`}
      >
        <div className="pointer-events-none fixed inset-0 -z-10 opacity-90">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.8)_0%,_rgba(220,252,231,0.85)_40%,_rgba(214,238,210,0.95)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(34,197,94,0.08)_0%,_rgba(161,98,7,0.08)_35%,_rgba(34,211,238,0.05)_100%)]" />
        </div>
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
