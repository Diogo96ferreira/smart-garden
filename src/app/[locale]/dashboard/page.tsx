'use client';

import type { ComponentType } from 'react';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import clsx from 'clsx';
import { CheckCircle2, Clock3, HelpCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LeafLoader } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabaseClient';
import { useTranslation } from '@/lib/useTranslation';
import { isWateringTask } from '@/lib/nameMatching';
import { usePathname } from 'next/navigation';

type Task = {
  id: string | number;
  title: string;
  description?: string | null;
  image?: string | null;
  plant_id?: string | null;
  created_at?: string;
};

type PlantLite = { id: string; name: string; image_url?: string | null };

export default function DashboardPage() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'pt';
  const t = useTranslation(locale);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [doneThisWeek, setDoneThisWeek] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Jardineiro');
  const [plants, setPlants] = useState<PlantLite[]>([]);
  const [plim, setPlim] = useState(false);
  const allDoneRef = useRef(false);

  // controla o "Tudo concluído!"
  useEffect(() => {
    const total = tasks.length + doneThisWeek.length;
    const allDone = total > 0 && tasks.length === 0;
    if (allDone && !allDoneRef.current) {
      allDoneRef.current = true;
      setPlim(true);
      const t = setTimeout(() => setPlim(false), 1400);
      return () => clearTimeout(t);
    }
    if (!allDone) allDoneRef.current = false;
  }, [tasks.length, doneThisWeek.length]);

  // lê o nome do utilizador guardado
  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) setUserName(storedName);
  }, []);

  // range da semana
  const getWeekRange = useCallback(() => {
    const now = new Date();
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    const day = (d.getDay() + 6) % 7;
    const start = new Date(d);
    start.setDate(d.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start: start.toISOString(), end: end.toISOString() };
  }, []);

  const progress = useMemo(() => {
    const total = tasks.length + doneThisWeek.length;
    if (!total) return 0;
    return Math.min(100, Math.round((doneThisWeek.length / total) * 100));
  }, [tasks.length, doneThisWeek.length]);

  const refreshTasks = useCallback(async () => {
    const { start, end } = getWeekRange();
    const [pQ, dQ] = await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .eq('done', false)
        .gte('created_at', start)
        .lt('created_at', end)
        .order('created_at', { ascending: true }),
      supabase
        .from('tasks')
        .select('*')
        .eq('done', true)
        .gte('done_at', start)
        .lt('done_at', end)
        .order('done_at', { ascending: true }),
    ]);
    setTasks(pQ.data ?? []);
    setDoneThisWeek(dQ.data ?? []);
  }, [getWeekRange]);

  // Fetch inicial
  useEffect(() => {
    refreshTasks().finally(() => setLoading(false));
  }, [refreshTasks]);

  // plantas (imagens)
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from('plants').select('id,name,image_url');
        if (error) throw error;
        setPlants(data ?? []);
      } catch (err) {
        console.warn('Falha a carregar plantas para imagens:', err);
      }
    })();
  }, []);

  // sincroniza tasks do servidor
  useEffect(() => {
    (async () => {
      try {
        await fetch('/api/generate-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale }),
        });
        await refreshTasks();
      } catch (err) {
        console.warn('generate-tasks sync failed', err);
      }
    })();
  }, [locale, refreshTasks]);

  const handleCompleteTask = async (task: Task) => {
    try {
      const isWater = isWateringTask(task.title, locale === 'en' ? 'en' : 'pt');
      if (isWater) {
        if (task.plant_id) {
          await supabase
            .from('plants')
            .update({ last_watered: new Date().toISOString() })
            .eq('id', task.plant_id);
        } else {
          const plantName = task.title.split(':').slice(1).join(':').trim();
          if (plantName) {
            await supabase
              .from('plants')
              .update({ last_watered: new Date().toISOString() })
              .ilike('name', plantName);
          }
        }
      }

      await supabase
        .from('tasks')
        .update({ done: true, done_at: new Date().toISOString() })
        .eq('id', task.id);

      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      setDoneThisWeek((prev) => [...prev, { ...task }]);
    } catch (err) {
      console.error('Erro ao concluir tarefa:', err);
    }
  };

  const handlePostponeTask = async (task: Task) => {
    try {
      const base = task.created_at ? new Date(task.created_at) : new Date();
      const next = new Date(base);
      next.setDate(base.getDate() + 7);
      await supabase
        .from('tasks')
        .update({ created_at: next.toISOString(), done: false })
        .eq('id', task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (err) {
      console.error('Erro ao adiar tarefa:', err);
    }
  };

  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

  const imageForTask = (task: Task): string | null => {
    if (task.image) return task.image;
    if (task.plant_id) {
      const p = plants.find((x) => x.id === task.plant_id);
      if (p?.image_url) return p.image_url;
    }
    const tt = norm(`${task.title} ${task.description ?? ''}`);
    let best: string | null = null;
    let bestLen = 0;
    for (const p of plants) {
      const n = norm(p.name || '');
      if (!n) continue;
      if (tt.includes(n) && n.length > bestLen) {
        best = p.image_url ?? null;
        bestLen = n.length;
      }
    }
    return best;
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
      {/* Header */}
      <header className="space-y-2">
        <p className="eyebrow text-left">{t('dashboard.thisWeek')}</p>
        <h1 className="text-display text-3xl sm:text-4xl">
          {t('dashboard.greeting').replace('{{name}}', userName)}
        </h1>
        <p className="max-w-2xl text-sm text-[var(--color-text-muted)] sm:text-base">
          {t('dashboard.intro')}
        </p>
      </header>

      {/* resto igual ao teu código */}
      {/* ... */}
    </main>
  );
}

// === Components ===
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
