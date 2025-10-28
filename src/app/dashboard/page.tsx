'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  AlarmClock,
  BadgeHelp,
  BellRing,
  Check,
  Droplets,
  Flower2,
  Leaf,
  LineChart,
  Sparkles,
  Sun,
  Thermometer,
} from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '@/lib/supabaseClient';

type Task = {
  id: number;
  title: string;
  description?: string | null;
  image?: string | null;
  created_at?: string;
};

const statusPalettes = [
  {
    accent: 'from-[#22c55e]/90 to-[#0ea5e9]/70',
    moisture: 72,
    sun: 'Luz filtrada',
    temperature: 21,
    status: 'Saudável',
    tip: 'Mantenha rega leve e constante.',
  },
  {
    accent: 'from-[#f97316]/80 to-[#fb7185]/70',
    moisture: 44,
    sun: 'Precisa de mais luz',
    temperature: 19,
    status: 'Atenção',
    tip: 'Roda o vaso para apanhar mais sol da manhã.',
  },
  {
    accent: 'from-[#14b8a6]/80 to-[#22d3ee]/70',
    moisture: 63,
    sun: 'Boa claridade',
    temperature: 22,
    status: 'Equilibrada',
    tip: 'Ideal para colher algumas folhas jovens.',
  },
  {
    accent: 'from-[#a855f7]/80 to-[#f472b6]/70',
    moisture: 58,
    sun: 'Precisa de sombra leve',
    temperature: 18,
    status: 'Serena',
    tip: 'Pulveriza as folhas ao fim do dia.',
  },
];

const notifications = [
  {
    icon: <BellRing className="h-5 w-5 text-emerald-600" />,
    title: 'Hortelã precisa de água 💧',
    description: 'Humidade abaixo do ideal há 6 horas.',
  },
  {
    icon: <Sun className="h-5 w-5 text-amber-500" />,
    title: 'Temperatura caiu 4°C 🌙',
    description: 'Cobrir as plantas jovens esta noite.',
  },
  {
    icon: <Sparkles className="h-5 w-5 text-sky-500" />,
    title: 'Nova dica da Tia Adélia',
    description: '“Cada planta aprende ao teu ritmo, meu querido.”',
  },
];

