'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';

type Props = { onNext: () => void };

export function StepWelcome({ onNext }: Props) {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onNext]);

  return (
    <section className="flex min-h-screen items-center justify-center px-6">
      <div className="mx-auto flex max-w-md flex-col items-center gap-8 text-center text-emerald-900">
        <span className="rounded-full border border-emerald-200 px-4 py-1 text-xs tracking-[0.3em] text-emerald-500 uppercase">
          Smart Garden
        </span>
        <h1 className="text-4xl leading-tight font-semibold">
          Cresce com a sabedoria da Tia Adélia e a magia da inteligência artificial.
        </h1>
        <p className="text-sm text-emerald-700/80">
          Vamos preparar o teu espaço verde com alguns detalhes rápidos.
        </p>
        <button
          type="button"
          onClick={onNext}
          className="rounded-full bg-emerald-500 px-8 py-3 text-sm font-medium text-white transition hover:bg-emerald-600"
        >
          Começar
        </button>
      </div>
    </section>
  );
}
