'use client';

import { useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

type Props = {
  onBack: () => void;
  onFinish: () => void;
};

export function StepReady({ onBack, onFinish }: Props) {
  const handleFinish = useCallback(async () => {
    try {
      const raw = localStorage.getItem('userPlants');
      if (raw) {
        const ids = JSON.parse(raw) as string[];
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id;
        if (userId && Array.isArray(ids) && ids.length) {
          const catalogueRaw = sessionStorage.getItem('onboarding.catalogue');
          if (catalogueRaw) {
            const list = JSON.parse(catalogueRaw) as {
              id: string;
              name: string;
              wateringFrequencyDays?: number;
            }[];
            const payload = ids
              .map((id) => list.find((v) => v.id === id))
              .filter((v): v is { id: string; name: string; wateringFrequencyDays?: number } =>
                Boolean(v),
              )
              .map((v) => ({
                user_id: userId,
                name: v.name,
                type: 'horta',
                watering_freq: Math.max(1, Math.min(60, Number(v.wateringFrequencyDays ?? 3))),
              }));
            if (payload.length) {
              await supabase
                .from('plants')
                .upsert(payload, { onConflict: 'user_id,name', ignoreDuplicates: true });
            }
          }
        }
      }
    } catch {}
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (userId) {
        // Prefer server column, fall back to auth metadata for compatibility
        const completionPayload: Record<string, unknown> = { id: userId, 'has-onboarding': true };
        const { error } = await supabase
          .from('users')
          .upsert(completionPayload, { onConflict: 'id' });
        if (error && error.code === '42703') {
          // Fallback to a snake_case column name if it exists instead
          await supabase
            .from('users')
            .upsert({ id: userId, has_onboarding: true }, { onConflict: 'id' });
        }
        await supabase.auth.updateUser({
          data: {
            onboarding_complete: true,
            onboarding_completed_at: new Date().toISOString(),
          },
        });
      }
      // Keep local flag in sync so subsequent navigations avoid onboarding immediately
      localStorage.setItem('onboardingComplete', 'true');
    } catch {
      /* ignore */
    }
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleFinish();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleFinish, onBack]);

  return (
    <section className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-4xl flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="w-full rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
        <Image
          src="/onboarding/tia-final.png"
          width={640}
          height={420}
          alt="Tia Adélia a plantar uma muda ao pôr-do-sol."
          className="h-auto w-full rounded-[var(--radius-md)] object-cover"
        />
      </div>

      <div className="flex flex-col items-center gap-4">
        <p className="eyebrow">🌇 Step 6</p>
        <h2 className="text-display text-4xl leading-tight sm:text-5xl">Vamos plantar juntos!</h2>
        <p className="max-w-2xl text-lg text-[var(--color-text-muted)] sm:text-xl">
          Está tudo pronto para iniciar a sua horta inteligente com a Tia Adélia. Vamos cuidar das
          suas plantas passo a passo e celebrar cada colheita.
        </p>
      </div>

      <div className="flex w-full max-w-md gap-3">
        <Button variant="secondary" size="lg" className="w-full" onClick={onBack}>
          Voltar
        </Button>
        <Button size="lg" className="w-full" onClick={handleFinish}>
          Começar a minha horta
        </Button>
      </div>
    </section>
  );
}
