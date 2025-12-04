'use client';

import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';

export default function TermsPage() {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale?.toString().startsWith('en') ? 'en' : 'pt';
  const t = useTranslation(locale);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <p className="eyebrow text-[var(--color-text-muted)]">{t('legal.terms.eyebrow')}</p>
        <h1 className="text-display text-3xl sm:text-4xl">{t('legal.terms.title')}</h1>
        <p className="max-w-3xl text-sm text-[var(--color-text-muted)]">
          {t('legal.terms.summary')}
        </p>
      </header>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)]">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('legal.terms.use')}</h2>
        <p className="text-sm text-[var(--color-text-muted)]">{t('legal.terms.useDesc')}</p>
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)]">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          {t('legal.terms.liability')}
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">{t('legal.terms.liabilityDesc')}</p>
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)]">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          {t('legal.terms.contact')}
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">{t('legal.terms.contactDesc')}</p>
      </section>
    </main>
  );
}
