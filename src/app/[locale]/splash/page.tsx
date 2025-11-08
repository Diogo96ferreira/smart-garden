'use client';

import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function SplashPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'pt';

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        // 1) Determinar localização (se existir) e gerar tarefas
        let location: { distrito?: string; municipio?: string } | undefined;
        try {
          const rawUL = localStorage.getItem('userLocation');
          if (rawUL) location = JSON.parse(rawUL);
        } catch {}
        if (!location) {
          try {
            const rawSettings = localStorage.getItem('garden.settings.v1');
            if (rawSettings) {
              const parsed = JSON.parse(rawSettings);
              if (parsed && typeof parsed === 'object' && parsed.userLocation)
                location = parsed.userLocation;
            }
          } catch {}
        }

        await fetch('/api/generate-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale, location }),
        }).catch(() => undefined);

        // 2) Esperar até haver tarefas (ou timeout)
        const start = Date.now();
        const timeoutMs = 7000;
        const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
        while (!cancelled && Date.now() - start < timeoutMs) {
          const { data: auth } = await supabase.auth.getUser();
          const userId = auth.user?.id;
          if (!userId) break;
          const res = await supabase
            .from('tasks')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .limit(1);
          const count = typeof res.count === 'number' ? res.count : 0;
          if (count > 0) break;
          await delay(500);
        }
      } catch {}
      if (!cancelled) router.push(`/${locale}/dashboard`);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [router, locale]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--color-background)] px-6">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="space-y-4 text-center"
      >
        <p className="eyebrow text-[var(--color-primary-strong)]">A preparar a sua horta</p>
        <h1 className="text-display text-4xl sm:text-5xl">Smart Garden</h1>
        <p className="text-sm text-[var(--color-text-muted)] sm:text-base">
          Estamos a carregar as previsões, sugestões e plantas favoritas. Um instante apenas.
        </p>
      </motion.div>

      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
        className="h-1 w-40 rounded-full bg-[var(--color-primary)]"
      />
    </main>
  );
}
