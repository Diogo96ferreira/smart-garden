'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import { CalendarDays, HelpCircle, Home, Sparkles, Sprout } from 'lucide-react';

type BottomBarProps = {
  locale: 'pt' | 'en';
  currentPath: string;
};

type NavItem = {
  id: string;
  icon: LucideIcon;
  href: string;
  color: string;
  label: string;
};

const BASE_ITEMS: NavItem[] = [
  { id: 'home', icon: Home, href: '/dashboard', color: '#166534', label: 'Dashboard' },
  { id: 'garden', icon: Sprout, href: '/garden', color: '#166534', label: 'Garden' },
  { id: 'calendar', icon: CalendarDays, href: '/calendar', color: '#166534', label: 'Calendar' },
  { id: 'ai', icon: Sparkles, href: '/ai', color: '#166534', label: 'AI assistant' },
  { id: 'settings', icon: HelpCircle, href: '/settings', color: '#166534', label: 'Settings' },
];

export default function BottomBar({ locale, currentPath }: BottomBarProps) {
  const items = useMemo(
    () =>
      BASE_ITEMS.map((item) => ({
        ...item,
        href: `/${locale}${item.href}`,
      })),
    [locale],
  );

  const activeId = useMemo(() => {
    const exact = items.find((item) => item.href === currentPath);
    if (exact) return exact.id;
    const byPrefix = [...items].sort((a, b) => b.href.length - a.href.length);
    return byPrefix.find((item) => currentPath.startsWith(item.href))?.id ?? 'home';
  }, [currentPath, items]);

  return (
    <>
      {/* Mobile bottom bar */}
      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-50 flex items-end justify-center transition-colors duration-500 md:hidden"
      >
        <ul className="relative flex h-[60px] w-full max-w-md items-end justify-around border-t border-[color:var(--color-border)] bg-[var(--color-surface)] shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeId;

            return (
              <li
                key={item.id}
                className={clsx(
                  'relative flex h-[60px] w-[60px] items-center justify-center rounded-t-full transition-all duration-300',
                  isActive ? '-top-3' : 'top-0',
                )}
              >
                <Link
                  href={item.href}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={clsx(
                    'flex h-[60px] w-[60px] items-center justify-center rounded-full transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] focus-visible:outline-none',
                    isActive
                      ? 'shadow-[0_6px_14px_rgba(16,185,129,0.25)]'
                      : 'text-[color:var(--color-text-muted)] hover:text-[var(--color-primary-strong)]',
                  )}
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    color: isActive ? item.color : 'var(--color-text-muted)',
                  }}
                >
                  <Icon className={clsx('h-6 w-6 transition-transform', isActive && 'scale-110')} />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Desktop sidebar */}
      <nav
        aria-label="Main navigation"
        className="hidden md:fixed md:inset-y-0 md:left-6 md:z-40 md:flex md:flex-col md:justify-center"
      >
        <ul className="flex max-h-[80vh] flex-col gap-2 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/90 p-2 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeId;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={clsx(
                    'group flex items-center gap-3 rounded-xl px-3 py-2 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] focus-visible:outline-none',
                    isActive
                      ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-primary-strong)]',
                  )}
                >
                  <Icon
                    className={clsx('h-5 w-5 flex-none', isActive && 'scale-105')}
                    style={{ color: isActive ? item.color : undefined }}
                  />
                  <span className="hidden text-sm font-medium text-[var(--color-text)] group-hover:text-[var(--color-primary-strong)] xl:inline">
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
