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

    const locale = resolveLocale();
    try {
      localStorage.setItem('app.locale', locale);
    } catch {}

    const fetchOnboardingFlag = async (userId: string) => {
      try {
        const { data } = await (supabase as any)
          .from('users')
          .select('*')
          .eq('id', userId)
          .limit(1)
          .single();
        const flag =
          (data as Record<string, unknown> | null)?.['has-onboarding'] ??
          (data as Record<string, unknown> | null)?.['has_onboarding'];
        if (flag === true) return true;
        if (flag === false) return false;
      } catch {
        /* ignore */
      }
      return null;
    };

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
      async ({
        data,
      }: {
        data: {
          session: { user?: { id?: string; user_metadata?: Record<string, unknown> } } | null;
        };
      }) => {
        const sessionUser = data.session?.user as {
          id?: string;
          user_metadata?: Record<string, unknown>;
        } | null;
        const isAuthed = Boolean(sessionUser);
        if (!isAuthed) {
          router.replace(`/signin?next=/${locale}/onboarding`);
          return;
        }

        const remoteFlag = sessionUser?.id ? await fetchOnboardingFlag(sessionUser.id) : null;
        const hasServerCompleted = remoteFlag === true;

        if (hasServerCompleted) {
          try {
            localStorage.setItem('onboardingComplete', 'true');
          } catch {
            /* ignore */
          }
        }

        const needsOnboarding = !hasServerCompleted;
        router.replace(`/${locale}${needsOnboarding ? '/onboarding' : '/dashboard'}`);
      },
    );
  }, [router]);

  return null;
}
