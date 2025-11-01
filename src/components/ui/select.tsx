'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type SelectContextValue = {
  value?: string;
  setValue: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

type SelectProps = React.PropsWithChildren<{
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}>;

export function Select({
  value,
  defaultValue,
  onValueChange,
  disabled,
  placeholder,
  children,
}: SelectProps) {
  const isControlled = typeof value !== 'undefined';
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);

  const resolvedValue = isControlled ? value : internalValue;

  const setValue = React.useCallback(
    (nextValue: string) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
      setOpen(false);
    },
    [isControlled, onValueChange],
  );

  return (
    <SelectContext.Provider
      value={{
        value: resolvedValue,
        setValue,
        open,
        setOpen: disabled ? () => undefined : setOpen,
        placeholder,
        disabled,
      }}
    >
      <div className="relative inline-flex w-full">{children}</div>
    </SelectContext.Provider>
  );
}

type SelectTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function SelectTrigger({ className, children, ...props }: SelectTriggerProps) {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error('SelectTrigger must be used within a Select component');
  }

  return (
    <button
      type="button"
      className={cn(
        'flex h-12 w-full items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-left text-sm font-medium text-[var(--color-text)] shadow-sm transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-[var(--color-surface-muted)] disabled:text-[var(--color-text-muted)]',
        className,
      )}
      onClick={() => context.setOpen(!context.open)}
      disabled={context.disabled}
      {...props}
    >
      {children}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        aria-hidden
        className={cn(
          'ml-3 h-4 w-4 text-[var(--color-text-muted)] transition-transform duration-200',
          context.open && 'rotate-180',
        )}
      >
        <path fill="currentColor" d="M7 10l5 5 5-5z" />
      </svg>
    </button>
  );
}

type SelectValueProps = {
  placeholder?: string;
  className?: string;
};

export function SelectValue({ placeholder, className }: SelectValueProps) {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error('SelectValue must be used within a Select component');
  }

  const displayValue = context.value;
  const effectivePlaceholder = placeholder ?? context.placeholder ?? 'Selecione';

  return (
    <span
      className={cn(
        'flex-1 truncate text-sm',
        displayValue ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]',
        className,
      )}
    >
      {displayValue ?? effectivePlaceholder}
    </span>
  );
}

type SelectContentProps = React.HTMLAttributes<HTMLDivElement>;

export function SelectContent({ className, children, ...props }: SelectContentProps) {
  const context = React.useContext(SelectContext);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!contentRef.current) return;
      if (!contentRef.current.contains(event.target as Node)) {
        context.setOpen(false);
      }
    }
    if (context.open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [context]);

  if (!context.open) return null;

  return (
    <div
      ref={contentRef}
      className={cn(
        'absolute bottom-full z-50 mb-2 w-full translate-y-[-6px] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)]',
        className,
      )}
      {...props}
    >
      <div className="max-h-56 overflow-y-auto py-2">{children}</div>
    </div>
  );
}

type SelectGroupProps = React.HTMLAttributes<HTMLDivElement>;
export function SelectGroup({ className, ...props }: SelectGroupProps) {
  return <div className={cn('flex flex-col gap-1 py-1', className)} {...props} />;
}

type SelectItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
};

export function SelectItem({ className, value, children, ...props }: SelectItemProps) {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error('SelectItem must be used within a Select component');
  }
  const isSelected = context.value === value;

  return (
    <button
      type="button"
      onClick={() => context.setValue(value)}
      className={cn(
        'flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors hover:bg-[var(--color-primary-soft)]',
        isSelected
          ? 'font-semibold text-[var(--color-primary-strong)]'
          : 'text-[var(--color-text)]',
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      {isSelected && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          className="text-[var(--color-primary-strong)]"
        >
          <path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      )}
    </button>
  );
}
