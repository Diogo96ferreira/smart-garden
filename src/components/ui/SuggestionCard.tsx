'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

export default function SuggestionCard({
  title,
  description,
  primaryLabel,
  onPrimary,
  primaryVariant = 'default',
  secondaryLabel,
  onSecondary,
  onDismiss,
  dismissLabel,
}: {
  title: string;
  description?: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryVariant?: 'default' | 'secondary' | 'ghost';
  secondaryLabel?: string;
  onSecondary?: () => void;
  onDismiss?: () => void;
  dismissLabel?: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
      <h3 className="font-semibold text-[var(--color-text)]">{title}</h3>
      {description && <p className="mt-2 text-sm text-[var(--color-text-muted)]">{description}</p>}
      <div className="mt-3 flex items-center gap-2">
        {primaryLabel && (
          <Button size="sm" variant={primaryVariant as any} onClick={onPrimary}>
            {primaryLabel}
          </Button>
        )}
        {secondaryLabel && (
          <Button size="sm" variant="secondary" onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        )}
        {onDismiss && (
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            {dismissLabel || 'Dismiss'}
          </Button>
        )}
      </div>
    </div>
  );
}
