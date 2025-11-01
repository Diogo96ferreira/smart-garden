'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

type DialogContextValue = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

type DialogProps = React.PropsWithChildren<{
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}>;

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>;
}

type DialogContentProps = React.HTMLAttributes<HTMLDivElement> & {
  backdropClassName?: string;
};

export function DialogContent({
  className,
  backdropClassName,
  children,
  ...props
}: DialogContentProps) {
  const context = React.useContext(DialogContext);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!context || !context.open || !mounted) return null;

  const handleClose = () => context.onOpenChange?.(false);

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm',
        backdropClassName,
      )}
      onClick={handleClose}
    >
      <div
        className={cn(
          'w-full max-w-lg rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]',
          className,
        )}
        onClick={(event) => event.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex flex-col gap-1', className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn('text-xl font-semibold text-[var(--color-text)]', className)} {...props} />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-[var(--color-text-muted)]', className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}
