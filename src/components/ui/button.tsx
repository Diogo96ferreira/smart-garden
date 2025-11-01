'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'tonal' | 'destructive' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-r from-green-400 via-green-500 to-emerald-600 
    text-white font-semibold
    shadow-[0_6px_16px_rgba(34,197,94,0.25)]
    hover:from-green-500 hover:via-emerald-600 hover:to-emerald-700
    hover:shadow-[0_8px_20px_rgba(16,185,129,0.35)]
    active:scale-[0.97]
    transition-all duration-300 ease-out
    focus-visible:ring-[rgba(16,185,129,0.45)]
  `,
  tonal: `
    bg-[var(--color-primary-soft)] 
    text-[var(--color-primary-strong)] 
    hover:bg-[#c7e4d2]
    focus-visible:ring-[var(--color-primary)]
  `,
  secondary: `
    bg-[var(--color-surface-muted)]
    text-[var(--color-text)]
    hover:bg-[var(--color-surface-strong)]
    focus-visible:ring-[var(--color-border)]
  `,
  outline: `
    border border-[var(--color-border)]
    text-[var(--color-text)]
    hover:border-[var(--color-primary)]
    hover:text-[var(--color-primary-strong)]
    focus-visible:ring-[var(--color-primary)]
  `,
  ghost: `
    text-[var(--color-text-muted)]
    hover:bg-[var(--color-surface-muted)]
    focus-visible:ring-[var(--color-border)]
  `,
  destructive: `
    bg-[#d64545] text-white 
    hover:bg-[#b83636] 
    focus-visible:ring-[#d64545]
  `,
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 rounded-full px-4 text-sm',
  md: 'h-11 rounded-full px-6 text-sm',
  lg: 'h-14 rounded-2xl px-8 text-base',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', icon, loading, children, disabled, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        disabled={disabled ?? loading}
        {...props}
      >
        {loading && (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        )}
        {!loading && icon}
        <span className="truncate">{children}</span>
      </button>
    );
  },
);

Button.displayName = 'Button';
