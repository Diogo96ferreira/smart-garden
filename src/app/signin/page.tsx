'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SupabaseClient } from '@supabase/supabase-js';
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
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const tr = useTranslation(lang);
  const auth = useMemo(() => (supabase as SupabaseClient).auth, []);
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
    forgotPassword: tr('auth.signin.forgotPassword'),
    resetTitle: tr('auth.signin.resetTitle'),
    resetSubtitle: tr('auth.signin.resetSubtitle'),
    resetSubmit: tr('auth.signin.resetSubmit'),
    resetLoading: tr('auth.signin.resetLoading'),
    resetSent: tr('auth.signin.resetSent'),
    resetEmailRequired: tr('auth.signin.resetEmailRequired'),
    backToSignIn: tr('auth.signin.backToSignIn'),
  } as const;

  const fetchRemoteOnboardingFlag = useCallback(async (userId?: string) => {
    if (!userId) return null;
    try {
      const { data } = await supabase.from('users').select('*').eq('id', userId).limit(1).single();
      const flag =
        (data as Record<string, unknown> | null)?.['has-onboarding'] ??
        (data as Record<string, unknown> | null)?.['has_onboarding'];
      if (flag === true) return true;
      if (flag === false) return false;
    } catch {
      /* ignore */
    }
    return null;
  }, []);

  const determineNeedsOnboarding = useCallback(
    async (userId?: string) => {
      const remoteFlag = await fetchRemoteOnboardingFlag(userId);
      if (remoteFlag === true) {
        try {
          localStorage.setItem('onboardingComplete', 'true');
        } catch {
          /* ignore */
        }
        return false;
      }
      // If the column is false or NULL, force onboarding regardless of local state
      return true;
    },
    [fetchRemoteOnboardingFlag],
  );

  useEffect(() => {
    const check = async () => {
      try {
        if (typeof auth?.getSession === 'function') {
          const { data } = await auth.getSession();
          return data?.session ?? null;
        }
        const { data } = await auth.getUser();
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
          const needsOnboarding = await determineNeedsOnboarding(session.user?.id);
          dest = `/${l}/${needsOnboarding ? 'onboarding' : 'dashboard'}`;
        }
        router.replace(dest || next);
      }
    });

    const { data: sub } = auth.onAuthStateChange(
      async (_event: unknown, session: { user?: { id?: string } } | null) => {
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
            const needsOnboarding = await determineNeedsOnboarding(session.user?.id);
            dest = `/${l}/${needsOnboarding ? 'onboarding' : 'dashboard'}`;
          }
          router.replace(dest || next);
        }
      },
    );
    return () => sub.subscription?.unsubscribe?.();
  }, [auth, next, router, determineNeedsOnboarding]);

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
      const { error } = await auth.signInWithPassword({ email, password });
      if (error) throw error;
      try {
        localStorage.setItem('app.isLoggedIn', 'true');
      } catch {}
      const storedLocale = localStorage.getItem('app.locale') || 'pt';
      let needsOnboarding = true;
      try {
        const { data: authUser } = await auth.getUser();
        needsOnboarding = await determineNeedsOnboarding(authUser.user?.id);
      } catch {
        /* ignore */
      }
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

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = (resetEmail || email).trim();
    setResetError(null);
    setResetMessage(null);
    if (!targetEmail) {
      setResetError(t.resetEmailRequired);
      return;
    }
    setResetLoading(true);
    try {
      const redirectBase =
        typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined;
      const redirectTo =
        redirectBase && next ? `${redirectBase}?next=${encodeURIComponent(next)}` : redirectBase;
      const { error } = await auth.resetPasswordForEmail(targetEmail, {
        redirectTo,
      });
      if (error) throw error;
      setResetMessage(t.resetSent);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao enviar email de reset';
      setResetError(message);
    } finally {
      setResetLoading(false);
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
      const { error } = await auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(dest)}`,
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

        <div className="mt-3 text-center text-sm">
          <button
            type="button"
            onClick={() => {
              setShowReset((prev) => {
                const nextState = !prev;
                if (nextState && !resetEmail) setResetEmail(email);
                return nextState;
              });
              setResetError(null);
              setResetMessage(null);
            }}
            className="text-[var(--color-primary)] underline-offset-2 hover:underline"
          >
            {showReset ? t.backToSignIn : t.forgotPassword}
          </button>
        </div>

        {showReset && (
          <form
            className="mt-4 space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
            onSubmit={handlePasswordReset}
            aria-label={t.resetTitle}
          >
            <div>
              <p className="text-sm font-semibold">{t.resetTitle}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{t.resetSubtitle}</p>
            </div>
            <div>
              <Label htmlFor="reset-email">{t.email}</Label>
              <Input
                id="reset-email"
                type="email"
                autoComplete="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>
            {resetError && (
              <p role="alert" className="text-sm text-red-600">
                {resetError}
              </p>
            )}
            {resetMessage && <p className="text-sm text-green-700">{resetMessage}</p>}
            <Button className="w-full" variant="secondary" disabled={resetLoading}>
              {resetLoading ? t.resetLoading : t.resetSubmit}
            </Button>
          </form>
        )}

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
