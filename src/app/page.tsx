'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_SETTINGS, SETTINGS_KEY } from '@/lib/settings';
import { supabase } from '@/lib/supabaseClient';

export default function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    const resolveLocale = () => {
      try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { locale?: string };
          if (parsed.locale?.toLowerCase().startsWith('en')) {
            return 'en';
          }
        }
      } catch {
        /* ignore */
      }
      const browser = typeof navigator !== 'undefined' ? navigator.language?.toLowerCase() : '';
      if (browser?.startsWith('en')) {
        return 'en';
      }
      return DEFAULT_SETTINGS.locale.toLowerCase().startsWith('en') ? 'en' : 'pt';
    };

    const hasCompletedOnboarding = localStorage.getItem('onboardingComplete') === 'true';
    const locale = resolveLocale();

    // Primeiro garantir que o utilizador está autenticado
    supabase.auth.getSession().then(({ data }) => {
      const isAuthed = Boolean(data.session);
      if (!isAuthed) {
        router.replace(`/signin?next=/${locale}/onboarding`);
        return;
      }
      const target = hasCompletedOnboarding ? '/dashboard' : '/onboarding';
      router.replace(`/${locale}${target}`);
    });
  }, [router]);

  return null;
}
