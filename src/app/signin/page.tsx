'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignInPage() {
  const router = useRouter();
  const [next, setNext] = useState('/pt/dashboard');
  const [lang, setLang] = useState<'pt' | 'en'>('pt');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dict = {
    pt: {
      header: 'Bem-vindo',
      title: 'Entrar',
      subtitle: '{t.subtitle}',
      email: 'Email',
      password: 'Password',
      submit: 'Entrar',
      loading: 'A entrar... ',
      or: 'ou',
      google: 'Entrar com Google',
      noAccount: 'N�o tens conta?',
      linkCreate: '{t.linkCreate}',
      appName: 'Smart Garden',
    },
    en: {
      header: 'Welcome',
      title: 'Sign in',
      subtitle: 'Access your smart garden',
      email: 'Email',
      password: 'Password',
      submit: 'Sign in',
      loading: 'Signing in... ',
      or: 'or',
      google: 'Continue with Google',
      noAccount: "Don't have an account?",
      linkCreate: 'Create account',
      appName: 'Smart Garden',
    },
  } as const;
  const t = dict[lang];

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
          // route based on onboarding status when no explicit next
          let l: 'pt' | 'en' = 'pt';
          try {
            const stored = localStorage.getItem('app.locale');
            if (stored === 'en' || stored === 'pt') l = stored;
          } catch {}
          const done = (() => {
            try {
              return localStorage.getItem('onboardingComplete') === 'true';
            } catch {
              return false;
            }
          })();
          dest = `/${l}/${done ? 'dashboard' : 'onboarding'}`;
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
            const done = (() => {
              try {
                return localStorage.getItem('onboardingComplete') === 'true';
              } catch {
                return false;
              }
            })();
            dest = `/${l}/${done ? 'dashboard' : 'onboarding'}`;
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
      if (next) {
        router.replace(next);
      } else {
        const done = localStorage.getItem('onboardingComplete') === 'true';
        router.replace(`/${storedLocale}/${done ? 'dashboard' : 'onboarding'}`);
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
