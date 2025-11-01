'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', leadingIcon, trailingIcon, ...props }, ref) => {
    const hasLeading = Boolean(leadingIcon);
    const hasTrailing = Boolean(trailingIcon);

    return (
      <div className="relative">
        {hasLeading && (
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-text-muted)]">
            {leadingIcon}
          </span>
        )}

        <input
          ref={ref}
          type={type}
          className={cn(
            'h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-base text-[var(--color-text)] transition-colors duration-200 placeholder:text-[var(--color-text-muted)] focus-visible:border-[var(--color-primary)] focus-visible:shadow-[var(--shadow-ring)] focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-[var(--color-surface-muted)]',
            hasLeading && 'pl-10',
            hasTrailing && 'pr-10',
            className,
          )}
          {...props}
        />

        {hasTrailing && (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[var(--color-text-muted)]">
            {trailingIcon}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
