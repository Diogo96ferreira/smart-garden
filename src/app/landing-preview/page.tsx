'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Lang = 'pt' | 'en';

const copy = {
  pt: {
    eyebrow: 'Smart Garden',
    title: 'Rega inteligente, plano simples e apoio por foto',
    desc: 'A Smart Garden ajuda-te a cuidar da tua horta com rega automatica baseada no clima, tarefas semanais simples e apoio por foto com a nossa AI Tia Adelia.',
    ctaPrimary: 'Entrar',
    ctaSecondary: 'Criar conta',
    summaryTitle: 'Resumo da semana (exemplo)',
    summaryTag: 'Simples',
    summaryMetrics: [
      { label: 'Rega evitada', value: '-23%' },
      { label: 'Tarefas feitas', value: '5/7' },
      { label: 'Alertas AI', value: '1 resolvido' },
    ],
    panelTitle: 'Painel de exemplo',
    panelCards: [
      { label: 'Humidade solo', value: '61%', note: 'Zona segura, sem rega' },
      { label: 'Clima', value: 'Chuva ontem', note: 'Rega adiada 1 dia' },
      { label: 'Tarefa', value: 'Mulching', note: 'Prioridade alta' },
      { label: 'AI', value: 'Folha amarela', note: 'Tia Adelia: ajustar luz' },
    ],
    featuresEyebrow: 'O que vais ver',
    featuresTitle: 'Foco no essencial da Smart Garden',
    features: [
      {
        title: 'Rega com meteo',
        desc: 'Usa chuva, sol e temperatura para ajustar a rega e poupar agua.',
        tag: 'Clima',
      },
      {
        title: 'Plano semanal',
        desc: 'Tarefas simples e priorizadas para cuidar da horta sem stress.',
        tag: 'Rotina',
      },
      {
        title: 'Tia Adelia (AI)',
        desc: 'Fotografa a planta, recebe diagnostico rapido e passos seguintes.',
        tag: 'AI',
      },
    ],
    stepsEyebrow: 'Passo a passo',
    stepsTitle: 'Liga e comeca em minutos',
    steps: [
      { title: 'Configura a horta', desc: 'Define zonas, plantas e localizacao para o clima.' },
      { title: 'Segue o plano', desc: 'Ve as tarefas da semana e marca o que fizeres.' },
      { title: 'Confirma com foto', desc: 'Tira foto quando algo parecer errado e recebe dicas.' },
    ],
    nextEyebrow: 'Proximo passo',
    nextTitle: 'Pronto para começar a gerir a sua horta!',
    nextLogin: 'Ir para login e onboarding',
    nextSignup: 'Criar conta e continuar',
  },
  en: {
    eyebrow: 'Smart Garden',
    title: 'Smart watering, simple plan and photo support',
    desc: 'Smart Garden helps you care for your garden with weather-based watering, simple weekly tasks, and photo support with our AI Tia Adelia.',
    ctaPrimary: 'Sign in',
    ctaSecondary: 'Create account',
    summaryTitle: 'Weekly summary (example)',
    summaryTag: 'Simple',
    summaryMetrics: [
      { label: 'Watering avoided', value: '-23%' },
      { label: 'Tasks done', value: '5/7' },
      { label: 'AI alerts', value: '1 resolved' },
    ],
    panelTitle: 'Example panel',
    panelCards: [
      { label: 'Soil moisture', value: '61%', note: 'Safe zone, no watering' },
      { label: 'Weather', value: 'Rain yesterday', note: 'Watering delayed 1 day' },
      { label: 'Task', value: 'Mulching', note: 'High priority' },
      { label: 'AI', value: 'Yellow leaf', note: 'Tia Adelia: adjust light' },
    ],
    featuresEyebrow: 'What you will see',
    featuresTitle: 'Focus on Smart Garden essentials',
    features: [
      {
        title: 'Weather-based watering',
        desc: 'Uses rain, sun and temperature to adjust watering and save water.',
        tag: 'Weather',
      },
      {
        title: 'Weekly plan',
        desc: 'Simple, prioritized tasks to care for the garden without stress.',
        tag: 'Routine',
      },
      {
        title: 'Tia Adelia (AI)',
        desc: 'Take a photo, get quick diagnosis and next steps.',
        tag: 'AI',
      },
    ],
    stepsEyebrow: 'Step by step',
    stepsTitle: 'Connect and start in minutes',
    steps: [
      { title: 'Set up the garden', desc: 'Define zones, plants and location for weather.' },
      { title: 'Follow the plan', desc: 'See weekly tasks and check what you finish.' },
      { title: 'Confirm with photo', desc: 'Snap a photo when something seems off and get tips.' },
    ],
    nextEyebrow: 'Next step',
    nextTitle: 'Ready to start managing your garden!',
    nextLogin: 'Go to login and onboarding',
    nextSignup: 'Create account and continue',
  },
} satisfies Record<Lang, any>;

