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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        let dest = next;
        try {
          const sp = new URLSearchParams(window.location.search);
          dest = sp.get('next') || next;
        } catch {}
        router.replace(dest);
      }
    });

    const { data: sub } = (supabase as any).auth.onAuthStateChange(
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
      setNext(sp.get('next') || '/pt/dashboard');
    } catch {}
  }, []);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await (supabase as any).auth.signInWithPassword({ email, password });
      if (error) throw error;
      const storedLocale = localStorage.getItem('app.locale') || 'pt';
      router.replace(next || `/${storedLocale}/dashboard`);
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
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6">
      <header className="text-center">
        <p className="eyebrow text-[var(--color-primary-strong)]">Bem-vindo</p>
        <h1 className="text-display text-4xl sm:text-5xl">Smart Garden</h1>
      </header>

      <div className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <h2 className="mb-2 text-xl font-semibold">Entrar</h2>
        <p className="mb-6 text-sm text-[var(--color-text-muted)]">
          Acede ao teu jardim inteligente
        </p>

        <form
          className="space-y-4"
          onSubmit={handleEmailSignIn}
          aria-label="Iniciar sessão por email"
        >
          <div>
            <Label htmlFor="email">Email</Label>
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
            <Label htmlFor="password">Password</Label>
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
            {loading ? 'A entrar…' : 'Entrar'}
          </Button>
        </form>

        <div className="my-4 text-center text-sm text-[var(--color-text-muted)]">ou</div>

        <Button
          className="w-full"
          variant="secondary"
          onClick={handleGoogle}
          disabled={loading}
          aria-busy={loading}
        >
          Entrar com Google
        </Button>

        <p className="mt-6 text-center text-sm">
          Não tens conta?{' '}
          <a className="text-[var(--color-primary)] underline" href="/signup">
            Criar conta
          </a>
        </p>
      </div>
    </main>
  );
}
