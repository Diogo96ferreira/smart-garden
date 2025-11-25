'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSettings } from '@/hooks/useSettings';
import { type Settings, DEFAULT_SETTINGS, type AIProfile, type ReportRange } from '@/lib/settings';
import { useTranslation } from '@/lib/useTranslation';
import { Settings2, Globe, Sun, Moon, Laptop, Bot, FileText, Download } from 'lucide-react';
import { LeafLoader } from '@/components/ui/Spinner';
import LogoutButton from '@/components/ui/LogoutButton';

function useApplyTheme(theme: Settings['theme']) {
  React.useEffect(() => {
    const root = document.documentElement;
    const sysDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const dark = theme === 'dark' || (theme === 'system' && sysDark);
    root.classList.toggle('dark', dark);
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    root.style.setProperty('color-scheme', dark ? 'dark' : 'light');
  }, [theme]);
}

export default function SettingsPage() {
  const { settings, save } = useSettings();
  useApplyTheme(settings.theme);

  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith('/en') ? 'en' : 'pt';
  const t = useTranslation(locale);
  const l = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };

  // Helpers
  const setTheme = (v: Settings['theme']) => save({ theme: v });
  const setAI = (v: AIProfile) => save({ aiProfile: v } as Partial<Settings>);
  const setRange = (v: ReportRange) => save({ reportRange: v } as Partial<Settings>);

  // Lightweight toast + busy state for report generation
  const [reportStatus, setReportStatus] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<null | { text: string; kind: 'success' | 'error' }>(
    null,
  );
  const showToast = (text: string, kind: 'success' | 'error' = 'success') => {
    setToast({ text, kind });
    window.setTimeout(() => setToast(null), 3000);
  };

  // Função para mudar idioma
  const handleChangeLanguage = (v: Settings['locale']) => {
    save({ locale: v });

    const nextLocale = v === 'en-US' ? 'en' : 'pt';
    const parts = pathname.split('/');
    if (parts[1] === 'pt' || parts[1] === 'en') {
      parts[1] = nextLocale;
    } else {
      parts.splice(1, 0, nextLocale);
    }

    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000`;

    router.push(parts.join('/'));
  };

  // Perfis de IA traduzidos
  const AI_PROFILES = [
    {
      id: 'tia-adelia',
      label: l('ai.profiles.tia-adelia.label', locale === 'en' ? 'Aunt Adelia' : 'Tia Adélia'),
      desc: l(
        'ai.profiles.tia-adelia.desc',
        locale === 'en'
          ? 'Practical advice in simple language.'
          : 'Conselhos práticos em linguagem simples.',
      ),
    },
    {
      id: 'eng-pedro',
      label: l(
        'ai.profiles.eng-pedro.label',
        locale === 'en' ? 'Engineer Pedro' : 'Engenheiro Pedro',
      ),
      desc: l(
        'ai.profiles.eng-pedro.desc',
        locale === 'en'
          ? 'Professional tone with objective recommendations.'
          : 'Tom profissional e recomendações objetivas.',
      ),
    },
    {
      id: 'diogo-campos',
      label: l('ai.profiles.diogo-campos.label', 'Diogo Campos'),
      desc: l(
        'ai.profiles.diogo-campos.desc',
        locale === 'en' ? 'Friendly and accessible tips.' : 'Leve e simpático, dicas acessíveis.',
      ),
    },
    {
      id: 'agro-core',
      label: l('ai.profiles.agro-core.label', 'AGRO-CORE v1.0'),
      desc: l(
        'ai.profiles.agro-core.desc',
        locale === 'en' ? 'Objective, concise analysis.' : 'Análise objetiva e concisa.',
      ),
    },
  ];

  const RANGES = [
    { id: '1w', label: t('settings.report.range.1w') },
    { id: '2w', label: t('settings.report.range.2w') },
    { id: '1m', label: t('settings.report.range.1m') },
    { id: 'all', label: t('settings.report.range.all') },
  ];

  const onGenerateReport = React.useCallback(async () => {
    const range = settings.reportRange ?? '1m';
    const days = range === '1w' ? 7 : range === '2w' ? 14 : range === '1m' ? 31 : 31;
    const loc = settings.locale === 'en-US' ? 'en' : 'pt';

    // 1) Ensure tasks exist in DB for the chosen window using the existing generator
    setReportStatus(locale === 'en' ? 'Generating tasks...' : 'A gerar tarefas...');
    try {
      let location: { distrito?: string; municipio?: string } | undefined;
      try {
        const rawUL = localStorage.getItem('userLocation');
        if (rawUL) location = JSON.parse(rawUL);
      } catch {}
      if (!location) {
        try {
          const raw = localStorage.getItem('garden.settings.v1');
          if (raw) {
            const s = JSON.parse(raw) as {
              userLocation?: { distrito?: string; municipio?: string };
            };
            location = s.userLocation;
          }
        } catch {}
      }
      const res = await fetch('/api/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale: loc,
          location: location ?? null,
          horizonDays: days,
          resetAll: false,
        }),
      });
      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { inserted?: number };
        const inserted = Number(data?.inserted ?? 0);
        if (inserted > 0) {
          showToast(
            loc === 'en'
              ? `Added ${inserted} task(s) to your plan.`
              : `Adicionadas ${inserted} tarefa(s) ao teu plano.`,
            'success',
          );
        }
      } else if (res.status === 401) {
        showToast(
          loc === 'en'
            ? 'Please sign in to generate the report.'
            : 'Inicia sessão para gerar o relatório.',
          'error',
        );
        setReportStatus(null);
        return;
      }
    } catch {
      // If generation fails, still try to export whatever exists
    }

    // 2) Download the PDF built from DB tasks for the selected range
    setReportStatus(locale === 'en' ? 'Generating PDF...' : 'A criar PDF...');
    const locParam = location ? `&location=${encodeURIComponent(JSON.stringify(location))}` : '';
    const url = `/api/report?rangeDays=${days}&locale=${loc}&format=pdf&source=db${locParam}`;
    try {
      const resp = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/pdf' },
        credentials: 'same-origin',
      });
      if (!resp.ok) {
        if (resp.status === 401) {
          showToast(
            loc === 'en'
              ? 'Please sign in to download the report.'
              : 'Inicia sessão para descarregar o relatório.',
            'error',
          );
        } else {
          let errorMsg = '';
          try {
            const errorData = await resp.json();
            errorMsg = errorData.error;
          } catch {}

          showToast(
            errorMsg || (loc === 'en' ? 'Failed to generate report.' : 'Falha ao gerar relatório.'),
            'error',
          );
        }
        setReportStatus(null);
        return;
      }
      const ct = resp.headers.get('content-type') || '';
      if (!ct.includes('application/pdf')) {
        // Try to read error message
        let message = '';
        try {
          const j = (await resp.json()) as { error?: string };
          message = j?.error || '';
        } catch {}
        showToast(
          message ||
            (loc === 'en'
              ? 'Report not available right now.'
              : 'Relatório indisponível de momento.'),
          'error',
        );
        setReportStatus(null);
        return;
      }
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const filename = `smart-garden-report-${new Date().toISOString().slice(0, 10)}-${days}d.pdf`;
      const a = Object.assign(document.createElement('a'), { href: blobUrl, download: filename });
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      showToast(
        loc === 'en' ? 'Network error generating report.' : 'Erro de rede ao gerar relatório.',
        'error',
      );
    }
    setReportStatus(null);
  }, [settings.reportRange, settings.locale]);

  const onGenerateMonthPlan = React.useCallback(async () => {
    try {
      let location: { distrito?: string; municipio?: string } | undefined;
      try {
        const rawUL = localStorage.getItem('userLocation');
        if (rawUL) location = JSON.parse(rawUL);
      } catch {}
      if (!location) {
        try {
          const raw = localStorage.getItem('garden.settings.v1');
          if (raw) {
            const s = JSON.parse(raw) as {
              userLocation?: { distrito?: string; municipio?: string };
            };
            location = s.userLocation;
          }
        } catch {}
      }
      await fetch('/api/plan-month', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale: settings.locale === 'en-US' ? 'en' : 'pt',
          location: location ?? null,
          resetAll: false,
        }),
      });
    } catch {}
  }, [settings.locale]);

  // Removed separate DB report button; report uses dropdown + source=db

  return (
    <main
      className="mx-auto max-w-6xl p-4 text-[color:var(--color-text)] sm:p-6"
      aria-busy={!!reportStatus}
    >
      <header className="mb-6 flex items-center justify-between sm:mb-8">
        <h1 className="inline-flex items-center gap-2 text-xl font-semibold">
          <Settings2 className="h-5 w-5" /> {t('settings.title')}
        </h1>
        <LogoutButton />
      </header>
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          {/* Tema */}
          <section className="space-y-3 rounded-xl bg-[var(--color-surface)] p-4 shadow-sm">
            <h2 className="inline-flex items-center gap-2 pb-2 font-medium">
              {t('settings.theme')}
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  v: 'system',
                  label: t('settings.themeOptions.system'),
                  icon: <Laptop className="h-4 w-4" />,
                },
                {
                  v: 'light',
                  label: t('settings.themeOptions.light'),
                  icon: <Sun className="h-4 w-4" />,
                },
                {
                  v: 'dark',
                  label: t('settings.themeOptions.dark'),
                  icon: <Moon className="h-4 w-4" />,
                },
              ].map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => setTheme(opt.v as Settings['theme'])}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm shadow-sm ${
                    settings.theme === opt.v
                      ? 'bg-[var(--color-surface-muted)]'
                      : 'bg-[var(--color-surface)] hover:bg-[color:var(--color-surface-muted)]'
                  }`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* Idioma */}
          <section className="space-y-3 rounded-xl bg-[var(--color-surface)] p-4 shadow-sm">
            <h2 className="inline-flex items-center gap-2 pb-2 font-medium">
              <Globe className="h-4 w-4" /> {t('settings.language')}
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:max-w-md">
              <button
                onClick={() => handleChangeLanguage('pt-PT')}
                className={`rounded-lg px-3 py-2 text-sm shadow-sm ${
                  (settings.locale ?? DEFAULT_SETTINGS.locale) === 'pt-PT'
                    ? 'bg-[var(--color-surface-muted)]'
                    : 'bg-[var(--color-surface)] hover:bg-[color:var(--color-surface-muted)]'
                }`}
              >
                {t('settings.languageOptions.pt')}
              </button>
              <button
                onClick={() => handleChangeLanguage('en-US')}
                className={`rounded-lg px-3 py-2 text-sm shadow-sm ${
                  (settings.locale ?? DEFAULT_SETTINGS.locale) === 'en-US'
                    ? 'bg-[var(--color-surface-muted)]'
                    : 'bg-[var(--color-surface)] hover:bg-[color:var(--color-surface-muted)]'
                }`}
              >
                {t('settings.languageOptions.en')}
              </button>
            </div>
          </section>

          {/* Perfil de IA */}
          <section className="space-y-3 rounded-xl bg-[var(--color-surface)] p-4 shadow-sm">
            <h2 className="inline-flex items-center gap-2 pb-2 font-medium">
              <Bot className="h-4 w-4" /> {t('ai.title')}
            </h2>
            <div className="grid gap-4">
              {AI_PROFILES.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-start gap-3 rounded-sm p-3 shadow-sm hover:bg-[color:var(--color-surface-muted)]"
                >
                  <input
                    type="radio"
                    name="aiProfile"
                    checked={(settings.aiProfile ?? DEFAULT_SETTINGS.aiProfile) === p.id}
                    onChange={() => setAI(p.id as AIProfile)}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-sm font-medium">{p.label}</div>
                    <div className="text-xs text-[color:var(--color-text-muted)]">{p.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Relatório de tarefas */}
          <section className="space-y-3 rounded-xl bg-[var(--color-surface)] p-4 shadow-sm">
            <h2 className="inline-flex items-center gap-2 pb-2 font-medium">
              <FileText className="h-4 w-4" /> {t('settings.report.title')}
            </h2>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <select
                value={settings.reportRange ?? DEFAULT_SETTINGS.reportRange}
                onChange={(e) => setRange(e.target.value as ReportRange)}
                className="rounded-lg border border-[color:var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] shadow-sm"
              >
                {RANGES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
              <button
                onClick={onGenerateReport}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-surface)] px-3 py-2 text-sm shadow-sm hover:bg-[color:var(--color-surface-muted)]"
                disabled={!!reportStatus}
                aria-busy={!!reportStatus}
              >
                <Download className="h-4 w-4" />
                {reportStatus
                  ? locale === 'en'
                    ? 'Processing...'
                    : 'A processar...'
                  : t('settings.report.generate')}
              </button>
            </div>
            {/* No extra buttons — generation is triggered by the report button above */}
          </section>
          {toast && (
            <div
              role="status"
              className={`fixed right-6 bottom-6 z-[120] rounded-lg border px-4 py-2 text-sm shadow-lg ${
                toast.kind === 'success'
                  ? 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {toast.text}
            </div>
          )}
        </div>
        <div className="space-y-6 self-start lg:sticky lg:top-24"></div>
      </div>

      {reportStatus && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/20">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl">
            <LeafLoader label={reportStatus} />
          </div>
        </div>
      )}
    </main>
  );
}
