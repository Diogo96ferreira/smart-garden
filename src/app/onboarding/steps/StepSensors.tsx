'use client';

import { useEffect, useState, type ComponentType, type SVGProps } from 'react';
import { Bluetooth, Cloud, Wifi } from 'lucide-react';

type Props = { onBack: () => void; onNext: () => void };

type IntegrationOption = {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const INTEGRATIONS: IntegrationOption[] = [
  {
    id: 'bluetooth-probe',
    title: 'Sonda Bluetooth',
    description: 'Lê humidade, temperatura e PH do solo em tempo real.',
    icon: Bluetooth,
  },
  {
    id: 'wifi-weather',
    title: 'Estação Wi-Fi',
    description: 'Sincroniza meteorologia local e avisos de geada.',
    icon: Wifi,
  },
  {
    id: 'cloud-services',
    title: 'Integrações na nuvem',
    description: 'Conecta Alexa, Google Home e calendários inteligentes.',
    icon: Cloud,
  },
];

export function StepSensors({ onBack, onNext }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('sensorSetup');
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
      localStorage.setItem('sensorSetup', JSON.stringify(next));
      return next;
    });
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.92)_0%,_rgba(220,252,231,0.6)_52%,_rgba(214,238,210,0.95)_100%)]" />
      <div className="mx-auto grid w-full max-w-5xl gap-10 rounded-[32px] bg-white/80 p-10 shadow-xl shadow-emerald-900/5 backdrop-blur xl:grid-cols-[1fr,0.95fr]">
        <div className="flex flex-col justify-between gap-10">
          <div className="space-y-4">
            <span className="chip-soft inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Passo 4 de 6
            </span>
            <h2 className="text-3xl font-semibold text-emerald-900">
              Quais sensores queres acompanhar?
            </h2>
            <p className="text-sm text-emerald-900/70">
              Escolhe os dispositivos e integrações que tens disponíveis. A app adapta as dicas e
              alertas automaticamente. Podes adicionar mais tarde nas definições.
            </p>
          </div>
          <div className="rounded-[28px] bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-6 text-sm text-emerald-900/70">
            <p className="font-semibold text-emerald-900">Sabias que...</p>
            <p>
              Sensores ligados à Tia Adélia criam relatórios semanais, enviam notificações e ajudam
              a prever regas urgentes.
            </p>
          </div>
          <div className="flex items-center justify-between text-sm font-semibold text-emerald-800">
            <button type="button" onClick={onBack} className="btn-secondary">
              Voltar
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('sensorSetup', JSON.stringify(selected));
                onNext();
              }}
              className="btn-primary"
            >
              Continuar
            </button>
          </div>
        </div>
        <div className="grid gap-4">
          {INTEGRATIONS.map((option) => {
            const Icon = option.icon;
            const active = selected.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggle(option.id)}
                className={`flex items-center gap-4 rounded-[26px] border border-white/50 px-6 py-5 text-left shadow-md transition ${
                  active
                    ? 'bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 text-emerald-900 shadow-emerald-900/10'
                    : 'bg-white/70 text-emerald-900/80 hover:bg-white'
                }`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <Icon className="h-7 w-7" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-lg font-semibold text-emerald-900">{option.title}</p>
                  <p className="text-sm text-emerald-900/70">{option.description}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold tracking-[0.2em] uppercase ${
                    active ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-600'
                  }`}
                >
                  {active ? 'ligado' : 'ativar'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
