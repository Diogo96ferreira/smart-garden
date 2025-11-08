import React from 'react';

type Props = {
  locale: string;
};

export default function SupportCard({ locale }: Props) {
  const isEN = locale?.startsWith('en');
  const title = isEN ? 'Enjoying Smart Garden?' : 'Gostas da Smart Garden?';
  const line2 = isEN ? 'This app is free and ad-free 🙂' : 'A app é gratuita e sem anúncios 🙂';
  const line3 = isEN
    ? 'Tips help keep the servers running and new features growing.'
    : 'Se te tem sido útil, podes deixar uma pequena contribuição para ajudar a manter o projeto a crescer.';
  const line4 = isEN
    ? 'No pressure — only if you find it useful ✨'
    : '✌️ Só se quiseres, e sempre com gratidão.';
  const cta = isEN ? 'Support on Ko-fi' : 'Apoiar no Ko-fi';
  const href = process.env.NEXT_PUBLIC_KOFI_URL || 'https://ko-fi.com/diogoferreira25145';

  return (
    <section
      aria-label={title}
      className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-4 shadow-[var(--shadow-soft)]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-semibold text-[var(--color-text)]">{title}</p>
          <p className="text-sm text-[var(--color-text-muted)]">{line2}</p>
          <p className="text-sm text-[var(--color-text-muted)]">{line3}</p>
          <p className="text-sm text-[var(--color-text-muted)]">{line4}</p>
        </div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--color-primary)] px-5 text-sm font-medium text-[var(--color-primary-strong)] hover:bg-[var(--color-primary-soft)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] focus-visible:outline-none"
        >
          {cta}
        </a>
      </div>
    </section>
  );
}
