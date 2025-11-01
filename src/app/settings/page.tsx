'use client';

import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]">
        <Settings2 className="h-7 w-7" />
      </div>
      <div className="space-y-4">
        <h1 className="text-display text-3xl sm:text-4xl">Preferências da conta</h1>
        <p className="text-sm text-[var(--color-text-muted)] sm:text-base">
          Actualize os dados do perfil, defina notificações e personalize as recomendações de acordo
          com o seu estilo de cultivo. Brevemente poderá gerir tudo aqui.
        </p>
      </div>
      <Button variant="secondary" size="lg">
        Gerar relatório semanal
      </Button>
    </main>
  );
}
