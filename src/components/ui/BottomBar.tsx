'use client';

import { useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Sprout, Settings, Sparkles } from 'lucide-react';
import clsx from 'clsx';

export default function BottomBar() {
  const router = useRouter();
  const pathname = usePathname();

  const items = useMemo(
    () => [
      { id: 'home', icon: Home, href: '/dashboard', label: 'Inicio' },
      { id: 'garden', icon: Sprout, href: '/garden', label: 'Jardim' },
      { id: 'ai', icon: Sparkles, href: '/ai', label: 'AI' },
      { id: 'settings', icon: Settings, href: '/settings', label: 'Definições' },
    ],
    [],
  );

  const active = useMemo(() => {
    const match = items.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    );
    return match?.id ?? 'home';
  }, [items, pathname]);

  return (
    <nav className="fixed inset-x-0 bottom-4 z-40 flex justify-center">
      <ul className="glass-card flex w-[calc(100%-2rem)] max-w-lg items-center justify-around rounded-[26px] px-5 py-3 text-emerald-800 shadow-lg shadow-emerald-900/5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => router.push(item.href)}
                className={clsx(
                  'flex flex-col items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition',
                  isActive ? 'text-emerald-700' : 'text-emerald-500 hover:text-emerald-700',
                )}
              >
                <Icon
                  className={clsx(
                    'h-5 w-5 transition',
                    isActive
                      ? 'stroke-emerald-700 drop-shadow-[0_4px_10px_rgba(34,197,94,0.35)]'
                      : 'stroke-emerald-400',
                  )}
                />
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
