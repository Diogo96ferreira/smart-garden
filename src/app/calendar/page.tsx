'use client';

import { Calendar as CalendarIcon } from 'lucide-react';

export default function CalendarPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]">
        <CalendarIcon className="h-7 w-7" />
      </div>
      <h1 className="text-display text-3xl sm:text-4xl">Calendário de cultivo</h1>
      <p className="max-w-2xl text-sm text-[var(--color-text-muted)] sm:text-base">
        Em breve poderá visualizar aqui os eventos importantes para cada planta: regas, podas,
        fertilizações e janelas ideais de colheita.
      </p>
    </main>
  );
}
