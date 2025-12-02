'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/useTranslation';

export default function SignUpPage() {
  const router = useRouter();
  const [next, setNext] = useState('/pt/dashboard');
  const [lang, setLang] = useState<'pt' | 'en'>('pt');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tr = useTranslation(lang);
  const t = {
    header: tr('auth.signup.header'),
    title: tr('auth.signup.title'),
    subtitle: tr('auth.signup.subtitle').replace('{{app}}', tr('app.name')),
    name: tr('auth.name'),
    email: tr('auth.email'),
    password: tr('auth.password'),
    submit: tr('auth.signup.submit'),
    loading: tr('auth.signup.loading'),
    or: tr('auth.or'),
    google: tr('auth.google'),
    haveAccount: tr('auth.signup.haveAccount'),
    linkSignIn: tr('auth.signup.linkSignIn'),
    appName: tr('app.name'),
  } as const;

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(async ({ data }: { data: { session: { user?: { id?: string } } | null } }) => {
        if (data.session) {
          try {
            await fetch('/api/ensure-profile', { method: 'POST' });
          } catch {}
          let dest = next;
          try {
            const sp = new URLSearchParams(window.location.search);
            dest = sp.get('next') || next;
          } catch {}
          router.replace(dest);
        }
      });
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: unknown, session: { user?: { id?: string } } | null) => {
        if (session) {
          try {
            fetch('/api/ensure-profile', { method: 'POST' });
          } catch {}
          let dest = next;
          try {
            const sp = new URLSearchParams(window.location.search);
            dest = sp.get('next') || next;
          } catch {}
          router.replace(dest);
        }
      },
    );
    return () => sub.subscription?.unsubscribe?.();
  }, [next, router]);

  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const raw = sp.get('next');
      const dest = raw ? decodeURIComponent(raw) : '/pt/dashboard';
      setNext(dest);
    } catch {
      setNext('/pt/dashboard');
    }
  }, []);

  // Initialize language and keep `next` aligned
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) throw error;

      // Create/update public.users profile row (RLS policy will allow self)
      const userId = data.user?.id;
      if (userId) {
        await supabase.from('users').upsert({ id: userId, name, email }).eq('id', userId);
      }

      const storedLocale = localStorage.getItem('app.locale') || 'pt';
      router.replace(next || `/${storedLocale}/dashboard`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha a criar conta';
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
      const { error } = await supabase.auth.signInWithOAuth({
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

        <form className="space-y-4" onSubmit={handleSignUp} aria-label="Criar conta por email">
          <div>
            <Label htmlFor="name">{t.name}</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
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
              autoComplete="new-password"
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
          <Button className="w-full" disabled={loading} aria-busy={loading}>
            {loading
              ? lang === 'en'
                ? 'Creating...'
                : 'A criar...'
              : lang === 'en'
                ? 'Create account'
                : 'Criar conta'}
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
          {t.haveAccount}{' '}
          <a className="text-[var(--color-primary)] underline" href="/signin">
            {t.linkSignIn}
          </a>
        </p>
      </div>
    </main>
  );
}
