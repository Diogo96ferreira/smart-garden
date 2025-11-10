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

    // Primeiro garantir que o utilizador está autenticado (com fallback)\n    const fetchSession = async () => {\n      try {\n        if (typeof (supabase as any).auth?.getSession === 'function') {\n          return await (supabase as any).auth.getSession();\n        }\n        const { data } = await (supabase as any).auth.getUser();\n        return { data: { session: data?.user ? { user: data.user } : null } } as {\n          data: { session: { user?: { id?: string } } | null };\n        };\n      } catch {\n        return { data: { session: null } } as {\n          data: { session: { user?: { id?: string } } | null };\n        };\n      }\n    };\n\n    fetchSession().then(async ({ data }: { data: { session: { user?: { id?: string } } | null } }) => {\n        const isAuthed = Boolean(data.session);\n        if (!isAuthed) {\n          router.replace(/signin?next=//onboarding);\n          return;\n        }\n\n        // Verdade server-side: se não houver plantas, força onboarding\n        let forceOnboarding = false;\n        try {\n          const userId = data.session?.user?.id;\n          if (userId) {\n            const res = await supabase\n              .from('plants')\n              .select('id', { count: 'exact', head: true })\n              .eq('user_id', userId)\n              .limit(1);\n            const count = typeof res.count === 'number' ? res.count : 0;\n            forceOnboarding = count === 0;\n          }\n        } catch {\n          // se a contagem falhar, usa flag local\n        }\n\n        const target = forceOnboarding\n          ? '/onboarding'\n          : hasCompletedOnboarding\n            ? '/dashboard'\n            : '/onboarding';\n        router.replace(/);\n      });
  }, [router]);

  return null;
}
