'use client';

import { useEffect, useState } from 'react';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { usePathname } from 'next/navigation';
import BottomBar from '@/components/ui/BottomBar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const routesWithoutChrome = ['/onboarding', '/splash'];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const hideBottomBar =
    pathname === '/' || routesWithoutChrome.some((route) => pathname?.startsWith(route));

  return (
    <html lang="pt">
      <body className={`${inter.variable} ${plusJakarta.variable}`}>
        <div className="app-shell">{children}</div>
        {isClient && !hideBottomBar && <BottomBar />}
      </body>
    </html>
  );
}
