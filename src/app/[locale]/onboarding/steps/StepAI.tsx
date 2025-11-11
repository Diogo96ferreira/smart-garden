'use client';

import { useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

type Props = {
  onBack: () => void;
  onNext: () => void;
};

export function StepAI({ onBack, onNext }: Props) {
  const handleNext = useCallback(() => {
    onNext();
  }, [onNext]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
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
  }, [handleNext, onBack]);

  return (
    <section className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-4xl flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="w-full rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
        <Image
          src="/onboarding/tia-smart.png"
          width={640}
          height={420}
          alt="Tia Adélia no campo com um tablet e ícones de tecnologia."
          className="h-auto w-full rounded-[var(--radius-md)] object-cover"
        />
      </div>

      <div className="flex flex-col items-center gap-4">
        <p className="eyebrow">💧 Step 5</p>
        <h2 className="text-display text-4xl leading-tight sm:text-5xl">A magia da IA</h2>
        <p className="max-w-2xl text-lg text-[var(--color-text-muted)] sm:text-xl">
          A Smart Garden utiliza inteligência artificial para vigiar humidade, luz e nutrição das
          suas plantas, antecipando necessidades e guiando cada cuidado.
        </p>
      </div>

      <div className="flex w-full max-w-md gap-3">
        <Button variant="secondary" size="lg" className="w-full" onClick={onBack}>
          Voltar
        </Button>
        <Button size="lg" className="w-full" onClick={handleNext}>
          Continuar
        </Button>
      </div>
    </section>
  );
}
