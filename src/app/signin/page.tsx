'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/useTranslation';

export default function SignInPage() {
  const router = useRouter();
  const [next, setNext] = useState('/pt/dashboard');
  const [lang, setLang] = useState<'pt' | 'en'>('pt');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tr = useTranslation(lang);
  const t = {
    header: tr('auth.signin.header'),
    title: tr('auth.signin.title'),
    subtitle: tr('auth.signin.subtitle'),
    email: tr('auth.email'),
    password: tr('auth.password'),
    submit: tr('auth.signin.submit'),
    loading: tr('auth.signin.loading'),
    or: tr('auth.or'),
    google: tr('auth.google'),
    noAccount: tr('auth.signin.noAccount'),
    linkCreate: tr('auth.signin.linkCreate'),
    appName: tr('app.name'),
  } as const;

  useEffect(() => {
    const check = async () => {
      try {
        if (typeof (supabase as any).auth?.getSession === 'function') {
          const { data } = await (supabase as any).auth.getSession();
          return data?.session ?? null;
        }
        const { data } = await (supabase as any).auth.getUser();
        return data?.user ? { user: data.user } : null;
      } catch {
        return null;
      }
    };
    check().then(async (session: { user?: { id?: string } } | null) => {
      if (session) {
        try {
          await fetch('/api/ensure-profile', { method: 'POST' });
        } catch {}
        // persist logged-in marker
        try {
          localStorage.setItem('app.isLoggedIn', 'true');
        } catch {}
        let dest = '';
        try {
          const sp = new URLSearchParams(window.location.search);
          dest = sp.get('next') || '';
        } catch {}
        if (!dest) {
          let l: 'pt' | 'en' = 'pt';
          try {
            const stored = localStorage.getItem('app.locale');
            if (stored === 'en' || stored === 'pt') l = stored;
          } catch {}
          const needsOnboarding = (() => {
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
                const rawS = localStorage.getItem('garden.settings.v1');
                if (rawS) {
                  const s = JSON.parse(rawS) as {
                    userLocation?: { distrito?: string; municipio?: string };
                  };
                  distrito ||= (s.userLocation?.distrito || '').trim();
                  municipio ||= (s.userLocation?.municipio || '').trim();
                }
              }
              return !(name && distrito && municipio);
            } catch {
              return true;
            }
          })();
          dest = `/${l}/${needsOnboarding ? 'onboarding' : 'dashboard'}`;
        }
        router.replace(dest || next);
      }
    });

    const { data: sub } = (supabase as any).auth.onAuthStateChange(
      (_event: unknown, session: { user?: { id?: string } } | null) => {
        if (session) {
          try {
            fetch('/api/ensure-profile', { method: 'POST' });
          } catch {}
          try {
            localStorage.setItem('app.isLoggedIn', 'true');
          } catch {}
          let dest = '';
          try {
            const sp = new URLSearchParams(window.location.search);
            dest = sp.get('next') || '';
          } catch {}
          if (!dest) {
            let l: 'pt' | 'en' = 'pt';
            try {
              const stored = localStorage.getItem('app.locale');
              if (stored === 'en' || stored === 'pt') l = stored;
            } catch {}
            const needsOnboarding = (() => {
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
                  const rawS = localStorage.getItem('garden.settings.v1');
                  if (rawS) {
                    const s = JSON.parse(rawS) as {
                      userLocation?: { distrito?: string; municipio?: string };
                    };
                    distrito ||= (s.userLocation?.distrito || '').trim();
                    municipio ||= (s.userLocation?.municipio || '').trim();
                  }
                }
                return !(name && distrito && municipio);
              } catch {
                return true;
              }
            })();
            dest = `/${l}/${needsOnboarding ? 'onboarding' : 'dashboard'}`;
          }
          router.replace(dest || next);
        }
      },
    );
    return () => sub.subscription?.unsubscribe?.();
  }, [next, router]);

  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const raw = sp.get('next');
      // Decode once in case middleware/auth encoded the destination
      const dest = raw ? decodeURIComponent(raw) : '/pt/dashboard';
      setNext(dest);
    } catch {
      setNext('/pt/dashboard');
    }
  }, []);

  // Initialize language from localStorage and keep in sync
  useEffect(() => {
    try {
      const stored = localStorage.getItem('app.locale');
      if (stored === 'en' || stored === 'pt') setLang(stored);
    } catch {}
  }, []);

  const switchLanguage = (l: 'pt' | 'en') => {
    setLang(l);
    try {
      localStorage.setItem('app.locale', l);
    } catch {}
    setNext((prev) => {
      if (prev?.startsWith('/pt/') || prev?.startsWith('/en/'))
        return `/${l}/${prev.split('/').slice(2).join('/')}`;
      return `/${l}/dashboard`;
    });
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await (supabase as any).auth.signInWithPassword({ email, password });
      if (error) throw error;
      try {
        localStorage.setItem('app.isLoggedIn', 'true');
      } catch {}
      const storedLocale = localStorage.getItem('app.locale') || 'pt';
      const needsOnboarding = (() => {
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
            const rawS = localStorage.getItem('garden.settings.v1');
            if (rawS) {
              const s = JSON.parse(rawS) as {
                userLocation?: { distrito?: string; municipio?: string };
              };
              distrito ||= (s.userLocation?.distrito || '').trim();
              municipio ||= (s.userLocation?.municipio || '').trim();
            }
          }
          return !(name && distrito && municipio);
        } catch {
          return true;
        }
      })();
      if (next) {
        router.replace(next);
      } else {
        router.replace(`/${storedLocale}/${needsOnboarding ? 'onboarding' : 'dashboard'}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao iniciar sessão';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const storedLocale =
        typeof window !== 'undefined' ? localStorage.getItem('app.locale') || 'pt' : 'pt';
      let dest = next || `/${storedLocale}/dashboard`;
      try {
        const sp = new URLSearchParams(window.location.search);
        dest = sp.get('next') || dest;
      } catch {}
      const { error } = await (supabase as any).auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/signin?next=${encodeURIComponent(dest)}`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha no login com Google';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6">
      {/* Language switcher */}
      <div className="absolute top-4 right-4 flex items-center gap-1 text-sm">
        <button
          type="button"
          onClick={() => switchLanguage('pt')}
          className={`rounded-md px-2 py-1 ${lang === 'pt' ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
          aria-pressed={lang === 'pt'}
        >
          PT
        </button>
        <span className="text-[var(--color-border)]">|</span>
        <button
          type="button"
          onClick={() => switchLanguage('en')}
          className={`rounded-md px-2 py-1 ${lang === 'en' ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
          aria-pressed={lang === 'en'}
        >
          EN
        </button>
      </div>
      <header className="text-center">
        <p className="eyebrow text-[var(--color-primary-strong)]">{t.header}</p>
        <h1 className="text-display text-4xl sm:text-5xl">{t.appName}</h1>
      </header>

      <div className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <h2 className="mb-2 text-xl font-semibold">{t.title}</h2>
        <p className="mb-6 text-sm text-[var(--color-text-muted)]">{t.subtitle}</p>

        <form
          className="space-y-4"
          onSubmit={handleEmailSignIn}
          aria-label="Iniciar sessão por email"
        >
          <div>
            <Label htmlFor="email">{t.email}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">{t.password}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <Button className="w-full" disabled={loading} aria-busy={loading} aria-live="polite">
            {loading
              ? lang === 'en'
                ? 'Signing in...'
                : 'A entrar...'
              : lang === 'en'
                ? 'Sign in'
                : 'Entrar'}
          </Button>
        </form>

        <div className="my-4 text-center text-sm text-[var(--color-text-muted)]">{t.or}</div>

        <Button
          className="w-full"
          variant="secondary"
          onClick={handleGoogle}
          disabled={loading}
          aria-busy={loading}
        >
          {t.google}
        </Button>

        <p className="mt-6 text-center text-sm">
          {t.noAccount}{' '}
          <a className="text-[var(--color-primary)] underline" href="/signup">
            {t.linkCreate}
          </a>
        </p>
      </div>
    </main>
  );
}
