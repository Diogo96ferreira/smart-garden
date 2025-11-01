'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

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
    <section className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-4xl flex-col items-center justify-center gap-12 px-6 text-center">
      <div className="w-full rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
        <Image
          src="/onboarding/tia-welcome.png"
          width={640}
          height={420}
          alt="Tia Adélia à porta de casa com um cesto de legumes."
          className="h-auto w-full rounded-[var(--radius-md)] object-cover"
          priority
        />
      </div>

      <div className="flex flex-col items-center gap-4">
        <p className="eyebrow">🪴 Step 1</p>
        <h1 className="text-display text-4xl leading-tight sm:text-5xl">
          Bem-vindo à Smart Garden
        </h1>
        <p className="max-w-2xl text-lg text-[var(--color-text-muted)] sm:text-xl">
          A Tia Adélia vai acompanhá-lo na criação de uma horta inteligente, ligando a tradição ao
          cuidado assistido pela tecnologia.
        </p>
      </div>

      <div className="flex w-full max-w-sm items-center justify-center">
        <Button variant="primary" size="lg" className="w-full text-white" onClick={onNext}>
          🌱 Vamos começar
        </Button>
      </div>
    </section>
  );
}
