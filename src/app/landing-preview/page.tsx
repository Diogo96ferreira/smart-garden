'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  Camera,
  CloudSun,
  Droplets,
  ListChecks,
  LogIn,
  MapPinned,
  ShieldCheck,
  Sparkles,
  Sprout,
} from 'lucide-react';
import type { Variants } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Lang = 'pt' | 'en';
type LandingCopy = {
  brand: string;
  navLogin: string;
  title: string;
  desc: string;
  ctaPrimary: string;
  ctaSecondary: string;
  imageAlt: string;
  stats: { label: string; value: string }[];
  benefits: { icon: LucideIcon; title: string; desc: string }[];
  workflowEyebrow: string;
  workflowTitle: string;
  workflowDesc: string;
  workflow: { title: string; desc: string }[];
  intelligenceEyebrow: string;
  intelligenceTitle: string;
  intelligenceDesc: string;
  intelligence: { icon: LucideIcon; title: string; desc: string }[];
  closingTitle: string;
  closingDesc: string;
};

const copy = {
  pt: {
    brand: 'Smart Garden',
    navLogin: 'Entrar',
    title: 'A tua horta, mais simples de acompanhar.',
    desc: 'Planeia tarefas, ajusta a rega ao clima e pede ajuda por foto quando uma planta dá sinais de stress.',
    ctaPrimary: 'Entrar',
    ctaSecondary: 'Criar conta',
    imageAlt: 'Pré-visualização da Smart Garden numa horta com suporte de IA',
    stats: [
      { label: 'Rega', value: 'Hoje não precisa' },
      { label: 'Semana', value: '3 tarefas' },
      { label: 'IA', value: 'Foto pronta' },
    ],
    benefits: [
      {
        icon: Droplets,
        title: 'Rega com contexto',
        desc: 'A chuva e a temperatura ajudam a decidir quando regar.',
      },
      {
        icon: CalendarCheck,
        title: 'Plano curto',
        desc: 'Só as tarefas que interessam esta semana, sem listas infinitas.',
      },
      {
        icon: Camera,
        title: 'Ajuda por foto',
        desc: 'Mostra uma folha, praga ou dúvida e recebe próximos passos claros.',
      },
    ],
    workflowEyebrow: 'Como funciona',
    workflowTitle: 'Da configuração ao cuidado diário',
    workflowDesc:
      'A Smart Garden organiza a informação da tua horta e transforma-a em ações pequenas, fáceis de seguir.',
    workflow: [
      {
        title: 'Define o espaço',
        desc: 'Adiciona localização, zonas, exposição solar e as plantas que já tens.',
      },
      {
        title: 'Recebe o plano',
        desc: 'A app cruza clima, calendário e necessidades das plantas para sugerir prioridades.',
      },
      {
        title: 'Acompanha sinais',
        desc: 'Usa fotos e notas para perceber stress, pragas ou mudanças no crescimento.',
      },
      {
        title: 'Ajusta a rotina',
        desc: 'Marca tarefas feitas e deixa o plano adaptar-se à semana seguinte.',
      },
    ],
    intelligenceEyebrow: 'O que acompanha',
    intelligenceTitle: 'Mais detalhe onde faz diferença',
    intelligenceDesc:
      'Sem dashboards complicados: só os sinais que ajudam a decidir melhor antes de regar, podar ou tratar.',
    intelligence: [
      {
        icon: CloudSun,
        title: 'Clima local',
        desc: 'Chuva recente, temperatura e previsão entram no cálculo da rega.',
      },
      {
        icon: MapPinned,
        title: 'Zonas da horta',
        desc: 'Separa vasos, canteiros e áreas com sol diferente para recomendações mais úteis.',
      },
      {
        icon: Bot,
        title: 'Tia Adélia',
        desc: 'Um apoio por IA para interpretar fotos e transformar dúvidas em próximos passos.',
      },
      {
        icon: ShieldCheck,
        title: 'Prevenção',
        desc: 'Alertas simples ajudam a agir antes de uma folha amarela virar problema maior.',
      },
    ],
    closingTitle: 'Começa com a tua horta atual.',
    closingDesc: 'Configura as plantas, a localização e deixa a Smart Garden organizar o resto.',
  },
  en: {
    brand: 'Smart Garden',
    navLogin: 'Sign in',
    title: 'Your garden, easier to keep on track.',
    desc: 'Plan tasks, adapt watering to the weather and get photo support when a plant shows signs of stress.',
    ctaPrimary: 'Sign in',
    ctaSecondary: 'Create account',
    imageAlt: 'Smart Garden preview in a vegetable garden with AI support',
    stats: [
      { label: 'Watering', value: 'Skip today' },
      { label: 'Week', value: '3 tasks' },
      { label: 'AI', value: 'Photo ready' },
    ],
    benefits: [
      {
        icon: Droplets,
        title: 'Weather-aware watering',
        desc: 'Rain and temperature help decide when watering is actually needed.',
      },
      {
        icon: CalendarCheck,
        title: 'Short plan',
        desc: 'Only the tasks that matter this week, without endless lists.',
      },
      {
        icon: Camera,
        title: 'Photo support',
        desc: 'Show a leaf, pest or doubt and get clear next steps.',
      },
    ],
    workflowEyebrow: 'How it works',
    workflowTitle: 'From setup to daily care',
    workflowDesc:
      'Smart Garden organizes your garden context and turns it into small actions that are easy to follow.',
    workflow: [
      {
        title: 'Map the space',
        desc: 'Add location, zones, sun exposure and the plants you already grow.',
      },
      {
        title: 'Get the plan',
        desc: 'The app combines weather, calendar and plant needs to suggest priorities.',
      },
      {
        title: 'Track signals',
        desc: 'Use photos and notes to understand stress, pests or growth changes.',
      },
      {
        title: 'Tune the routine',
        desc: 'Check off completed tasks and let the plan adapt for the next week.',
      },
    ],
    intelligenceEyebrow: 'What it tracks',
    intelligenceTitle: 'More detail where it matters',
    intelligenceDesc:
      'No complicated dashboards: only the signals that help you decide before watering, pruning or treating.',
    intelligence: [
      {
        icon: CloudSun,
        title: 'Local weather',
        desc: 'Recent rain, temperature and forecast feed into watering decisions.',
      },
      {
        icon: MapPinned,
        title: 'Garden zones',
        desc: 'Split pots, beds and different sun areas for more useful recommendations.',
      },
      {
        icon: Bot,
        title: 'Tia Adelia',
        desc: 'AI support to interpret photos and turn doubts into clear next steps.',
      },
      {
        icon: ShieldCheck,
        title: 'Prevention',
        desc: 'Simple alerts help you act before one yellow leaf becomes a bigger issue.',
      },
    ],
    closingTitle: 'Start with the garden you already have.',
    closingDesc: 'Set your plants and location, then let Smart Garden organize the rest.',
  },
} satisfies Record<Lang, LandingCopy>;

