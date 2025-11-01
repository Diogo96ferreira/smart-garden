'use client';

export function LeafLoader({ label = 'A preparar a sua horta...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-soft)]">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-primary-strong)] border-t-transparent" />
      </span>
      <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
    </div>
  );
}
