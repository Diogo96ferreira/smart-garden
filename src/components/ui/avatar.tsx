'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export type AvatarProps = React.HTMLAttributes<HTMLDivElement> & {
  src?: string | null;
  fallback?: string;
  alt?: string;
  size?: number; // pixel size of the avatar circle
};

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, children, size = 40, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary-soft)] text-sm font-semibold text-[var(--color-primary-strong)]',
          className,
        )}
        style={{ width: size, height: size, ...style }}
        {...props}
      >
        {src ? (
          <Image
            src={src}
            alt={alt ?? fallback ?? 'avatar'}
            fill
            sizes={`${size}px`}
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
