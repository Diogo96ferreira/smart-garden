'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Sprout, HelpCircle, Sparkles, CalendarDays } from 'lucide-react';
import clsx from 'clsx';

export default function BottomBar() {
  const router = useRouter();
  const pathname = usePathname();

  const items = [
    { id: 'home', icon: Home, href: '/dashboard', color: '#166534' },
    { id: 'garden', icon: Sprout, href: '/garden', color: '#166534' },
    { id: 'calendar', icon: CalendarDays, href: '/calendar', color: '#166534' },
    { id: 'ai', icon: Sparkles, href: '/ai', color: '#166534' },
    { id: 'settings', icon: HelpCircle, href: '/settings', color: '#166534' },
  ];

  const [active, setActive] = useState(
    items.find((i) => pathname.startsWith(i.href))?.id || 'home',
  );

  const handleClick = (id: string, href: string) => {
    setActive(id);
    router.push(href);
  };

  return (
    <div
      className={clsx(
        'fixed right-0 bottom-0 left-0 z-50 flex items-end justify-center transition-colors duration-500',
      )}
    >
      <ul className="relative flex h-[60px] w-full max-w-md items-end justify-around bg-[#f9f8fa] shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;

          return (
            <li
              key={item.id}
              onClick={() => handleClick(item.id, item.href)}
              className={clsx(
                'relative flex h-[60px] w-[60px] cursor-pointer items-center justify-center rounded-t-full transition-all duration-300',
                isActive ? '-top-3' : 'top-0',
              )}
            >
              {/* Ícone */}
              <div
                className={clsx(
                  'flex h-[60px] w-[60px] items-center justify-center rounded-full transition-all duration-300',
                  isActive ? 'text-white' : 'bg-[#f9f8fa] text-gray-400',
                )}
                style={{
                  backgroundColor: '#f9f8fa',
                  color: isActive ? item.color : '#a3a3a3',
                }}
              >
                <Icon className={clsx('h-6 w-6 transition-transform', isActive && 'scale-110')} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
