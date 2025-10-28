'use client';

import { useCallback, useEffect, useState } from 'react';
import { User } from 'lucide-react';

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
    <section className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.85)_0%,_rgba(220,252,231,0.65)_60%,_rgba(214,238,210,0.9)_100%)]" />
      <div className="mx-auto grid w-full max-w-4xl gap-10 rounded-[32px] bg-white/80 p-10 shadow-xl shadow-emerald-900/5 backdrop-blur md:grid-cols-[1fr,0.9fr]">
        <div className="flex flex-col justify-between gap-10">
          <div className="space-y-4">
            <span className="chip-soft inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Passo 1 de 6
            </span>
            <h2 className="text-3xl font-semibold text-emerald-900">Como devemos tratar-te?</h2>
            <p className="text-sm text-emerald-900/70">
              A Tia Adélia gosta de chamar cada jardineiro pelo nome. Partilha como gostas de ser
              tratado.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <label className="text-xs tracking-[0.28em] text-emerald-500 uppercase">
              O teu nome
            </label>
            <div className="glass-card flex items-center gap-3 rounded-[24px] px-5 py-4">
              <User className="h-5 w-5 text-emerald-500" />
              <input
                type="text"
                placeholder="Ex.: João"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="sg-input w-full border-none bg-transparent px-0 text-lg focus-visible:shadow-none"
              />
            </div>
            <p className="text-xs text-emerald-900/60">
              Guardamos apenas para personalizar mensagens e dicas.
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-6 rounded-[28px] bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-6">
          <div className="space-y-2 text-sm text-emerald-900/80">
            <p className="font-semibold text-emerald-900">O que a Tia Adélia diz</p>
            <p>
              “Quando chamamos cada planta e jardineiro pelo nome, o carinho cresce mais rápido.”
            </p>
          </div>
          <div className="grid gap-2 text-sm text-emerald-900/70">
            <div className="flex items-center justify-between">
              <span>Personalização do chat</span>
              <span className="font-semibold text-emerald-700">Pronta</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Mensagens motivacionais</span>
              <span className="font-semibold text-emerald-700">Ativas</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm font-semibold text-emerald-800">
            <button type="button" onClick={onBack} className="btn-secondary">
              Voltar
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!name.trim()}
              className="btn-primary disabled:opacity-60"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
