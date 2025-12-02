'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/useTranslation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useMemo(() => (supabase as SupabaseClient).auth, []);
  const [lang, setLang] = useState<'pt' | 'en'>('pt');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [next, setNext] = useState('/pt/dashboard');

  const tr = useTranslation(lang);
  const t = {
    title: tr('auth.reset.title'),
    subtitle: tr('auth.reset.subtitle'),
    password: tr('auth.password'),
    confirm: tr('auth.reset.confirm'),
    submit: tr('auth.reset.submit'),
    loading: tr('auth.reset.loading'),
    success: tr('auth.reset.success'),
    missingSession: tr('auth.reset.missingSession'),
    backToSignIn: tr('auth.reset.backToSignIn'),
    mismatch: tr('auth.reset.mismatch'),
    passwordRequired: tr('auth.reset.passwordRequired'),
    appName: tr('app.name'),
  } as const;

  useEffect(() => {
    try {
      const stored = localStorage.getItem('app.locale');
      if (stored === 'en' || stored === 'pt') setLang(stored);
    } catch {}
  }, []);

  useEffect(() => {
    const rawNext = searchParams.get('next');
    if (rawNext) {
      setNext(rawNext);
    }
  }, [auth, searchParams]);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      (async () => {
        try {
          const { data, error } = await auth.exchangeCodeForSession(code);
          if (!error && data?.session) {
            setHasSession(true);
          }
        } catch {
          setHasSession(false);
        }
      })();
    }
  }, [auth, searchParams]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await auth.getSession();
        if (active) setHasSession(Boolean(data?.session));
      } catch {
        if (active) setHasSession(false);
      }
    })();

    const { data: sub } = auth.onAuthStateChange((event: string, session: unknown) => {
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
        setHasSession(true);
      }
    });

    return () => {
      active = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [auth]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!password) {
      setError(t.passwordRequired);
      return;
    }
    if (password !== confirmPassword) {
      setError(t.mismatch);
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await auth.updateUser({ password });
      if (updateError) throw updateError;
      setMessage(t.success);
      setTimeout(() => {
        router.replace(next || '/pt/dashboard');
      }, 800);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : lang === 'en'
            ? 'Could not update password'
            : 'N\u00e3o foi poss\u00edvel atualizar a password';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6">
      <header className="text-center">
        <p className="eyebrow text-[var(--color-primary-strong)]">{t.title}</p>
        <h1 className="text-display text-4xl sm:text-5xl">{t.appName}</h1>
      </header>

      <div className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <h2 className="mb-2 text-xl font-semibold">{t.title}</h2>
        <p className="mb-6 text-sm text-[var(--color-text-muted)]">{t.subtitle}</p>

        {hasSession ? (
          <form className="space-y-4" onSubmit={handleUpdatePassword}>
            <div>
              <Label htmlFor="password">{t.password}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">{t.confirm}</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
            {message && <p className="text-sm text-green-700">{message}</p>}
            <Button className="w-full" disabled={loading} aria-busy={loading}>
              {loading ? t.loading : t.submit}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">{t.missingSession}</p>
        )}

        <div className="mt-4 text-center text-sm">
          <a className="text-[var(--color-primary)] underline" href="/signin">
            {t.backToSignIn}
          </a>
        </div>
      </div>
    </main>
  );
}
