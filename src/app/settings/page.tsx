'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { BellRing, Sparkles, SlidersHorizontal, Sun, Moon } from 'lucide-react';

type Preferences = {
  notifications: boolean;
  wateringReminders: boolean;
  aiTips: boolean;
  measurement: 'metric' | 'imperial';
  personaTone: 'tradicional' | 'directa';
};

type ToggleKey = 'notifications' | 'wateringReminders' | 'aiTips';

const defaultPreferences: Preferences = {
  notifications: true,
  wateringReminders: true,
  aiTips: true,
  measurement: 'metric',
  personaTone: 'tradicional',
};

export default function SettingsPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [theme, setTheme] = useState<'claro' | 'escuro'>('claro');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) setName(storedName);

    const storedLocation = localStorage.getItem('userLocation');
    if (storedLocation) {
      try {
        const parsed = JSON.parse(storedLocation) as { distrito?: string; municipio?: string };
        setDistrict(parsed.distrito ?? '');
        setCity(parsed.municipio ?? '');
      } catch (error) {
        console.warn('Não foi possível carregar a localização guardada.', error);
      }
    }

    const storedPreferences = localStorage.getItem('userPreferences');
    if (storedPreferences) {
      try {
        const parsed = JSON.parse(storedPreferences) as Preferences;
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch (error) {
        console.warn('Não foi possível carregar as preferências guardadas.', error);
      }
    }

    const storedTheme = localStorage.getItem('gardenTheme');
    if (storedTheme === 'escuro' || storedTheme === 'claro') setTheme(storedTheme);
  }, []);

  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(null), 3500);
    return () => clearTimeout(timer);
  }, [status]);

  const saveSettings = () => {
    localStorage.setItem('userName', name.trim());
    localStorage.setItem(
      'userLocation',
      JSON.stringify({ distrito: district.trim(), municipio: city.trim() }),
    );
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    localStorage.setItem('gardenTheme', theme);
    setStatus('Preferências guardadas com sucesso.');
  };

  const togglePreference = (key: ToggleKey) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const canSave = useMemo(() => {
    return Boolean(name.trim() && city.trim());
  }, [name, city]);

  const resetOnboarding = () => {
    localStorage.removeItem('onboardingComplete');
    setStatus('Onboarding reiniciado. Vais voltar a falar com a Tia Adélia.');
    router.push('/onboarding');
  };

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-5 pt-16 pb-36">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.88)_0%,_rgba(220,252,231,0.6)_55%,_rgba(214,238,210,0.95)_100%)]" />

      <header className="glass-card relative overflow-hidden px-6 py-8 sm:px-10">
        <div className="absolute top-0 -right-14 h-40 w-40 rounded-full bg-gradient-to-br from-[#22c55e]/30 to-[#0ea5e9]/20 blur-3xl" />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <span className="chip-soft inline-flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" /> Definições
            </span>
            <h1 className="text-4xl leading-tight font-semibold text-emerald-900">
              Cuida da tua experiência
            </h1>
            <p className="text-sm text-emerald-900/70">
              Ajusta o perfil, os lembretes e o tom da Tia Adélia para que a tua horta receba apenas
              as mensagens que fazem sentido.
            </p>
          </div>
          <div className="rounded-[26px] bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 p-5 text-sm text-emerald-900/80">
            <p className="font-semibold text-emerald-900">Estado geral</p>
            <ul className="mt-2 space-y-1">
              <li className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-emerald-500" /> Alertas{' '}
                {preferences.notifications ? 'ativos' : 'pausados'}
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sky-500" /> Tia Adélia em tom{' '}
                {preferences.personaTone}
              </li>
              <li className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-amber-500" /> Tema {theme}
              </li>
            </ul>
          </div>
        </div>
      </header>

      {status && (
        <div className="rounded-[24px] bg-emerald-500/10 px-4 py-3 text-sm text-emerald-900">
          {status}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-[28px] p-6">
          <h2 className="text-xl font-semibold text-emerald-900">Perfil</h2>
          <p className="text-sm text-emerald-900/70">
            Diz-nos quem és e onde fica o teu jardim para afinarmos conselhos e previsões.
          </p>
          <div className="mt-6 grid gap-4">
            <label className="flex flex-col gap-2 text-sm text-emerald-900">
              Nome
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="sg-input"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-emerald-900">
                Cidade
                <input
                  type="text"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  className="sg-input"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-emerald-900">
                Distrito
                <input
                  type="text"
                  value={district}
                  onChange={(event) => setDistrict(event.target.value)}
                  className="sg-input"
                />
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm text-emerald-900">
              Unidades de medida
              <select
                value={preferences.measurement}
                onChange={(event) =>
                  setPreferences((prev) => ({
                    ...prev,
                    measurement: event.target.value as Preferences['measurement'],
                  }))
                }
                className="sg-input sg-select"
              >
                <option value="metric">Métrico</option>
                <option value="imperial">Imperial</option>
              </select>
            </label>
          </div>
        </div>

        <div className="glass-card rounded-[28px] p-6">
          <h2 className="text-xl font-semibold text-emerald-900">Notificações</h2>
          <p className="text-sm text-emerald-900/70">
            Escolhe os lembretes que queres receber da tua horta inteligente.
          </p>
          <div className="mt-6 space-y-3">
            {(
              [
                { key: 'notifications', label: 'Receber novidades gerais' },
                { key: 'wateringReminders', label: 'Alertas de rega' },
                { key: 'aiTips', label: 'Sugestões inteligentes da Tia Adélia' },
              ] as { key: ToggleKey; label: string }[]
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => togglePreference(item.key)}
                className={clsx(
                  'flex w-full items-center justify-between rounded-[22px] px-4 py-3 text-left text-sm transition',
                  preferences[item.key]
                    ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 text-emerald-800 shadow-sm'
                    : 'bg-white/70 text-emerald-700 hover:bg-white',
                )}
              >
                <span>{item.label}</span>
                <span
                  className={clsx(
                    'inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold uppercase',
                    preferences[item.key]
                      ? 'bg-emerald-500 text-white'
                      : 'bg-emerald-200 text-emerald-700',
                  )}
                >
                  {preferences[item.key] ? 'on' : 'off'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-[28px] p-6">
          <h2 className="text-xl font-semibold text-emerald-900">Tom da Tia Adélia</h2>
          <p className="text-sm text-emerald-900/70">
            Escolhe se preferes uma voz mais tradicional e carinhosa ou directa e pragmática.
          </p>
          <div className="mt-6 grid gap-4">
            {(
              [
                {
                  value: 'tradicional',
                  label: 'Tradicional e doce',
                  description: 'Mensagens com provérbios e histórias do Alentejo.',
                },
                {
                  value: 'directa',
                  label: 'Directa e prática',
                  description: 'Instruções objetivas e planos de ação rápidos.',
                },
              ] as { value: Preferences['personaTone']; label: string; description: string }[]
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setPreferences((prev) => ({
                    ...prev,
                    personaTone: option.value,
                  }))
                }
                className={clsx(
                  'rounded-[24px] border px-5 py-4 text-left text-sm transition',
                  preferences.personaTone === option.value
                    ? 'border-emerald-400 bg-emerald-500/15 text-emerald-900 shadow-sm'
                    : 'border-white/70 bg-white/60 text-emerald-800 hover:bg-white',
                )}
              >
                <p className="text-base font-semibold text-emerald-900">{option.label}</p>
                <p className="text-emerald-900/70">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card flex flex-col gap-5 rounded-[28px] p-6">
          <h2 className="text-xl font-semibold text-emerald-900">Tema visual</h2>
          <p className="text-sm text-emerald-900/70">
            Ajusta a aparência da app para combinares com o brilho do teu jardim.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { id: 'claro', label: 'Tema Claro', icon: Sun },
              { id: 'escuro', label: 'Tema Escuro', icon: Moon },
            ].map((option) => {
              const Icon = option.icon;
              const active = theme === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTheme(option.id as 'claro' | 'escuro')}
                  className={clsx(
                    'flex flex-col items-start gap-3 rounded-[24px] border px-5 py-4 text-left transition',
                    active
                      ? 'border-emerald-400 bg-emerald-500/15 text-emerald-900 shadow-sm'
                      : 'border-white/70 bg-white/60 text-emerald-800 hover:bg-white',
                  )}
                >
                  <Icon className="h-6 w-6 text-emerald-500" />
                  <p className="text-base font-semibold text-emerald-900">{option.label}</p>
                  <p className="text-sm text-emerald-900/70">
                    {active ? 'Seleccionado' : 'Experimentar'}
                  </p>
                </button>
              );
            })}
          </div>
          <div className="rounded-[24px] bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 p-5 text-sm text-emerald-900/80">
            <p className="font-semibold text-emerald-900">Reiniciar onboarding</p>
            <p className="mt-1">
              Volta a falar com a Tia Adélia desde o início para redefinir dados e dicas.
            </p>
            <button
              type="button"
              onClick={resetOnboarding}
              className="btn-secondary mt-3 text-xs tracking-[0.2em] uppercase"
            >
              Reiniciar experiência
            </button>
          </div>
        </div>
      </section>

      <div className="sticky bottom-28 z-30 flex justify-end">
        <button
          type="button"
          onClick={saveSettings}
          disabled={!canSave}
          className="btn-primary disabled:opacity-60"
        >
          Guardar preferências
        </button>
      </div>
    </main>
  );
}
