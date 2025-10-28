'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Sprout, TreePine, Wheat } from 'lucide-react';

const PLANT_OPTIONS = [
  {
    id: 'horta',
    label: 'Horta fresca',
    description: 'Alfaces, tomates, pepinos e folhas tenras.',
    icon: Sprout,
  },
  {
    id: 'aromaticas',
    label: 'Ervas aromáticas',
    description: 'Manjericão, hortelã, salsa e alecrim perfumado.',
    icon: Wheat,
  },
  {
    id: 'pomar',
    label: 'Pomar doce',
    description: 'Macieiras, laranjeiras e árvores de fruto.',
    icon: TreePine,
  },
  {
    id: 'flores',
    label: 'Flores coloridas',
    description: 'Girassóis, lavandas e begónias brilhantes.',
    icon: CheckCircle,
  },
];

type Props = { onBack: () => void; onNext: () => void };

export function StepPlants({ onBack, onNext }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('favoritePlants');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as string[];
      if (Array.isArray(parsed)) setSelected(parsed);
    } catch {
      setSelected([]);
    }
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem('favoritePlants', JSON.stringify(next));
      return next;
    });
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.92)_0%,_rgba(220,252,231,0.65)_50%,_rgba(214,238,210,0.95)_100%)]" />
      <div className="mx-auto grid w-full max-w-5xl gap-10 rounded-[32px] bg-white/80 p-10 shadow-xl shadow-emerald-900/5 backdrop-blur xl:grid-cols-[1fr,0.95fr]">
        <div className="flex flex-col justify-between gap-10">
          <div className="space-y-4">
            <span className="chip-soft inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Passo 3 de 6
            </span>
            <h2 className="text-3xl font-semibold text-emerald-900">
              Que tipo de horta queres acompanhar?
            </h2>
            <p className="text-sm text-emerald-900/70">
              Escolhe os estilos que melhor representam as tuas plantas. Personalizamos gráficos,
              dicas e lembretes.
            </p>
          </div>
          <div className="grid gap-4 text-sm text-emerald-900/70">
            <p className="font-semibold text-emerald-900">Sugestão da Tia Adélia</p>
            <p>
              “Mistura sempre uma erva aromática perto dos tomates — ajudam-se um ao outro e afastam
              pragas.”
            </p>
          </div>
          <div className="flex items-center justify-between text-sm font-semibold text-emerald-800">
            <button type="button" onClick={onBack} className="btn-secondary">
              Voltar
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!selected.length}
              className="btn-primary disabled:opacity-60"
            >
              Continuar
            </button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {PLANT_OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = selected.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggle(option.id)}
                className={`relative flex h-full flex-col gap-3 rounded-[28px] border border-white/60 p-6 text-left shadow-md transition ${
                  active
                    ? 'bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 text-emerald-900 shadow-emerald-900/10'
                    : 'bg-white/70 text-emerald-900/80 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold tracking-[0.2em] uppercase ${
                      active ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-600'
                    }`}
                  >
                    {active ? 'selecionado' : 'tocar'}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-emerald-900">{option.label}</p>
                  <p className="text-sm text-emerald-900/70">{option.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
