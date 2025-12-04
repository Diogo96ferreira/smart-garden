'use client';

import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';

export default function PrivacyPage() {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale?.toString().startsWith('en') ? 'en' : 'pt';
  const t = useTranslation(locale);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <p className="eyebrow text-[var(--color-text-muted)]">{t('legal.privacy.eyebrow')}</p>
        <h1 className="text-display text-3xl sm:text-4xl">{t('legal.privacy.title')}</h1>
        <p className="max-w-3xl text-sm text-[var(--color-text-muted)]">
          {t('legal.privacy.summary')}
        </p>
      </header>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)]">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          {t('legal.privacy.dataWeStore')}
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          {t('legal.privacy.dataWeStoreDesc')}
        </p>
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)]">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          {t('legal.privacy.usage')}
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">{t('legal.privacy.usageDesc')}</p>
      </section>

      <section className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)]">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          {t('legal.privacy.rights')}
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">{t('legal.privacy.rightsDesc')}</p>
      </section>
    </main>
  );
}
