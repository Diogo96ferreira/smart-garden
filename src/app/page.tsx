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
    try {
      localStorage.setItem('app.locale', locale);
    } catch {}

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

    const isProfileComplete = () => {
      try {
        const name = (localStorage.getItem('userName') || '').trim();
        let distrito = '';
        let municipio = '';
        const rawUL = localStorage.getItem('userLocation');
        if (rawUL) {
          const loc = JSON.parse(rawUL) as { distrito?: string; municipio?: string };
          distrito = (loc.distrito || '').trim();
          municipio = (loc.municipio || '').trim();
        }
        if (!distrito || !municipio) {
          const rawS = localStorage.getItem(SETTINGS_KEY);
          if (rawS) {
            const s = JSON.parse(rawS) as {
              userLocation?: { distrito?: string; municipio?: string };
            };
            distrito ||= (s.userLocation?.distrito || '').trim();
            municipio ||= (s.userLocation?.municipio || '').trim();
          }
        }
        return Boolean(name && distrito && municipio);
      } catch {
        return false;
      }
    };

    fetchSession().then(
      async ({ data }: { data: { session: { user?: { id?: string } } | null } }) => {
        const isAuthed = Boolean(data.session);
        if (!isAuthed) {
          router.replace(`/signin?next=/${locale}/onboarding`);
          return;
        }

        const needsOnboarding = !isProfileComplete();
        const target = needsOnboarding
          ? '/onboarding'
          : hasCompletedOnboarding
            ? '/dashboard'
            : '/dashboard';
        router.replace(`/${locale}${target}`);
      },
    );
  }, [router]);

  return null;
}
