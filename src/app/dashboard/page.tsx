'use client';

import type { ComponentType } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { CheckCircle2, Clock3, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LeafLoader } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabaseClient';

type Task = {
  id: number;
  title: string;
  description?: string | null;
  image?: string | null;
  created_at?: string;
};

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [doneTasks, setDoneTasks] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Jardineiro');

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) setUserName(storedName);
  }, []);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;
        setTasks((data as Task[]) ?? []);
      } catch (error) {
        console.error('Erro ao carregar tarefas:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('doneTasks');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as number[];
      setDoneTasks(Array.isArray(parsed) ? parsed : []);
    } catch {
      setDoneTasks([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('doneTasks', JSON.stringify(doneTasks));
  }, [doneTasks]);

  const progress = useMemo(() => {
    if (!tasks.length) return 0;
    return Math.round((doneTasks.length / tasks.length) * 100);
  }, [doneTasks.length, tasks.length]);

  const handleToggleTask = (id: number) => {
    setDoneTasks((prev) =>
      prev.includes(id) ? prev.filter((taskId) => taskId !== id) : [...prev, id],
    );
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LeafLoader />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-12">
      <header className="space-y-2">
        <p className="eyebrow text-left">Esta semana</p>
        <h1 className="text-display text-3xl sm:text-4xl">
          Olá, {userName}! Vamos cuidar da sua horta.
        </h1>
        <p className="max-w-2xl text-sm text-[var(--color-text-muted)] sm:text-base">
          Acompanhe as tarefas prioritárias para manter as plantas felizes. A cada ação concluída, a
          Smart Garden ajusta as recomendações seguintes.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[var(--radius-lg)] bg-linear-to-br from-[var(--color-primary)] via-[#3f9260] to-[#2d6f45] p-8 text-white shadow-[var(--shadow-soft)]">
          <p className="text-sm tracking-wider text-white/70 uppercase">Resumo</p>
          <h2 className="mt-2 text-3xl leading-tight font-semibold">
            A sua horta está no bom caminho
          </h2>
          <p className="mt-4 max-w-md text-sm text-white/80">
            Cumpriu {doneTasks.length} de {tasks.length} tarefas desta semana. Continue assim para
            manter as plantas no ponto certo.
          </p>

          <div className="mt-6 flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between text-sm text-white/70">
                <span>Progresso semanal</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/25">
                <motion.div
                  className="h-full rounded-full bg-white"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <HighlightStat
                label="Próxima rega"
                value="sexta-feira"
                icon={<Clock3 className="h-4 w-4" />}
              />
              <HighlightStat
                label="Clima previsto"
                value="21ºC · céu limpo"
                icon={<HelpCircle className="h-4 w-4" />}
              />
            </div>
          </div>
        </div>

        <aside className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
          <p className="eyebrow">Novas sugestões</p>
          <div className="mt-6 space-y-4">
            <SuggestionCard
              title="Coloque cobertura morta"
              description="Ajuda a reter humidade e protege as raízes em dias quentes."
              actionLabel="Ver como"
            />
            <SuggestionCard
              title="Reveja a rega noturna"
              description="A rega ao fim do dia evita a evaporação excessiva."
              actionLabel="Ajustar horários"
            />
          </div>
        </aside>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-display text-2xl">Plano de cuidados</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            {doneTasks.length}/{tasks.length} concluídas
          </p>
        </div>

        <div className="space-y-4">
          {tasks.map((task, index) => {
            const isDone = doneTasks.includes(task.id);
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 overflow-hidden rounded-[var(--radius-md)]">
                      <Image
                        src={task.image || '/tomato.jpg'}
                        alt={task.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-[var(--color-text)]">
                        {task.title}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        {task.description || 'Sem descrição disponível.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-1 items-center justify-end gap-3">
                    <TaskActionButton
                      label={isDone ? 'Desmarcar tarefa' : 'Marcar tarefa como concluída'}
                      icon={CheckCircle2}
                      active={isDone}
                      onClick={() => handleToggleTask(task.id)}
                    />
                    <TaskActionButton label="Adiar tarefa" icon={Clock3} />
                    <TaskActionButton label="Como fazer" icon={HelpCircle} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function HighlightStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] bg-white/20 p-4 text-white">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
        {icon}
      </span>
      <div>
        <p className="text-xs tracking-wide text-white/70 uppercase">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function SuggestionCard({
  title,
  description,
  actionLabel,
}: {
  title: string;
  description: string;
  actionLabel: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
      <h3 className="font-semibold text-[var(--color-text)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">{description}</p>
      <Button variant="ghost" size="sm" className="mt-3 px-0 text-[var(--color-primary-strong)]">
        {actionLabel}
      </Button>
    </div>
  );
}

type IconComponent = ComponentType<{ className?: string }>;

function TaskActionButton({
  label,
  icon: Icon,
  active,
  onClick,
  disabled,
}: {
  label: string;
  icon: IconComponent;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className={clsx(
        'flex h-10 w-10 items-center justify-center rounded-full border text-[var(--color-text-muted)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] focus-visible:outline-none',
        active
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-[0_6px_14px_rgba(16,185,129,0.25)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary-strong)]',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="sr-only">{label}</span>
    </button>
  );
}
