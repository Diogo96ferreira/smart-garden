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
          if (parsed.locale?.toLowerCase().startsWith('en')) return 'en';
        }
      } catch {}
      const browser = typeof navigator !== 'undefined' ? navigator.language?.toLowerCase() : '';
      if (browser?.startsWith('en')) return 'en';
      return DEFAULT_SETTINGS.locale.toLowerCase().startsWith('en') ? 'en' : 'pt';
    };

    const hasCompletedOnboarding = localStorage.getItem('onboardingComplete') === 'true';
    const locale = resolveLocale();

    const fetchSession = async () => {
      try {
        if (typeof (supabase as any).auth?.getSession === 'function') {
          return await (supabase as any).auth.getSession();
        }
        const { data } = await (supabase as any).auth.getUser();
        return { data: { session: data?.user ? { user: data.user } : null } } as {
          data: { session: { user?: { id?: string } } | null };
        };
      } catch {
        return { data: { session: null } } as {
          data: { session: { user?: { id?: string } } | null };
        };
      }
    };

    fetchSession().then(
      async ({ data }: { data: { session: { user?: { id?: string } } | null } }) => {
        const isAuthed = Boolean(data.session);
        if (!isAuthed) {
          router.replace(`/signin?next=/${locale}/onboarding`);
          return;
        }

        let forceOnboarding = false;
        try {
          const userId = (data.session as any)?.user?.id;
          if (userId) {
            const res = await supabase
              .from('plants')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', userId)
              .limit(1);
            const count = typeof res.count === 'number' ? res.count : 0;
            forceOnboarding = count === 0;
          }
        } catch {}

        const target = forceOnboarding
          ? '/onboarding'
          : hasCompletedOnboarding
            ? '/dashboard'
            : '/onboarding';
        router.replace(`/${locale}${target}`);
      },
    );
  }, [router]);

  return null;
}
