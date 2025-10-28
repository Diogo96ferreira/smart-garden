'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Check, AlarmClock, BadgeHelp } from 'lucide-react';
import { motion } from 'framer-motion';
import { LeafLoader } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabaseClient';

// ✅ Tipo explícito para as tarefas
type Task = {
  id: number;
  title: string;
  description?: string | null;
  image?: string | null;
  created_at?: string;
};

export default function DashboardPage() {
  const [doneTasks, setDoneTasks] = useState<number[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');
  const [userLocation, setUserLocation] = useState<string>('');

  // 🔹 1️⃣ Fetch tasks from Supabase
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

  // 🔹 2️⃣ Load doneTasks from localStorage
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

  // 🔹 3️⃣ Save doneTasks to localStorage
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
        <LeafLoader />
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-8 pb-28">
      <header className="mb-6 text-center">
        <p className="text-lg font-medium text-green-900">
          {userName ? `Hello ${userName}! 👋` : 'Hello gardener! 👋'}
        </p>
        <h1 className="text-2xl font-extrabold text-green-800 sm:text-3xl">
          Here’s what your garden needs this week 🌱
        </h1>
        {userLocation && <p className="mt-1 text-sm text-gray-600">{userLocation}</p>}
      </header>

      {/* 🌤️ Garden Overview */}
      <section className="mb-6 rounded-2xl bg-white/80 p-5 text-green-900 shadow-md">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">🌤️ Garden status:</p>
            <h3 className="text-lg font-bold">
              {progress === 100 ? 'Perfectly cared for! 🌼' : 'Healthy & hydrated'}
            </h3>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>
              Next rain: <span className="font-medium text-green-700">Fri</span>
            </p>
            <p>
              Tasks done:{' '}
              <span className="font-medium">
                {doneTasks.length}/{tasks.length}
              </span>
            </p>
          </div>
        </div>

        {/* 🌿 Progress Bar inside the card */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium text-green-800">Weekly Progress</span>
            <span className="text-xs font-semibold text-green-700">{progress}%</span>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-[#E4F6E4] shadow-inner">
            <motion.div
              className="h-full rounded-full bg-[#2E7D32]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </section>

      {/* 🪴 Task List */}
      <section className="mx-auto max-w-2xl space-y-5">
        {tasks.map((task, index) => {
          const isDone = doneTasks.includes(task.id);
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-2xl bg-white/80 p-5 shadow-md transition-all duration-300 ${
                isDone ? 'border border-green-300 opacity-70' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-100">
                  <Image
                    src={task.image || '/alface.jpg'}
                    alt={task.title}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-green-800">{task.title}</h4>
                  <p className="text-sm text-gray-600">{task.description || '—'}</p>
                </div>
              </div>

              <div className="mt-4 flex justify-center gap-2 sm:justify-start">
                <Button
                  onClick={() => handleDone(task.id)}
                  className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-sm ${
                    isDone
                      ? 'bg-green-200 text-green-700'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  <Check className="h-4 w-4" /> {isDone ? 'Done!' : 'Done'}
                </Button>

                <Button
                  variant="outline"
                  className="flex items-center gap-1 rounded-full border bg-yellow-100 px-4 py-1.5 text-sm text-yellow-800 hover:bg-yellow-200"
                >
                  <AlarmClock className="h-4 w-4" /> Postpone
                </Button>

                <Button
                  variant="outline"
                  className="flex items-center gap-1 rounded-full bg-red-400 px-4 py-1.5 text-sm text-white hover:bg-red-500"
                >
                  <BadgeHelp className="h-4 w-4" /> How
                </Button>
              </div>
            </motion.div>
          );
        })}
      </section>
    </main>
  );
}