export default function LandingPreviewPage({ initialLang = 'pt' }: { initialLang?: Lang }) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>(initialLang);
  const content = useMemo(() => copy[lang], [lang]);
  const onboardingPath = `/${lang}/onboarding`;

  const goSignIn = () => router.push(`/signin?next=${encodeURIComponent(onboardingPath)}`);
  const goSignUp = () => router.push(`/signup?next=${encodeURIComponent(onboardingPath)}`);

  return (
    <main className="relative min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(74, 222, 128, 0.18), transparent 32%), radial-gradient(circle at 80% 0%, rgba(59, 130, 246, 0.16), transparent 30%), radial-gradient(circle at 60% 70%, rgba(16, 185, 129, 0.12), transparent 36%)',
        }}
      />

      <section className="relative overflow-hidden px-6 pt-12 pb-12 sm:px-12 sm:pt-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-5">
            <div className="flex items-center justify-between">
              <p className="eyebrow text-[var(--color-primary-strong)]">{content.eyebrow}</p>
              <div className="inline-flex overflow-hidden rounded-full border border-[var(--color-border)] text-sm">
                {(['pt', 'en'] as Lang[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLang(l)}
                    className={`px-3 py-1 ${
                      lang === l
                        ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-display text-4xl leading-tight sm:text-5xl">{content.title}</h1>
              <p className="max-w-xl text-lg text-[var(--color-text-muted)]">{content.desc}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={goSignIn}>
                {content.ctaPrimary}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[var(--color-border)]"
                onClick={goSignUp}
              >
                {content.ctaSecondary}
              </Button>
            </div>
            <Card className="max-w-xl border-[var(--color-border)] bg-[var(--color-surface)]">
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="text-base">{content.summaryTitle}</CardTitle>
                <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-primary-strong)]">
                  {content.summaryTag}
                </span>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                {content.summaryMetrics.map((item: { label: string; value: string }) => (
                  <Card
                    key={item.label}
                    className="border-[var(--color-border)] bg-[var(--color-background)] p-3"
                  >
                    <p className="text-xs text-[var(--color-text-muted)]">{item.label}</p>
                    <p className="text-lg font-semibold">{item.value}</p>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="relative flex-1">
            <Card className="relative overflow-hidden p-6 shadow-[var(--color-primary)]/15 shadow-2xl">
              <div className="mb-4 flex items-center justify-between text-sm text-[var(--color-text-muted)]">
                <span>{content.panelTitle}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {content.panelCards.map((card: { label: string; value: string; note: string }) => (
                  <Card
                    key={card.label}
                    className="border-[var(--color-border)] bg-black/80 p-4 text-white"
                  >
                    <p className="text-sm text-gray-300">{card.label}</p>
                    <p className="text-3xl font-semibold">{card.value}</p>
                    <p className="mt-2 text-xs text-gray-400">{card.note}</p>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="relative bg-[var(--color-surface)] px-6 py-12 sm:px-12">
        <div className="mx-auto max-w-6xl space-y-6">
          <div>
            <p className="eyebrow text-[var(--color-primary-strong)]">{content.featuresEyebrow}</p>
            <h2 className="text-3xl font-semibold">{content.featuresTitle}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {content.features.map((f: { title: string; desc: string; tag: string }) => (
              <Card
                key={f.title}
                className="group h-full bg-[var(--color-background)] transition hover:-translate-y-1 hover:border-[var(--color-primary)] hover:shadow-lg"
              >
                <CardHeader className="flex flex-row items-center justify-between text-sm text-[var(--color-primary-strong)]">
                  <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold">
                    {f.tag}
                  </span>
                  <span className="text-[var(--color-text-muted)]">Preview</span>
                </CardHeader>
                <CardContent>
                  <CardTitle className="mt-1 text-lg">{f.title}</CardTitle>
                  <CardDescription className="mt-2 text-sm">{f.desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-6 py-12 sm:px-12">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <p className="eyebrow text-[var(--color-primary-strong)]">{content.stepsEyebrow}</p>
            <h2 className="text-3xl font-semibold">{content.stepsTitle}</h2>
            <div className="space-y-4 pt-4">
              {content.steps.map((step: { title: string; desc: string }, idx: number) => (
                <Card key={step.title} className="flex gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary-soft)] text-base font-semibold text-[var(--color-primary-strong)]">
                    {idx + 1}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                    <CardDescription className="text-sm">{step.desc}</CardDescription>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="eyebrow text-[var(--color-primary-strong)]">{content.nextEyebrow}</p>
            <h2 className="text-3xl font-semibold">{content.nextTitle}</h2>
            <Card className="mt-4 space-y-4 p-5">
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" onClick={goSignIn} size="md">
                  {content.nextLogin}
                </Button>
                <Button
                  variant="outline"
                  className="border-[var(--color-border)]"
                  onClick={goSignUp}
                  size="md"
                >
                  {content.nextSignup}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
