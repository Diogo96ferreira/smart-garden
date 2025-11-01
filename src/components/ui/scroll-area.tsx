'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type ScrollAreaProps = React.HTMLAttributes<HTMLDivElement> & {
  maxHeight?: number | string;
};

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, style, maxHeight = 320, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'scroll-area relative w-full overflow-hidden rounded-[var(--radius-lg)] border border-transparent',
          className,
        )}
        style={{ maxHeight, ...style }}
        {...props}
      >
        <div className="h-full w-full overflow-y-auto pr-2">{children}</div>
      </div>
    );
  },
);

ScrollArea.displayName = 'ScrollArea';
