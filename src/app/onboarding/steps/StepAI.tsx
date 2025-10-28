'use client';

import { Sparkles, MessageCircleHeart, Image as ImageIcon } from 'lucide-react';

type Props = { onBack: () => void; onNext: () => void };

export function StepAI({ onBack, onNext }: Props) {
  return (
    <section className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.9)_0%,_rgba(220,252,231,0.62)_50%,_rgba(214,238,210,0.95)_100%)]" />
      <div className="mx-auto grid w-full max-w-5xl gap-10 rounded-[32px] bg-white/80 p-10 shadow-xl shadow-emerald-900/5 backdrop-blur xl:grid-cols-[1.05fr,0.95fr]">
        <div className="flex flex-col justify-between gap-10">
          <div className="space-y-4">
            <span className="chip-soft inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Passo 5 de 6
            </span>
            <h2 className="text-3xl font-semibold text-emerald-900">
              Conhece a Tia Adélia, a tua mentora IA
            </h2>
            <p className="text-sm text-emerald-900/70">
              A personagem da nossa inteligência artificial é uma senhora de 93 anos do Alentejo.
              Ela analisa imagens, conversa contigo e traduz dados em conselhos simples.
            </p>
          </div>
          <div className="grid gap-4 rounded-[28px] bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-6 text-sm text-emerald-900/80">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-1 h-5 w-5 text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-900">Diagnóstico visual</p>
                <p className="text-emerald-900/70">
                  Envia uma fotografia ou usa a câmara. A Tia Adélia identifica pragas, doenças e
                  sinais de stress.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MessageCircleHeart className="mt-1 h-5 w-5 text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-900">Conversas simpáticas</p>
                <p className="text-emerald-900/70">
                  Recebe respostas com tom carinhoso, dicas práticas e planos de ação semanais.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ImageIcon className="mt-1 h-5 w-5 text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-900">Memória da tua horta</p>
                <p className="text-emerald-900/70">
                  Guarda imagens antes/depois, períodos de rega e recordações da tua colheita.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm font-semibold text-emerald-800">
            <button type="button" onClick={onBack} className="btn-secondary">
              Voltar
            </button>
            <button type="button" onClick={onNext} className="btn-primary">
              Continuar
            </button>
          </div>
        </div>
        <div className="relative flex flex-col items-center justify-center rounded-[28px] bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 p-10 text-center">
          <div className="absolute -top-16 right-8 h-32 w-32 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute -bottom-10 left-6 h-28 w-28 rounded-full bg-amber-300/20 blur-3xl" />
          <div className="relative z-10 space-y-4">
            <p className="text-lg font-semibold text-emerald-900">
              “Boa colheita hoje, meu querido jardineiro 🌻”
            </p>
            <p className="text-sm text-emerald-900/70">
              A Tia Adélia usa o modelo Gemini para interpretar as tuas perguntas e trazer soluções
              com carinho.
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-emerald-900/70">
              {[
                '🌱 Diagnóstico rápido',
                '💧 Alertas de rega',
                '🌞 Luz ideal',
                '🤖 Powered by AI',
              ].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-white/60 px-4 py-1 font-semibold tracking-[0.2em] uppercase"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
