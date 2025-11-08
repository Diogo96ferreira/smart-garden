'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import type { ComponentType } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import clsx from 'clsx';
import { CheckCircle2, Clock3, HelpCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SupportCard from '@/components/ui/SupportCard';
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

  const [tasks, setTasks] = useState<Task[]>([]); // pending
  const [doneThisWeek, setDoneThisWeek] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [awaitingTasks, setAwaitingTasks] = useState(false);
  const pollStartedRef = useRef(false);
  const [userName, setUserName] = useState('Jardineiro');
  const [plants, setPlants] = useState<PlantLite[]>([]);
  const [_weekTotal, setWeekTotal] = useState(0);
  const [_weekDone, setWeekDone] = useState(0);
  const [plim, setPlim] = useState(false);
  const [weatherNote, setWeatherNote] = useState<string | null>(null);
  const allDoneRef = useRef(false);

  const loadingText = locale.startsWith('en')
    ? 'Preparing your plan...'
    : 'A preparar o teu plano...';
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

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) setUserName(storedName);
  }, []);

  // Week helpers
  const getWeekRange = () => {
    const now = new Date();
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    const day = (d.getDay() + 6) % 7; // Monday=0
    const start = new Date(d);
    start.setDate(d.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const refreshWeekStats = async () => {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return;
    const { start, end } = getWeekRange();
    const totalQ = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', start)
      .lt('created_at', end);
    const total = totalQ.count ?? 0;
    const doneQ = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('done', true)
      .eq('user_id', userId)
      .gte('done_at', start)
      .lt('done_at', end);
    const done = doneQ.count ?? 0;
    setWeekTotal(total);
    setWeekDone(done);
  };

  const progress = useMemo(() => {
    const total = tasks.length + doneThisWeek.length;
    if (!total) return 0;
    return Math.max(0, Math.min(100, Math.round((doneThisWeek.length / total) * 100)));
  }, [tasks.length, doneThisWeek.length]);

  // Initial fetch
  useEffect(() => {
    async function fetchTasks() {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id;
        if (!userId) return setLoading(false);
        const { start, end } = getWeekRange();
        const [pQ, dQ] = await Promise.all([
          supabase
            .from('tasks')
            .select('*')
            .eq('done', false)
            .eq('user_id', userId)
            .gte('created_at', start)
            .lt('created_at', end)
            .order('created_at', { ascending: true }),
          supabase
            .from('tasks')
            .select('*')
            .eq('done', true)
            .eq('user_id', userId)
            .gte('done_at', start)
            .lt('done_at', end)
            .order('done_at', { ascending: true }),
        ]);
        setTasks((pQ.data as Task[]) ?? []);
        setDoneThisWeek((dQ.data as Task[]) ?? []);
      } catch (error) {
        console.error('Erro ao carregar tarefas:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, []);

  // Plants for images
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from('plants').select('id,name,image_url');
        if (error) throw error;
        setPlants((data as PlantLite[]) ?? []);
      } catch (err) {
        console.warn('Falha a carregar plantas para imagens:', err);
      }
    })();
  }, []);

  // Keep task images in sync with Garden updates using realtime
  useEffect(() => {
    const channel = supabase
      .channel('plants-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plants' }, async () => {
        try {
          const { data, error } = await supabase.from('plants').select('id,name,image_url');
          if (!error) setPlants((data as PlantLite[]) ?? []);
        } catch {}
      })
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, []);

  const refreshTasks = async () => {
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
    const pending = (pQ.data as Task[]) ?? [];
    const done = (dQ.data as Task[]) ?? [];
    setTasks(pending);
    setDoneThisWeek(done);
    return { pendingCount: pending.length, doneCount: done.length };
  };

  // Soft loading: trigger server task generation, then refresh counts
  useEffect(() => {
    (async () => {
      try {
        setAwaitingTasks(true);
        // Try to include user location from localStorage to enable weather-aware scheduling
        let location: { distrito?: string; municipio?: string } | undefined;
        try {
          const rawUL = localStorage.getItem('userLocation');
          if (rawUL) location = JSON.parse(rawUL);
        } catch {}
        if (!location) {
          try {
            const rawSettings = localStorage.getItem('garden.settings.v1');
            if (rawSettings) {
              const parsed = JSON.parse(rawSettings);
              if (parsed && typeof parsed === 'object' && parsed.userLocation)
                location = parsed.userLocation;
            }
          } catch {}
        }
        // Include the selected AI persona to influence task phrasing when AI is used
        await fetch('/api/generate-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            locale,
            location,
            profile: (() => {
              try {
                const rawSettings = localStorage.getItem('garden.settings.v1');
                if (rawSettings)
                  return (JSON.parse(rawSettings).aiProfile as string) || 'tia-adelia';
              } catch {}
              return 'tia-adelia';
            })(),
          }),
        });
        // Fetch weather note to explain adjustments (with localStorage cache until midnight)
        try {
          const normalize = (s?: string) =>
            (s || '')
              .toLowerCase()
              .normalize('NFD')
              .replace(/\p{Diacritic}/gu, '')
              .replace(/\s+/g, ' ')
              .trim();
          const locKey = location
            ? `${normalize(location.distrito)}|${normalize(location.municipio)}`
            : 'none';
          const cacheKey = `weather.note.v2:${locale}:${locKey}`;

          // try cache
          try {
            const cachedRaw = localStorage.getItem(cacheKey);
            if (cachedRaw) {
              const cached = JSON.parse(cachedRaw) as { note?: string; expiresAt?: string };
              const expires = cached?.expiresAt ? new Date(cached.expiresAt) : null;
              if (expires && expires.getTime() > Date.now() && typeof cached.note === 'string') {
                setWeatherNote(cached.note);
              } else {
                localStorage.removeItem(cacheKey);
              }
            }
          } catch {}

          // fetch only if we have no valid cached note
          if (!localStorage.getItem(cacheKey)) {
            const res = await fetch('/api/weather', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ locale, location }),
            });
            const data = await res.json().catch(() => null);
            if (data && typeof data.note === 'string') {
              setWeatherNote(data.note);
              // compute next midnight local time
              const now = new Date();
              const expiresAt = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + 1,
                0,
                0,
                0,
                0,
              );
              try {
                localStorage.setItem(
                  cacheKey,
                  JSON.stringify({ note: data.note, expiresAt: expiresAt.toISOString() }),
                );
              } catch {}
            }
          }
        } catch {}
        await refreshTasks();
        await refreshWeekStats();
      } catch {
      } finally {
        // Keep awaitingTasks true for a short poll window handled below
      }
    })();
  }, []);

  // Poll for tasks to appear after generation, for up to ~12s
  useEffect(() => {
    const total = tasks.length + doneThisWeek.length;
    if (total > 0) {
      setAwaitingTasks(false);
      return;
    }
    if (pollStartedRef.current) return;
    pollStartedRef.current = true;
    setAwaitingTasks(true);

    let attempts = 0;
    const maxAttempts = 12; // ~12s at 1s interval
    const iv = setInterval(async () => {
      attempts += 1;
      const { pendingCount, doneCount } = await refreshTasks();
      if (pendingCount + doneCount > 0 || attempts >= maxAttempts) {
        clearInterval(iv);
        setAwaitingTasks(false);
      }
    }, 1000);

    return () => {
      clearInterval(iv);
    };
  }, [tasks.length, doneThisWeek.length]);

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
      // Optimistic: move card (shared layout)
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      setDoneThisWeek((prev) => [...prev, { ...task }]);
      await refreshWeekStats();
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
      await refreshWeekStats();
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

  // No client backfill: tasks are always generated from server with plant_id

  const imageForTask = (task: Task): string | null => {
    const placeholder = '/spinner.png';
    // If the task is linked to a plant, prefer that image or placeholder
    if (task.plant_id) {
      const p = plants.find((x) => x.id === task.plant_id);
      return p?.image_url || placeholder;
    }
    // Otherwise, try task-provided image, then best match, then placeholder
    if (task.image) return task.image;
    const t = `${task.title} ${task.description ?? ''}`;
    const tt = norm(t);
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
    return best || placeholder;
  };

  const tasksLoading = loading || awaitingTasks;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-12">
      <header className="space-y-2">
        <p className="eyebrow text-left">{t('dashboard.thisWeek')}</p>
        <h1 className="text-display text-3xl sm:text-4xl">
          {t('dashboard.greeting').replace('{{name}}', userName)}
        </h1>
        <p className="max-w-2xl text-sm text-[var(--color-text-muted)] sm:text-base">
          {t('dashboard.intro')}
        </p>
      </header>

      <SupportCard locale={locale} />

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[var(--radius-lg)] bg-linear-to-br from-[var(--color-primary)] via-[#3f9260] to-[#2d6f45] p-8 text-white shadow-[var(--shadow-soft)]">
          <p className="text-sm tracking-wider text-white/70 uppercase">{t('dashboard.summary')}</p>
          <h2 className="mt-2 text-3xl leading-tight font-semibold">
            {t('dashboard.progressTitle')}
          </h2>
          <p className="mt-4 max-w-md text-sm text-white/80">
            {t('dashboard.completed')
              .replace('{{done}}', doneThisWeek.length.toString())
              .replace('{{total}}', (tasks.length + doneThisWeek.length).toString())}
          </p>
          <div className="mt-6 flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between text-sm text-white/70">
                <span>{t('dashboard.weeklyProgress')}</span>
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
            {weatherNote && (
              <div className="mt-2 flex items-start gap-3 rounded-[var(--radius-md)] bg-white/10 p-3 text-sm leading-snug">
                <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-white/80" />
                <p className="text-white/90">{weatherNote}</p>
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
          <p className="eyebrow">{t('dashboard.newSuggestions')}</p>
          <SuggestionsPanel
            locale={locale}
            onAddTask={async (s) => {
              try {
                const { data: auth } = await supabase.auth.getUser();
                const userId = auth.user?.id;
                if (!userId) return;
                await supabase.from('tasks').insert({
                  title: s.title,
                  description: s.description ?? null,
                  user_id: userId,
                  plant_id: s.plant_id ?? null,
                });
                await refreshTasks();
                await refreshWeekStats();
              } catch {}
            }}
          />
        </aside>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-display text-2xl">{t('dashboard.carePlan')}</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            {doneThisWeek.length}/{tasks.length + doneThisWeek.length}{' '}
            {t('dashboard.completedShort')}
          </p>
        </div>
        {tasksLoading ? (
          <div className="flex items-center justify-center py-10">
            <LeafLoader label={loadingText} />
          </div>
        ) : (
          <LayoutGroup id="tasks-group">
            {/* Pending */}
            <div className="space-y-4">
              <AnimatePresence initial={false} mode="popLayout">
                {tasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    layout
                    layoutId={`task-${task.id}`}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20, scale: 0.98 }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 40,
                      mass: 0.7,
                      delay: index * 0.02,
                    }}
                    className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)]"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-4">
                        <div className="relative aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-md)]">
                          <Image
                            src={imageForTask(task) || '/spinner.png'}
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
                            {task.description || t('dashboard.noDescription')}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-1 items-center justify-end gap-3">
                        <TaskActionButton
                          label={t('dashboard.markDone')}
                          icon={CheckCircle2}
                          onClick={() => handleCompleteTask(task)}
                        />
                        <TaskActionButton
                          label={t('dashboard.delay')}
                          icon={Clock3}
                          onClick={() => handlePostponeTask(task)}
                        />
                        <TaskActionButton label={t('dashboard.howTo')} icon={HelpCircle} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Completed */}
            {Boolean(doneThisWeek.length) && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-[var(--color-text-muted)] uppercase">
                  <div className="h-px flex-1 bg-[var(--color-border)]" />
                  <span>{t('dashboard.completedShort')}</span>
                  <div className="h-px flex-1 bg-[var(--color-border)]" />
                </div>
                <div className="space-y-3">
                  <AnimatePresence initial={false} mode="popLayout">
                    {doneThisWeek.map((task) => (
                      <motion.div
                        key={`done-${task.id}`}
                        layout
                        layoutId={`task-${task.id}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 opacity-70 saturate-50"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-[var(--color-primary)]" />
                          <div>
                            <div className="text-sm font-medium text-[var(--color-text)]">
                              {task.title}
                            </div>
                            <div className="text-xs text-[var(--color-text-muted)]">
                              {task.description || t('dashboard.noDescription')}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </LayoutGroup>
        )}
      </section>

      <AnimatePresence>
        {plim && (
          <motion.div
            key="plim"
            className="pointer-events-none fixed inset-0 z-[100] flex items-start justify-center pt-20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          >
            <div className="relative rounded-full bg-[var(--color-surface)]/95 px-4 py-2 shadow-[0_12px_32px_rgba(0,0,0,0.25)] ring-2 ring-[var(--color-primary)]/40">
              <div className="flex items-center gap-2 text-[var(--color-primary-strong)]">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-semibold">
                  {locale.startsWith('en') ? 'All tasks done!' : 'Tudo concluï¿½do!'}
                </span>
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="pointer-events-none absolute -inset-6 animate-ping rounded-full border-2 border-[var(--color-primary)]/25" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
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

type Suggestion = {
  id: string;
  title: string;
  description?: string;
  action?: 'create_task' | 'open_garden' | 'open_calendar';
  plant_id?: string | null;
};

function SuggestionsPanel({
  locale,
  onAddTask,
}: {
  locale: string;
  onAddTask: (s: Suggestion) => Promise<void> | void;
}) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Suggestion[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/suggestions?locale=${encodeURIComponent(locale)}`);
        const json = (await res.json().catch(() => ({}))) as { suggestions?: Suggestion[] };
        const dismissedRaw = localStorage.getItem('suggestions.dismissed.v1');
        const dismissed = new Set<string>(
          (dismissedRaw ? JSON.parse(dismissedRaw) : []) as string[],
        );
        if (!cancelled) {
          setItems((json.suggestions ?? []).filter((s) => !dismissed.has(s.id)));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const dismiss = (id: string) => {
    setItems((prev) => prev.filter((s) => s.id !== id));
    try {
      const dismissedRaw = localStorage.getItem('suggestions.dismissed.v1');
      const dismissed = new Set<string>((dismissedRaw ? JSON.parse(dismissedRaw) : []) as string[]);
      dismissed.add(id);
      localStorage.setItem('suggestions.dismissed.v1', JSON.stringify(Array.from(dismissed)));
    } catch {}
  };

  if (loading) {
    return (
      <div className="mt-6 flex items-center justify-center py-6">
        <LeafLoader
          label={locale.startsWith('en') ? 'Loading suggestions' : 'A carregar sugestões'}
        />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="mt-6 text-sm text-[var(--color-text-muted)]">
        {locale.startsWith('en') ? 'No suggestions right now.' : 'Sem sugestões para já'}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {items.map((s) => (
        <div
          key={s.id}
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"
        >
          <h3 className="font-semibold text-[var(--color-text)]">{s.title}</h3>
          {s.description && (
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">{s.description}</p>
          )}
          <div className="mt-3 flex items-center gap-2">
            {s.action === 'create_task' ? (
              <Button size="sm" onClick={() => onAddTask(s)}>
                {locale.startsWith('en') ? 'Add to plan' : 'Adicionar ao plano'}
              </Button>
            ) : s.action === 'open_garden' ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => (window.location.href = `/${locale}/garden`)}
              >
                {locale.startsWith('en') ? 'Open Garden' : 'Abrir Garden'}
              </Button>
            ) : s.action === 'open_calendar' ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => (window.location.href = `/${locale}/calendar`)}
              >
                {locale.startsWith('en') ? 'Open Calendar' : 'Abrir Calendário'}
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onClick={() => dismiss(s.id)}>
              {locale.startsWith('en') ? 'Dismiss' : 'Ignorar'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
