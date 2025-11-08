'use client';

import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function SplashPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'pt';

  // Quick transition only; all loading happens in Dashboard
  useEffect(() => {
    const to = setTimeout(() => {
      router.replace(`/${locale}/dashboard`);
    }, 250);
    return () => clearTimeout(to);
  }, [router, locale]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--color-background)] px-6">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="space-y-4 text-center"
      >
        <p className="eyebrow text-[var(--color-primary-strong)]">Smart Garden</p>
        <h1 className="text-display text-4xl sm:text-5xl">Smart Garden</h1>
        <p className="text-sm text-[var(--color-text-muted)] sm:text-base">A iniciar…</p>
      </motion.div>

      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className="h-1 w-40 rounded-full bg-[var(--color-primary)]"
      />
    </main>
  );
}
