'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn('mb-2 block text-sm font-semibold text-[var(--color-text)]', className)}
        {...props}
      >
        {children}
      </label>
    );
  },
);

Label.displayName = 'Label';
