'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

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
    <main className="min-h-screen px-5 py-10 pb-24">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="space-y-3 text-center text-emerald-900">
          <p className="text-xs tracking-[0.3em] text-emerald-500 uppercase">Preferências</p>
          <h1 className="text-3xl font-semibold">Cuida da tua experiência</h1>
          <p className="text-sm text-emerald-700/80">
            Ajusta os detalhes do teu perfil e como queres ouvir a voz da Tia Adélia.
          </p>
        </header>

        {status && (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {status}
          </div>
        )}

        <section className="rounded-3xl border border-emerald-200 bg-white/70 p-6">
          <h2 className="text-lg font-semibold text-emerald-900">Perfil</h2>
          <p className="mt-1 text-sm text-emerald-700/80">
            Diz-nos quem és e onde fica o teu jardim para afinarmos conselhos.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-emerald-900">
              Nome
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-emerald-900">
              Cidade
              <input
                type="text"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-emerald-900">
              Distrito
              <input
                type="text"
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
                className="rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none"
              />
            </label>
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
                className="rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none"
              >
                <option value="metric">Métrico</option>
                <option value="imperial">Imperial</option>
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-200 bg-white/70 p-6">
          <h2 className="text-lg font-semibold text-emerald-900">Notificações</h2>
          <p className="mt-1 text-sm text-emerald-700/80">
            Escolhe os lembretes que queres receber.
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
                  'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition',
                  preferences[item.key]
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-emerald-200 bg-white text-emerald-700 hover:border-emerald-300',
                )}
              >
                <span>{item.label}</span>
                <span
                  className={clsx(
                    'inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold uppercase',
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
        </section>

        <section className="rounded-3xl border border-emerald-200 bg-white/70 p-6">
          <h2 className="text-lg font-semibold text-emerald-900">Estilo da Tia Adélia</h2>
          <p className="mt-1 text-sm text-emerald-700/80">
            Escolhe se queres conselhos doces e tradicionais ou directos ao assunto.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {(
              [
                { value: 'tradicional', label: 'Carinho alentejano' },
                { value: 'directa', label: 'Conselho directo' },
              ] as { value: Preferences['personaTone']; label: string }[]
            ).map((tone) => (
              <button
                key={tone.value}
                type="button"
                onClick={() => setPreferences((prev) => ({ ...prev, personaTone: tone.value }))}
                className={clsx(
                  'rounded-full px-5 py-2 text-sm font-medium transition',
                  preferences.personaTone === tone.value
                    ? 'bg-emerald-500 text-white'
                    : 'border border-emerald-200 bg-white text-emerald-700 hover:border-emerald-300',
                )}
              >
                {tone.label}
              </button>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={saveSettings}
            disabled={!canSave}
            className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-60"
          >
            Guardar preferências
          </button>
          <button
            type="button"
            onClick={resetOnboarding}
            className="rounded-full border border-emerald-200 px-6 py-3 text-sm font-medium text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900"
          >
            Repetir onboarding
          </button>
        </div>
      </div>
    </main>
  );
}
