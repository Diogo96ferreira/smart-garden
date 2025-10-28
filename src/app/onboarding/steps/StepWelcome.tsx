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
    <section className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9)_0%,_rgba(220,252,231,0.6)_45%,_rgba(214,238,210,0.9)_100%)]" />
      <div className="mx-auto grid w-full max-w-5xl gap-12 rounded-[32px] bg-white/70 p-10 shadow-xl shadow-emerald-900/5 backdrop-blur xl:grid-cols-[1.1fr,0.9fr]">
        <div className="flex flex-col justify-between gap-10">
          <div className="space-y-4">
            <span className="chip-soft inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Smart Garden App
            </span>
            <h1 className="text-4xl leading-tight font-semibold text-emerald-900">
              Cresce com a sabedoria da Tia Adélia e a magia da inteligência artificial.
            </h1>
            <p className="text-sm text-emerald-900/70">
              Vamos preparar a tua horta com algumas perguntas rápidas. Serão 6 passos guiados com a
              Tia Adélia ao teu lado.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-emerald-800">
            {[
              'Nome',
              'Localização',
              'Plantas favoritas',
              'Sensores',
              'Tia Adélia',
              'Resumo final',
            ].map((item) => (
              <span
                key={item}
                className="rounded-full bg-emerald-500/10 px-4 py-2 font-semibold tracking-[0.2em] uppercase"
              >
                {item}
              </span>
            ))}
          </div>
          <button type="button" onClick={onNext} className="btn-primary self-start">
            Começar jornada
          </button>
        </div>
        <div className="relative grid place-items-center">
          <div className="sg-hero-illustration" />
          <div className="glass-card relative z-10 flex flex-col items-center gap-4 rounded-[28px] bg-white/80 p-8 text-center">
            <Image
              src="/avatar-adelia.jpg"
              alt="Tia Adélia"
              width={160}
              height={160}
              className="rounded-full border-4 border-white/80 shadow-lg"
            />
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-emerald-900">
                “Olá, meu querido jardineiro!”
              </h2>
              <p className="text-sm text-emerald-900/70">
                “Eu sou a Tia Adélia, 93 anos de histórias do Alentejo. Vamos cuidar da tua horta
                com carinho e tecnologia.”
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
