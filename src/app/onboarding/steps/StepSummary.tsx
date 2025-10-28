'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarHeart, Leaf, Settings2 } from 'lucide-react';

type Props = { onBack: () => void };

type SummaryState = {
  name: string;
  location: string;
  plants: string[];
  sensors: string[];
};

const LABELS: Record<string, string> = {
  horta: 'Horta fresca',
  aromaticas: 'Ervas aromáticas',
  pomar: 'Pomar doce',
  flores: 'Flores coloridas',
  'bluetooth-probe': 'Sonda Bluetooth',
  'wifi-weather': 'Estação Wi-Fi',
  'cloud-services': 'Integrações na nuvem',
};

export function StepSummary({ onBack }: Props) {
  const router = useRouter();
  const [summary, setSummary] = useState<SummaryState>({
    name: '',
    location: '',
    plants: [],
    sensors: [],
  });

  useEffect(() => {
    const storedName = localStorage.getItem('userName') ?? '';
    const storedLocation = localStorage.getItem('userLocation');
    const storedPlants = localStorage.getItem('favoritePlants');
    const storedSensors = localStorage.getItem('sensorSetup');

    let location = '';
    if (storedLocation) {
      try {
        const parsed = JSON.parse(storedLocation) as { distrito?: string; municipio?: string };
        location = [parsed.municipio, parsed.distrito].filter(Boolean).join(', ');
      } catch {
        location = '';
      }
    }

    const parsedPlants = (() => {
      if (!storedPlants) return [] as string[];
      try {
        const result = JSON.parse(storedPlants) as string[];
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    })();

    const parsedSensors = (() => {
      if (!storedSensors) return [] as string[];
      try {
        const result = JSON.parse(storedSensors) as string[];
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    })();

    setSummary({
      name: storedName,
      location,
      plants: parsedPlants,
      sensors: parsedSensors,
    });
  }, []);

  const chips = useMemo(() => {
    return [
      ...summary.plants.map((item) => LABELS[item] ?? item),
      ...summary.sensors.map((item) => LABELS[item] ?? item),
    ];
  }, [summary.plants, summary.sensors]);

  const handleFinish = () => {
    localStorage.setItem('onboardingComplete', 'true');
    router.push('/splash');
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.92)_0%,_rgba(220,252,231,0.65)_50%,_rgba(214,238,210,0.95)_100%)]" />
      <div className="mx-auto grid w-full max-w-4xl gap-10 rounded-[32px] bg-white/80 p-10 text-center shadow-xl shadow-emerald-900/5 backdrop-blur">
        <div className="space-y-4">
          <span className="chip-soft inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Passo 6 de 6
          </span>
          <h2 className="text-3xl font-semibold text-emerald-900">
            Prontinho! A horta está configurada.
          </h2>
          <p className="text-sm text-emerald-900/70">
            Revê abaixo o resumo do teu jardim e começa a explorar o dashboard com conselhos da Tia
            Adélia.
          </p>
        </div>
        <div className="grid gap-6 rounded-[28px] bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-8 text-sm text-emerald-900/80">
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-emerald-700">
            {chips.length ? (
              chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-white/70 px-4 py-2 tracking-[0.2em] uppercase"
                >
                  {chip}
                </span>
              ))
            ) : (
              <span className="rounded-full bg-white/70 px-4 py-2 tracking-[0.2em] text-emerald-500 uppercase">
                Personaliza mais tarde
              </span>
            )}
          </div>
          <div className="grid gap-4 text-left text-sm sm:grid-cols-3">
            <div className="rounded-[24px] bg-white/80 p-5 shadow-sm">
              <p className="flex items-center gap-2 text-xs tracking-[0.25em] text-emerald-500 uppercase">
                <Leaf className="h-4 w-4 text-emerald-500" /> Jardineiro
              </p>
              <p className="mt-2 text-lg font-semibold text-emerald-900">
                {summary.name || 'Sem nome'}
              </p>
              <p className="text-emerald-900/60">Tia Adélia vai tratar-te assim.</p>
            </div>
            <div className="rounded-[24px] bg-white/80 p-5 shadow-sm">
              <p className="flex items-center gap-2 text-xs tracking-[0.25em] text-emerald-500 uppercase">
                <CalendarHeart className="h-4 w-4 text-emerald-500" /> Localização
              </p>
              <p className="mt-2 text-lg font-semibold text-emerald-900">
                {summary.location || 'Ainda por definir'}
              </p>
              <p className="text-emerald-900/60">Usamos para previsões e regas recomendadas.</p>
            </div>
            <div className="rounded-[24px] bg-white/80 p-5 shadow-sm">
              <p className="flex items-center gap-2 text-xs tracking-[0.25em] text-emerald-500 uppercase">
                <Settings2 className="h-4 w-4 text-emerald-500" /> Sensores ligados
              </p>
              <p className="mt-2 text-lg font-semibold text-emerald-900">
                {summary.sensors.length || '0'} dispositivos
              </p>
              <p className="text-emerald-900/60">
                Podes ajustar nas definições a qualquer momento.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-semibold text-emerald-800">
          <button type="button" onClick={onBack} className="btn-secondary">
            Voltar
          </button>
          <button type="button" onClick={handleFinish} className="btn-primary">
            Ir para a minha horta
          </button>
        </div>
      </div>
    </section>
  );
}
