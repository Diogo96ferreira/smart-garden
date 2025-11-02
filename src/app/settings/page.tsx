'use client';

import * as React from 'react';
import { useSettings } from '@/hooks/useSettings';
import { type Settings, DEFAULT_SETTINGS, type AIProfile, type ReportRange } from '@/lib/settings';
import { Settings2, Globe, Sun, Moon, Laptop, Bot, FileText, Download } from 'lucide-react';

// Aplica tema no <html> (respeita system/dark/light)
function useApplyTheme(theme: Settings['theme']) {
  React.useEffect(() => {
    const root = document.documentElement;
    const sysDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const dark = theme === 'dark' || (theme === 'system' && sysDark);
    root.classList.toggle('dark', dark);
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    // evita `any`: usa CSS custom property
    root.style.setProperty('color-scheme', dark ? 'dark' : 'light');
  }, [theme]);
}

const AI_PROFILES: { id: AIProfile; label: string; desc: string }[] = [
  {
    id: 'tia-adelia',
    label: 'Tia Adélia',
    desc: 'Tom coloquial e carinhoso; dicas práticas rápidas.',
  },
  { id: 'eng-agronomo', label: 'Eng. Agrónomo', desc: 'Preciso, técnico, com justificações.' },
  { id: 'mestre-horta', label: 'Mestre Horta', desc: 'Hands-on, truques de campo e calendários.' },
  {
    id: 'professor-paciente',
    label: 'Professor Paciente',
    desc: 'Explicações passo-a-passo e pedagógicas.',
  },
];

const RANGES: { id: ReportRange; label: string }[] = [
  { id: '1w', label: '1 semana' },
  { id: '2w', label: '2 semanas' },
  { id: '1m', label: '1 mês' },
  { id: 'all', label: 'Sempre' },
];

export default function SettingsPage() {
  const { settings, save } = useSettings();
  useApplyTheme(settings.theme);

  // helpers
  const setLocale = (v: Settings['locale']) => save({ locale: v });
  const setTheme = (v: Settings['theme']) => save({ theme: v });
  const setAI = (v: AIProfile) => save({ aiProfile: v } as Partial<Settings>);
  const setRange = (v: ReportRange) => save({ reportRange: v } as Partial<Settings>);

  // Gerar relatório (cliente): exemplo simples a ler de localStorage "taskLog"
  const onGenerateReport = React.useCallback(() => {
    const range = settings.reportRange ?? '1w';
    let data: unknown = [];
    try {
      // Se tiveres API, troca por:
      // await fetch(`/api/report?range=${range}`).then(r => r.json())
      const raw = localStorage.getItem('taskLog'); // opcional: [{date, action, crop, zone}, ...]
      data = raw ? JSON.parse(raw) : [];
    } catch (err) {
      // silenciar erro de parse/localStorage sem violar no-empty
      void err;
    }
    const payload = {
      generatedAt: new Date().toISOString(),
      range,
      locale: settings.locale,
      items: data,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `relatorio-tarefas-${range}-${new Date().toISOString().slice(0, 10)}.json`,
    });
    a.click();
    URL.revokeObjectURL(url);
  }, [settings.reportRange, settings.locale]);

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <header className="flex items-center justify-between">
        <h1 className="inline-flex items-center gap-2 text-xl font-semibold">
          <Settings2 className="h-5 w-5" /> Definições
        </h1>
      </header>

      {/* Idioma */}
      <section className="space-y-3 rounded-xl border bg-white p-4">
        <h2 className="inline-flex items-center gap-2 font-medium">
          <Globe className="h-4 w-4" /> Idioma
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: 'pt-PT', label: 'Português (PT)' },
            { v: 'en-US', label: 'English (US)' },
          ].map((opt) => (
            <button
              key={opt.v}
              onClick={() => setLocale(opt.v as Settings['locale'])}
              className={`rounded-lg border px-3 py-2 text-sm ${settings.locale === opt.v ? 'border-gray-300 bg-gray-100' : 'bg-white hover:bg-gray-50'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Tema */}
      <section className="space-y-3 rounded-xl border bg-white p-4">
        <h2 className="inline-flex items-center gap-2 font-medium">Tema</h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: 'system', label: 'Sistema', icon: <Laptop className="h-4 w-4" /> },
            { v: 'light', label: 'Claro', icon: <Sun className="h-4 w-4" /> },
            { v: 'dark', label: 'Escuro', icon: <Moon className="h-4 w-4" /> },
          ].map((opt) => (
            <button
              key={opt.v}
              onClick={() => setTheme(opt.v as Settings['theme'])}
              className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm ${settings.theme === opt.v ? 'border-gray-300 bg-gray-100' : 'bg-white hover:bg-gray-50'}`}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Perfil de IA */}
      <section className="space-y-3 rounded-xl border bg-white p-4">
        <h2 className="inline-flex items-center gap-2 font-medium">
          <Bot className="h-4 w-4" /> Perfil de IA
        </h2>
        <div className="grid gap-2">
          {AI_PROFILES.map((p) => (
            <label
              key={p.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-gray-50"
            >
              <input
                type="radio"
                name="aiProfile"
                checked={(settings.aiProfile ?? DEFAULT_SETTINGS.aiProfile) === p.id}
                onChange={() => setAI(p.id)}
                className="mt-1"
              />
              <div>
                <div className="text-sm font-medium">{p.label}</div>
                <div className="text-xs text-gray-600">{p.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Relatório de tarefas */}
      <section className="space-y-3 rounded-xl border bg-white p-4">
        <h2 className="inline-flex items-center gap-2 font-medium">
          <FileText className="h-4 w-4" /> Relatório de tarefas
        </h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <select
            value={settings.reportRange ?? DEFAULT_SETTINGS.reportRange}
            onChange={(e) => setRange(e.target.value as ReportRange)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            {RANGES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <button
            onClick={onGenerateReport}
            className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            <Download className="h-4 w-4" /> Gerar relatório
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Dica: se já tiveres um endpoint, troca o gerador local por{' '}
          <code>fetch(&quot;/api/report?range=...&quot;)</code>.
        </p>
      </section>
    </main>
  );
}
