'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSettings } from '@/hooks/useSettings';
import { type Settings, DEFAULT_SETTINGS, type AIProfile, type ReportRange } from '@/lib/settings';
import { useTranslation } from '@/lib/useTranslation';
import { Settings2, Globe, Sun, Moon, Laptop, Bot, FileText, Download } from 'lucide-react';
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

  // âœ… FunÃ§Ã£o para mudar idioma
  const handleChangeLanguage = (v: Settings['locale']) => {
    save({ locale: v });

    const nextLocale = v === 'en-US' ? 'en' : 'pt';
    const parts = pathname.split('/');
    if (parts[1] === 'pt' || parts[1] === 'en') {
      parts[1] = nextLocale;
    } else {
      parts.splice(1, 0, nextLocale);
    }

    // (Opcional) persistir cookie
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000`;

    router.push(parts.join('/'));
  };

  // Perfis de IA traduzidos
  const AI_PROFILES = [
    {
      id: 'tia-adelia',
      label: l('ai.profiles.tia-adelia.label', locale === 'en' ? 'Aunt Adelia' : 'Tia AdÃ©lia'),
      desc: l(
        'ai.profiles.tia-adelia.desc',
        locale === 'en'
          ? 'Practical advice in simple language.'
          : 'Conselhos prÃ¡ticos em linguagem simples.',
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
          : 'Tom profissional e recomendaÃ§Ãµes objetivas.',
      ),
    },
    {
      id: 'diogo-campos',
      label: l('ai.profiles.diogo-campos.label', 'Diogo Campos'),
      desc: l(
        'ai.profiles.diogo-campos.desc',
        locale === 'en' ? 'Friendly and accessible tips.' : 'Leve e simpÃ¡tico, dicas acessÃ­veis.',
      ),
    },
    {
      id: 'agro-core',
      label: l('ai.profiles.agro-core.label', 'AGRO-CORE v1.0'),
      desc: l(
        'ai.profiles.agro-core.desc',
        locale === 'en' ? 'Objective, concise analysis.' : 'AnÃ¡lise objetiva e concisa.',
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
    const url = `/api/report?rangeDays=${days}&locale=${settings.locale === 'en-US' ? 'en' : 'pt'}&format=pdf`;
    const a = Object.assign(document.createElement('a'), { href: url, download: '' });
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [settings.reportRange, settings.locale]);

  return (
    <main className="mx-auto max-w-6xl p-4 text-[color:var(--color-text)] sm:p-6">
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

          {/* RelatÃ³rio de tarefas */}
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
              >
                <Download className="h-4 w-4" /> {t('settings.report.generate')}
              </button>
            </div>
          </section>
        </div>
        <div className="space-y-6 self-start lg:sticky lg:top-24">{/* Perfil de IA */}</div>
      </div>
    </main>
  );
}
