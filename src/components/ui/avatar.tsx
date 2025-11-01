'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export type AvatarProps = React.HTMLAttributes<HTMLDivElement> & {
  src?: string | null;
  fallback?: string;
  alt?: string;
};

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary-soft)] text-sm font-semibold text-[var(--color-primary-strong)]',
          className,
        )}
        {...props}
      >
        {src ? (
          <Image
            src={src}
            alt={alt ?? fallback ?? 'avatar'}
            fill
            sizes="40px"
            className="object-cover"
          />
        ) : (
          (children ?? fallback)
        )}
      </div>
    );
  },
);

Avatar.displayName = 'Avatar';
