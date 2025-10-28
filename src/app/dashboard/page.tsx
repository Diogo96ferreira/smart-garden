'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Check, AlarmClock, BadgeHelp } from 'lucide-react';
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

  // 🔹 4️⃣ Handle toggle
  const handleDone = (id: number) => {
    setDoneTasks((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  // ⚠️ Condiciona apenas o conteúdo, não o hook
  // ✅ Agora podes calcular progress em segurança
  const progress = useMemo(() => {
    return tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;
  }, [tasks.length, doneTasks.length]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="h-12 w-12 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-10 pb-28">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
        <header className="flex flex-col gap-2 text-center text-emerald-950">
          <p className="text-base font-medium tracking-wide text-emerald-700 uppercase">
            {userLocation ? userLocation : 'O teu jardim'}
          </p>
          <h1 className="text-3xl font-semibold">
            {userName ? `Olá, ${userName}!` : 'Olá, jardineiro!'}
          </h1>
          <p className="text-sm text-emerald-700/80">
            Estas são as tarefas de hoje para manter cada folha fresca.
          </p>
        </header>

        <section className="rounded-3xl border border-emerald-100 bg-white/70 p-8 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm tracking-[0.2em] text-emerald-500 uppercase">Visão geral</p>
              <h2 className="mt-2 text-2xl font-semibold text-emerald-900">
                {progress === 100 ? 'Tudo cuidado 🌼' : 'Ainda há folhas com sede'}
              </h2>
              <p className="mt-1 text-sm text-emerald-700/80">
                {doneTasks.length} de {tasks.length} tarefas concluídas
              </p>
            </div>
            <div className="w-full max-w-sm">
              <div className="flex items-center justify-between text-xs tracking-[0.2em] text-emerald-500 uppercase">
                <span>Progresso</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-emerald-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {tasks.map((task) => {
            const isDone = doneTasks.includes(task.id);
            return (
              <article
                key={task.id}
                className={`flex flex-col gap-4 rounded-3xl border p-6 shadow-sm transition ${
                  isDone
                    ? 'border-emerald-200 bg-white/60 text-emerald-700'
                    : 'border-emerald-100 bg-white/80 text-emerald-900 hover:border-emerald-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl bg-emerald-100">
                    <Image
                      src={task.image || '/alface.jpg'}
                      alt={task.title}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{task.title}</h3>
                    <p className="mt-1 text-sm text-emerald-800/70">
                      {task.description || 'Sem notas especiais para esta planta.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                  <button
                    onClick={() => handleDone(task.id)}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 transition ${
                      isDone
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-emerald-500 text-white hover:bg-emerald-600'
                    }`}
                  >
                    <Check className="h-4 w-4" /> {isDone ? 'Cuidada' : 'Regada'}
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-800"
                  >
                    <AlarmClock className="h-4 w-4" /> Lembrar mais tarde
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                  >
                    <BadgeHelp className="h-4 w-4" /> Pedir ajuda
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function SproutIcon() {
  return <Leaf className="h-6 w-6 text-emerald-600" />;
}
