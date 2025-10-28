'use client';

import { useCallback, useEffect, useState } from 'react';

type Props = { onNext: () => void; onBack: () => void };

export function StepName({ onBack, onNext }: Props) {
  const [name, setName] = useState('');

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) setName(storedName);
  }, []);

  const handleNext = useCallback(() => {
    if (!name.trim()) return;
    localStorage.setItem('userName', name.trim());
    onNext();
  }, [name, onNext]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && name.trim()) {
        event.preventDefault();
        handleNext();
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [name, onBack, handleNext]);

  return (
    <section className="flex min-h-screen items-center justify-center px-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 text-emerald-900">
        <div className="space-y-3 text-center">
          <p className="text-xs tracking-[0.3em] text-emerald-500 uppercase">Quem cuida</p>
          <h2 className="text-3xl font-semibold">Como devemos tratar-te?</h2>
          <p className="text-sm text-emerald-700/80">
            Assim a Tia Adélia pode chamar-te pelo nome certo.
          </p>
        </div>

        <input
          type="text"
          placeholder="O teu nome"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-2xl border border-emerald-200 bg-white/70 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none"
        />

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full px-4 py-2 font-medium text-emerald-600 transition hover:text-emerald-800"
          >
            voltar
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!name.trim()}
            className="rounded-full bg-emerald-500 px-6 py-2 font-medium text-white transition hover:bg-emerald-600 disabled:opacity-60"
          >
            continuar
          </button>
        </div>
      </div>
    </section>
  );
}
