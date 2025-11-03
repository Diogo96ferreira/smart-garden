'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
  onNext: () => void;
  onBack: () => void;
};

export function StepName({ onBack, onNext }: Props) {
  const [name, setName] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('userName') ?? '';
  });

  const handleNext = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) return;

    localStorage.setItem('userName', trimmed);
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
  }, [handleNext, name, onBack]);

  return (
    <section className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-4xl flex-col items-center justify-center gap-12 px-6 text-center">
      <div className="w-full rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
        <Image
          src="/onboarding/tia-name.png"
          width={640}
          height={420}
          alt="Tia Adélia no campo ao lado de um letreiro de madeira."
          className="h-auto w-full rounded-[var(--radius-md)] object-cover"
        />
      </div>

      <div className="flex flex-col items-center gap-4">
        <p className="eyebrow">🌾 Step 2</p>
        <h2 className="text-display text-4xl leading-tight sm:text-5xl">Como se chama?</h2>
        <p className="max-w-xl text-lg text-[var(--color-text-muted)] sm:text-xl">
          Queremos conhecê-lo melhor para que cada recomendação faça sentido para a sua horta.
        </p>
      </div>

      <div className="w-full max-w-md">
        <Input
          type="text"
          placeholder="O seu nome..."
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="flex w-full max-w-md gap-3">
        <Button variant="secondary" size="lg" className="w-full" onClick={onBack}>
          Voltar
        </Button>
        <Button size="lg" className="w-full" onClick={handleNext} disabled={!name.trim()}>
          Continuar
        </Button>
      </div>
    </section>
  );
}
