'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardFooter } from '@/components/ui/card';
import { AlarmClock, BadgeHelp, Check, Sun, CloudRain, Droplets, Leaf } from 'lucide-react';

interface Task {
  id: number;
  title: string;
  description: string;
  image: string;
  priority: 'low' | 'medium' | 'high';
  weather: 'sun' | 'rain' | 'humidity';
}

export default function DashboardPage() {
  const [name, setName] = useState<string>('');

  const tasks: Task[] = [
    {
      id: 1,
      title: 'Water Tomato Plants',
      description: 'Soil is dry, time to hydrate!',
      image: '/tomato.jpg',
      priority: 'high',
      weather: 'sun',
    },
    {
      id: 2,
      title: 'Inspect Rose Bushes',
      description: 'Check for aphids and black spots.',
      image: '/roses.jpg',
      priority: 'medium',
      weather: 'humidity',
    },
    {
      id: 3,
      title: 'Harvest Lettuce',
      description: 'Pick outer leaves for continuous growth.',
      image: '/alface.jpg',
      priority: 'low',
      weather: 'rain',
    },
  ];

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) setName(storedName);
  }, []);

  const priorityColor = {
    high: 'bg-red-100 text-red-700 border-red-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-green-100 text-green-700 border-green-300',
  };

  const weatherIcon = {
    sun: <Sun className="h-4 w-4 text-yellow-500" />,
    rain: <CloudRain className="h-4 w-4 text-blue-500" />,
    humidity: <Droplets className="h-4 w-4 text-teal-500" />,
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white px-6 py-8">
      {/* Header */}
      <header className="mb-8 text-center sm:text-left">
        <p className="text-lg font-medium text-green-900">Hello {name || 'Gardener'}! 👋</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-green-800 sm:text-3xl">
          Here’s what your garden needs this week 🌱
        </h1>
      </header>

      {/* Task List */}
      <section className="mx-auto max-w-2xl space-y-6">
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.15,
              duration: 0.4,
              ease: 'easeOut',
            }}
          >
            <Card className="overflow-hidden rounded-2xl bg-white/70 shadow-md backdrop-blur-sm transition-all duration-200 hover:shadow-lg">
              <div className="flex items-center gap-4 p-5">
                {/* Task Image */}
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-100 shadow-sm">
                  <Image
                    src={task.image}
                    alt={task.title}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Task Info */}
                <div className="flex-1">
                  <h4 className="flex items-center gap-2 text-lg font-semibold text-green-800">
                    {task.title}
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${priorityColor[task.priority]}`}
                    >
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </h4>
                  <p className="text-sm text-gray-600">{task.description}</p>

                  {/* Weather Indicator */}
                  <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                    {weatherIcon[task.weather]}
                    <span>
                      {task.weather === 'sun'
                        ? 'Sunny day ahead'
                        : task.weather === 'rain'
                          ? 'Rain expected'
                          : 'High humidity'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <CardFooter className="flex flex-wrap justify-center gap-2 px-5 pt-0 pb-5 sm:justify-start">
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button className="flex items-center gap-1 rounded-full bg-green-500 px-4 py-1.5 text-sm text-white hover:bg-green-600">
                    <Check className="h-4 w-4" /> Done
                  </Button>
                </motion.div>

                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    className="flex items-center gap-1 rounded-full border bg-yellow-100 px-4 py-1.5 text-sm text-yellow-800 hover:bg-yellow-200"
                  >
                    <AlarmClock className="h-4 w-4" /> Postpone
                  </Button>
                </motion.div>

                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    className="flex items-center gap-1 rounded-full bg-red-400 px-4 py-1.5 text-sm text-white hover:bg-red-500"
                  >
                    <BadgeHelp className="h-4 w-4" /> How
                  </Button>
                </motion.div>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </section>
    </main>
  );
}
