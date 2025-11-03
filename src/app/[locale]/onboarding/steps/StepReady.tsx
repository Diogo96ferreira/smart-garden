'use client';

import { useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

type Props = {
  onBack: () => void;
  onFinish: () => void;
};

export function StepReady({ onBack, onFinish }: Props) {
  const handleFinish = useCallback(() => {
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleFinish();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleFinish, onBack]);

  return (
    <section className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-4xl flex-col items-center justify-center gap-12 px-6 text-center">
      <div className="w-full rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
        <Image
          src="/onboarding/tia-final.png"
          width={640}
          height={420}
          alt="Tia Adélia a plantar uma muda ao pôr-do-sol."
          className="h-auto w-full rounded-[var(--radius-md)] object-cover"
        />
      </div>

      <div className="flex flex-col items-center gap-4">
        <p className="eyebrow">🌇 Step 6</p>
        <h2 className="text-display text-4xl leading-tight sm:text-5xl">Vamos plantar juntos!</h2>
        <p className="max-w-2xl text-lg text-[var(--color-text-muted)] sm:text-xl">
          Está tudo pronto para iniciar a sua horta inteligente com a Tia Adélia. Vamos cuidar das
          suas plantas passo a passo e celebrar cada colheita.
        </p>
      </div>

      <div className="flex w-full max-w-md gap-3">
        <Button variant="secondary" size="lg" className="w-full" onClick={onBack}>
          Voltar
        </Button>
        <Button size="lg" className="w-full" onClick={handleFinish}>
          Começar a minha horta
        </Button>
      </div>
    </section>
  );
}