export default function DashboardPage() {
  const [doneTasks, setDoneTasks] = useState<number[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');
  const [userLocation, setUserLocation] = useState<string>('');

  useEffect(() => {
    async function fetchTasks() {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;
        setTasks((data as Task[]) || []);
      } catch (err: unknown) {
        if (err instanceof Error) console.error('Erro ao buscar tasks:', err.message);
        else console.error('Erro desconhecido ao buscar tasks:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('doneTasks');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as number[];
        setDoneTasks(Array.isArray(parsed) ? parsed : []);
      } catch {
        setDoneTasks([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('doneTasks', JSON.stringify(doneTasks));
  }, [doneTasks]);

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    const storedLocation = localStorage.getItem('userLocation');

    if (storedName) setUserName(storedName);
    if (storedLocation) {
      try {
        const parsed = JSON.parse(storedLocation) as { distrito?: string; municipio?: string };
        const locationLabel = [parsed.municipio, parsed.distrito].filter(Boolean).join(', ');
        setUserLocation(locationLabel);
      } catch {
        setUserLocation('');
      }
    }
  }, []);

  const progress = useMemo(() => {
    return tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;
  }, [tasks.length, doneTasks.length]);

  const enrichedTasks = useMemo(() => {
    if (!tasks.length) return [] as (Task & (typeof statusPalettes)[number])[];

    return tasks.map((task, index) => {
      const palette = statusPalettes[index % statusPalettes.length];
      return { ...task, ...palette };
    });
  }, [tasks]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="h-12 w-12 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </main>
    );
  }

  const greeting = userName ? `Bom dia, ${userName}` : 'Bom dia, jardineiro';

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-5 pt-16 pb-36">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.85)_0%,_rgba(220,252,231,0.65)_55%,_rgba(214,238,210,0.9)_100%)]" />
      <header className="glass-card relative overflow-hidden px-6 py-8 sm:px-10">
        <div className="absolute -top-12 right-6 h-40 w-40 rounded-full bg-gradient-to-br from-[#22c55e]/30 to-[#0ea5e9]/20 blur-2xl" />
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3 md:max-w-xl">
            <span className="chip-soft inline-flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-500" />
              {userLocation || 'O teu jardim'}
            </span>
            <h1 className="text-4xl leading-tight font-semibold">
              {greeting} 🌞 — A tua horta está com ótimo aspeto!
            </h1>
            <p className="text-sm text-emerald-900/70">
              A Tia Adélia analisou os teus sensores e preparou tarefas suaves para hoje. Respira
              fundo e vamos cuidar de cada folha.
            </p>
          </div>
          <div className="glass-card flex h-full min-w-[220px] flex-col justify-between rounded-3xl bg-white/80 p-6 text-center shadow-emerald-900/5">
            <p className="text-xs tracking-[0.35em] text-emerald-500 uppercase">Progresso</p>
            <p className="text-5xl font-semibold text-emerald-700">{progress}%</p>
            <p className="text-xs text-emerald-900/70">
              {doneTasks.length} de {tasks.length} tarefas concluídas
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="glass-card flex flex-col gap-4 rounded-3xl p-6">
          <div className="flex items-center gap-3">
            <LineChart className="h-10 w-10 rounded-3xl bg-emerald-500/10 p-2 text-emerald-600" />
            <div>
              <p className="text-xs tracking-[0.28em] text-emerald-500 uppercase">Crescimento</p>
              <p className="text-lg font-semibold">A tua horta cresceu 12% este mês 🌻</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            {[52, 68, 74, 80, 92].map((value, index) => (
              <div key={value} className="flex items-center gap-3 text-sm text-emerald-900/70">
                <span className="w-10 rounded-full bg-emerald-500/20 py-1 text-center font-semibold text-emerald-700">
                  S{index + 1}
                </span>
                <div className="flex-1 rounded-full bg-emerald-500/10">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-sky-400"
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className="w-10 text-right font-semibold text-emerald-700">{value}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card flex flex-col justify-between gap-4 rounded-3xl p-6">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 h-9 w-9 rounded-3xl bg-emerald-500/10 p-2 text-emerald-600" />
            <div>
              <p className="text-xs tracking-[0.28em] text-emerald-500 uppercase">Tia Adélia diz</p>
              <p className="text-lg font-semibold">
                “Boa colheita hoje, meu querido jardineiro. Cada planta tem o seu ritmo 🌱”
              </p>
            </div>
          </div>
          <button type="button" className="btn-primary self-start text-sm">
            Falar com a Tia Adélia
          </button>
        </div>
        <div className="glass-card flex flex-col gap-4 rounded-3xl p-6">
          <p className="text-xs tracking-[0.28em] text-emerald-500 uppercase">Alertas rápidos</p>
          <ul className="space-y-3">
            {notifications.map((notification) => (
              <li
                key={notification.title}
                className="flex gap-3 rounded-2xl bg-white/70 p-3 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                  {notification.icon}
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-emerald-800">{notification.title}</p>
                  <p className="text-emerald-900/70">{notification.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs tracking-[0.3em] text-emerald-500 uppercase">Tarefas diárias</p>
            <h2 className="text-2xl font-semibold">Plantas que pedem carinho hoje</h2>
          </div>
          <button type="button" className="btn-secondary text-xs tracking-[0.2em] uppercase">
            + Adicionar planta
          </button>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {enrichedTasks.map((task) => {
            const isDone = doneTasks.includes(task.id);
            return (
              <article
                key={task.id}
                className={clsx(
                  'relative overflow-hidden rounded-[28px] border border-white/40 p-6 shadow-lg shadow-emerald-900/10 transition',
                  'bg-gradient-to-br',
                  task.accent,
                  isDone ? 'opacity-80 grayscale-[0.2]' : 'opacity-100',
                )}
              >
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                <div className="flex items-start gap-4">
                  <div className="h-20 w-20 overflow-hidden rounded-[24px] border border-white/60">
                    <Image
                      src={task.image || '/alface.jpg'}
                      alt={task.title}
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-1 text-white/90">
                    <h3 className="text-xl font-semibold text-white">{task.title}</h3>
                    <p className="text-sm text-white/80">{task.description || task.tip}</p>
                    <div className="flex flex-wrap gap-2 pt-2 text-xs font-semibold">
                      <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">
                        Humidade {task.moisture}%
                      </span>
                      <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">
                        {task.sun}
                      </span>
                      <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">
                        {task.temperature}ºC
                      </span>
                      <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">
                        {task.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-emerald-900">
                  <button
                    onClick={() =>
                      setDoneTasks((prev) =>
                        prev.includes(task.id)
                          ? prev.filter((t) => t !== task.id)
                          : [...prev, task.id],
                      )
                    }
                    className={clsx(
                      'flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur transition',
                      isDone
                        ? 'bg-white/70 text-emerald-700'
                        : 'bg-white text-emerald-600 hover:bg-white/90',
                    )}
                  >
                    <Check className="h-4 w-4" /> {isDone ? 'Cuidada' : 'Marcar como regada'}
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full bg-white/40 px-4 py-2 text-emerald-700 backdrop-blur hover:bg-white/60"
                  >
                    <AlarmClock className="h-4 w-4" /> Lembrar mais tarde
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-white hover:bg-white/30"
                  >
                    <BadgeHelp className="h-4 w-4" /> Pedir ajuda da IA
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-[1.2fr,0.8fr]">
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs tracking-[0.3em] text-emerald-500 uppercase">
                A minha horta virtual
              </p>
              <h2 className="text-2xl font-semibold text-emerald-900">
                Vista interativa do jardim
              </h2>
            </div>
            <button type="button" className="btn-secondary text-xs tracking-[0.2em] uppercase">
              Ver em tempo real
            </button>
          </div>
          <div className="mt-6 grid gap-4 rounded-[28px] bg-gradient-to-br from-white/70 to-white/50 p-6 shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-emerald-900/70">
              {['Horta', 'Estufa', 'Pomar', 'Ervas'].map((zone) => (
                <span
                  key={zone}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2"
                >
                  <Leaf className="h-4 w-4 text-emerald-500" /> {zone}
                </span>
              ))}
            </div>
            <div className="relative grid gap-3 rounded-3xl bg-[url(/virtual-garden-texture.svg)] bg-cover bg-center p-6">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-white/40 to-amber-200/20 backdrop-blur" />
              <div className="relative z-10 grid grid-cols-3 gap-4 text-sm font-semibold text-emerald-900/80 md:grid-cols-4">
                {enrichedTasks.slice(0, 8).map((plant, index) => (
                  <div
                    key={plant.id}
                    className="flex flex-col items-center gap-1 rounded-2xl bg-white/70 p-3 text-center shadow-sm"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                      {index % 2 === 0 ? <Flower2 className="h-6 w-6" /> : <SproutIcon />}
                    </div>
                    <p>{plant.title}</p>
                    <span className="text-xs text-emerald-900/60">{plant.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <aside className="glass-card flex flex-col gap-5 rounded-3xl p-6">
          <div className="space-y-2">
            <p className="text-xs tracking-[0.28em] text-emerald-500 uppercase">
              Sensores em destaque
            </p>
            <h3 className="text-xl font-semibold text-emerald-900">Resumo diário</h3>
            <p className="text-sm text-emerald-900/70">
              Dados recolhidos pelos sensores da horta nas últimas 24h. Ajusta a rega e a luz
              conforme os indicadores.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              { label: 'Humidade média', value: '61%', icon: <Droplets className="h-4 w-4" /> },
              {
                label: 'Temperatura média',
                value: '21ºC',
                icon: <Thermometer className="h-4 w-4" />,
              },
              { label: 'Horas de luz', value: '8h', icon: <Sun className="h-4 w-4" /> },
            ].map((sensor) => (
              <li
                key={sensor.label}
                className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-emerald-800 shadow-sm"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                    {sensor.icon}
                  </span>
                  {sensor.label}
                </span>
                <span className="font-semibold">{sensor.value}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-3xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 p-5 text-sm text-emerald-900">
            <p className="font-semibold">Recomendações da IA</p>
            <p>
              A planta junto à janela leste está a receber pouca luz. Considera movê-la 30 cm mais
              para a frente.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}

function SproutIcon() {
  return <Leaf className="h-6 w-6 text-emerald-600" />;
}
