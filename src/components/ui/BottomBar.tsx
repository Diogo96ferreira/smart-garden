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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-200 bg-white/80 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-center justify-around px-4 py-3 text-emerald-700">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => router.push(item.href)}
                className={clsx(
                  'flex flex-col items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition',
                  isActive ? 'text-emerald-600' : 'text-emerald-400 hover:text-emerald-600',
                )}
              >
                <Icon
                  className={clsx('h-5 w-5', isActive && 'fill-emerald-100 stroke-emerald-600')}
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