const heroCopy: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: 'easeOut', staggerChildren: 0.08 },
  },
};

const itemReveal: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.62, ease: 'easeOut' } },
};

export default function LandingPreviewPage({ initialLang = 'pt' }: { initialLang?: Lang }) {
  const router = useRouter();
  const pageRef = useRef<HTMLElement>(null);
  const [lang, setLang] = useState<Lang>(initialLang);
  const content = useMemo(() => copy[lang], [lang]);
  const onboardingPath = `/${lang}/onboarding`;

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 90, damping: 18, mass: 0.4 });
  const smoothY = useSpring(pointerY, { stiffness: 90, damping: 18, mass: 0.4 });
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [7, -7]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-9, 9]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const ctx = gsap.context(() => {
      gsap.to('.gsap-leaf', {
        y: 'random(-18, 18)',
        x: 'random(-10, 10)',
        rotate: 'random(-12, 12)',
        duration: 'random(3.4, 5.2)',
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        stagger: 0.18,
      });

      gsap.to('.gsap-sheen', {
        xPercent: 135,
        duration: 2.4,
        ease: 'power2.inOut',
        repeat: -1,
        repeatDelay: 2.2,
      });

      gsap.fromTo(
        '.gsap-benefit, .gsap-flow-card, .gsap-intel-card',
        { opacity: 0, y: 42, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.75,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: {
            trigger: '.gsap-benefits',
            start: 'top 78%',
          },
        },
      );

      gsap.fromTo(
        '.gsap-flow-line',
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.gsap-workflow',
            start: 'top 72%',
          },
        },
      );

      gsap.to('.gsap-cta', {
        y: -22,
        scrollTrigger: {
          trigger: '.gsap-cta',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  const goSignIn = () => router.push(`/signin?next=${encodeURIComponent(onboardingPath)}`);
  const goSignUp = () => router.push(`/signup?next=${encodeURIComponent(onboardingPath)}`);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  };

  const resetPointer = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <main
      ref={pageRef}
      className="relative min-h-screen overflow-hidden bg-[var(--color-background)] text-[var(--color-text)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            'linear-gradient(120deg, rgba(76,107,58,0.12), transparent 26%, rgba(247,245,232,0.92) 52%, rgba(59,130,246,0.1))',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-45"
        style={{
          backgroundImage:
            'repeating-linear-gradient(100deg, rgba(44,74,40,0.16) 0 1px, transparent 1px 72px)',
          maskImage: 'linear-gradient(to bottom, black, transparent)',
        }}
      />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="flex items-center gap-3"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--color-primary)] text-white shadow-lg shadow-green-900/15">
            <Sprout aria-hidden className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-semibold">{content.brand}</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="flex items-center gap-2 sm:gap-3"
        >
          <div className="inline-flex rounded-full border border-[var(--color-border)] bg-white/70 p-1 text-xs font-semibold shadow-sm backdrop-blur-xl">
            {(['pt', 'en'] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`h-8 rounded-full px-3 transition ${
                  lang === l
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
                aria-pressed={lang === l}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<LogIn className="h-4 w-4" aria-hidden />}
            onClick={goSignIn}
            className="hidden sm:inline-flex"
          >
            {content.navLogin}
          </Button>
        </motion.div>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100svh-80px)] w-full max-w-6xl items-center gap-10 px-5 pt-4 pb-12 sm:px-8 lg:grid-cols-[0.92fr_1.08fr]">
        <motion.div
          variants={heroCopy}
          initial="hidden"
          animate="show"
          className="max-w-2xl space-y-7"
        >
          <div className="space-y-4">
            <motion.p
              variants={itemReveal}
              className="eyebrow inline-flex items-center gap-2 text-[var(--color-primary-strong)]"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              {content.brand}
            </motion.p>
            <motion.h1
              variants={itemReveal}
              className="text-display text-4xl leading-tight sm:text-5xl lg:text-6xl"
            >
              {content.title}
            </motion.h1>
            <motion.p
              variants={itemReveal}
              className="max-w-xl text-base text-[var(--color-text-muted)] sm:text-lg"
            >
              {content.desc}
            </motion.p>
          </div>

          <motion.div variants={itemReveal} className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              icon={<LogIn className="h-5 w-5" aria-hidden />}
              onClick={goSignIn}
              className="w-full sm:w-auto"
            >
              {content.ctaPrimary}
            </Button>
            <Button
              size="lg"
              variant="outline"
              icon={<ArrowRight className="h-5 w-5" aria-hidden />}
              onClick={goSignUp}
              className="w-full bg-white/72 backdrop-blur-xl sm:w-auto"
            >
              {content.ctaSecondary}
            </Button>
          </motion.div>

          <motion.dl variants={itemReveal} className="grid gap-3 sm:grid-cols-3">
            {content.stats.map((item, index) => (
              <motion.div
                key={item.label}
                whileHover={{ y: -5, scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                className="rounded-2xl border border-white/70 bg-white/74 p-4 shadow-sm backdrop-blur-xl"
              >
                <dt className="text-xs font-semibold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
                  {item.label}
                </dt>
                <dd className="mt-1 text-sm font-semibold sm:text-base">{item.value}</dd>
                <span
                  aria-hidden
                  className="mt-3 block h-1 rounded-full bg-[var(--color-primary-soft)]"
                >
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: `${62 + index * 13}%` }}
                    transition={{ delay: 0.7 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
                    className="block h-full rounded-full bg-[var(--color-primary)]"
                  />
                </span>
              </motion.div>
            ))}
          </motion.dl>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.18, ease: 'easeOut' }}
          className="relative"
          onPointerMove={handlePointerMove}
          onPointerLeave={resetPointer}
          style={{ perspective: 1100 }}
        >
          <motion.div
            className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/72 shadow-[0_28px_80px_rgba(44,74,40,0.22)] backdrop-blur-xl"
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
          >
            <Image
              src="/onboarding/tia-smart.png"
              alt={content.imageAlt}
              width={1536}
              height={1024}
              priority
              className="aspect-[4/3] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/18 via-transparent to-white/18" />
            <div className="gsap-sheen absolute inset-y-0 -left-2/3 w-1/2 -skew-x-12 bg-white/24 blur-md" />
            <div className="absolute right-4 bottom-4 left-4 grid gap-3 rounded-2xl border border-white/50 bg-white/72 p-4 shadow-xl backdrop-blur-2xl sm:right-6 sm:bottom-6 sm:left-auto sm:w-72">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--color-primary-strong)]">
                  Smart check
                </span>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.85)]" />
              </div>
              <div className="space-y-2">
                <span className="block h-2 rounded-full bg-[var(--color-primary-soft)]" />
                <span className="block h-2 w-3/4 rounded-full bg-[var(--color-primary-soft)]" />
              </div>
            </div>
          </motion.div>

          {Array.from({ length: 7 }).map((_, index) => (
            <span
              key={index}
              aria-hidden
              className="gsap-leaf absolute hidden h-7 w-4 rounded-[80%_0_80%_0] bg-[var(--color-primary)] opacity-75 shadow-lg shadow-green-900/10 sm:block"
              style={{
                top: `${10 + ((index * 17) % 70)}%`,
                left: index % 2 === 0 ? `${-2 - index}%` : `${90 + index}%`,
                transform: `rotate(${index * 24}deg)`,
              }}
            />
          ))}
        </motion.div>
      </section>

      <section className="gsap-benefits relative z-10 border-y border-white/70 bg-white/66 px-5 py-12 backdrop-blur-xl sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          {content.benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <motion.article
                key={benefit.title}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="gsap-benefit group relative overflow-hidden rounded-2xl border border-white/70 bg-[var(--color-background)]/80 p-5 shadow-sm"
              >
                <span className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent opacity-0 transition group-hover:opacity-70" />
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)] transition group-hover:scale-110">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="mt-4 space-y-1">
                  <h2 className="text-lg font-semibold">{benefit.title}</h2>
                  <p className="text-sm leading-6 text-[var(--color-text-muted)]">{benefit.desc}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="gsap-workflow relative z-10 px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
              className="space-y-3"
            >
              <p className="eyebrow text-[var(--color-primary-strong)]">
                {content.workflowEyebrow}
              </p>
              <h2 className="text-display text-3xl leading-tight sm:text-4xl">
                {content.workflowTitle}
              </h2>
              <p className="max-w-xl text-sm leading-6 text-[var(--color-text-muted)] sm:text-base">
                {content.workflowDesc}
              </p>
            </motion.div>

            <div className="relative grid gap-4">
              <span
                aria-hidden
                className="gsap-flow-line absolute top-8 right-8 left-8 hidden h-px origin-left bg-[var(--color-primary)]/35 md:block"
              />
              <div className="grid gap-4 md:grid-cols-4">
                {content.workflow.map((step, index) => (
                  <motion.article
                    key={step.title}
                    whileHover={{ y: -6 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="gsap-flow-card relative rounded-2xl border border-white/70 bg-white/72 p-5 shadow-sm backdrop-blur-xl"
                  >
                    <span className="mb-5 grid h-10 w-10 place-items-center rounded-full bg-[var(--color-primary)] text-sm font-bold text-white shadow-lg shadow-green-900/15">
                      {index + 1}
                    </span>
                    <h3 className="text-base font-semibold">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                      {step.desc}
                    </p>
                  </motion.article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 py-14 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 rounded-[28px] border border-white/70 bg-white/58 p-6 shadow-[var(--shadow-soft)] backdrop-blur-xl sm:p-8 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="space-y-4"
          >
            <p className="eyebrow text-[var(--color-primary-strong)]">
              {content.intelligenceEyebrow}
            </p>
            <h2 className="text-display text-3xl leading-tight sm:text-4xl">
              {content.intelligenceTitle}
            </h2>
            <p className="max-w-xl text-sm leading-6 text-[var(--color-text-muted)] sm:text-base">
              {content.intelligenceDesc}
            </p>
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-soft)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-strong)]">
              <ListChecks className="h-4 w-4" aria-hidden />
              Smart Garden
            </div>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            {content.intelligence.map((item) => {
              const Icon = item.icon;
              return (
                <motion.article
                  key={item.title}
                  whileHover={{ y: -7, scale: 1.015 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                  className="gsap-intel-card rounded-2xl border border-white/70 bg-[var(--color-background)]/78 p-5"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-[var(--color-primary-strong)] shadow-sm">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                    {item.desc}
                  </p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 py-12 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="gsap-cta mx-auto flex max-w-6xl flex-col items-start justify-between gap-5 overflow-hidden rounded-[28px] bg-[var(--color-primary-strong)] p-6 text-white shadow-[0_28px_70px_rgba(44,74,40,0.28)] sm:p-8 md:flex-row md:items-center"
        >
          <div className="relative z-10 max-w-2xl space-y-2">
            <h2 className="text-2xl font-semibold sm:text-3xl">{content.closingTitle}</h2>
            <p className="text-sm leading-6 text-white/78 sm:text-base">{content.closingDesc}</p>
          </div>
          <Button
            size="lg"
            variant="secondary"
            icon={<ArrowRight className="h-5 w-5" aria-hidden />}
            onClick={goSignUp}
            className="relative z-10 w-full shrink-0 bg-white text-[var(--color-primary-strong)] hover:bg-[var(--color-primary-soft)] sm:w-auto"
          >
            {content.ctaSecondary}
          </Button>
        </motion.div>
      </section>
    </main>
  );
}
