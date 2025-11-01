'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

type TabsProps = React.PropsWithChildren<{
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}>;

export function Tabs({ value, defaultValue, onValueChange, className, children }: TabsProps) {
  const isControlled = typeof value === 'string';
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? '');

  const currentValue = isControlled ? (value as string) : internalValue;

  const setValue = React.useCallback(
    (newValue: string) => {
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [isControlled, onValueChange],
  );

  React.useEffect(() => {
    if (!defaultValue && !value && React.Children.count(children) > 0) {
      const firstTrigger = React.Children.toArray(children)
        .flatMap((child) =>
          React.isValidElement(child) && (child.props as Record<string, unknown>).value
            ? [(child.props as Record<string, string>).value]
            : [],
        )
        .at(0);
      if (firstTrigger && !isControlled) {
        setInternalValue(firstTrigger);
      }
    }
  }, [children, defaultValue, isControlled, value]);

  return (
    <TabsContext.Provider value={{ value: currentValue, setValue }}>
      <div className={cn('flex flex-col gap-2', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

type TabsListProps = React.HTMLAttributes<HTMLDivElement>;

export function TabsList({ className, ...props }: TabsListProps) {
  return <div className={cn('inline-flex items-center gap-2', className)} {...props} />;
}

type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
  activeClassName?: string;
};

export function TabsTrigger({
  className,
  value,
  children,
  activeClassName,
  ...props
}: TabsTriggerProps) {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('TabsTrigger must be used within a Tabs component');
  }

  const isActive = context.value === value;

  return (
    <button
      type="button"
      onClick={() => context.setValue(value)}
      className={cn(
        'relative inline-flex items-center justify-center px-3 py-2 text-sm font-semibold transition-all duration-200',
        isActive
          ? 'text-[var(--color-primary-strong)]'
          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
        isActive && activeClassName,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

type TabsContentProps = React.HTMLAttributes<HTMLDivElement> & {
  value: string;
};

export function TabsContent({ className, value, children, ...props }: TabsContentProps) {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('TabsContent must be used within a Tabs component');
  }

  if (context.value !== value) return null;

  return (
    <div className={cn('rounded-[var(--radius-lg)]', className)} {...props}>
      {children}
    </div>
  );
}
