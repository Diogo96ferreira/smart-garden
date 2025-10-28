'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import type { Plant } from '@/types';

const formatDateInput = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const formatFriendlyDate = (value: string | null) => {
  if (!value) return 'Ainda não foi registada uma rega.';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data desconhecida.';
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function PlantDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const plantId = useMemo(() => {
    const idParam = params?.id;
    return Array.isArray(idParam) ? idParam[0] : idParam;
  }, [params]);

  const [plant, setPlant] = useState<Plant | null>(null);
  const [form, setForm] = useState({
    name: '',
    watering_freq: 3,
    type: 'horta' as 'horta' | 'pomar',
    image_url: '',
    last_watered: null as string | null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!plantId) return;

    const fetchPlant = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('plants')
          .select('*')
          .eq('id', plantId)
          .single();
        if (error) throw error;
        if (!data) {
          setPlant(null);
          return;
        }

        const sanitized: Plant = {
          ...data,
          type: data.type === 'pomar' ? 'pomar' : 'horta',
        };

        setPlant(sanitized);
        setForm({
          name: sanitized.name,
          watering_freq: sanitized.watering_freq,
          type: sanitized.type ?? 'horta',
          image_url: sanitized.image_url ?? '',
          last_watered: sanitized.last_watered ?? null,
        });
      } catch (error) {
        console.error('Erro ao carregar a planta:', error);
        setStatus('Não foi possível carregar esta planta.');
      } finally {
        setLoading(false);
      }
    };

    void fetchPlant();
  }, [plantId]);

  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(null), 4000);
    return () => clearTimeout(timer);
  }, [status]);

  const nextWateringDate = useMemo(() => {
    if (!form.last_watered) return null;
    const base = new Date(form.last_watered);
    if (Number.isNaN(base.getTime())) return null;
    base.setDate(base.getDate() + (form.watering_freq || 0));
    return base;
  }, [form.last_watered, form.watering_freq]);

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      const fileName = `${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabase.storage.from('plants').upload(fileName, file);
      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from('plants').getPublicUrl(fileName);

      setForm((prev) => ({ ...prev, image_url: publicUrl }));
      setStatus('Imagem actualizada.');
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      setStatus('Não foi possível actualizar a imagem.');
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    void handleImageUpload(file);
  };

  const handleSave = useCallback(async () => {
    if (!plantId) return;

    try {
      setSaving(true);
      const payload = {
        name: form.name,
        watering_freq: form.watering_freq,
        type: form.type,
        image_url: form.image_url || null,
        last_watered: form.last_watered ? new Date(form.last_watered).toISOString() : null,
      };

      const { error } = await supabase.from('plants').update(payload).eq('id', plantId);
      if (error) throw error;

      setPlant((prev) => (prev ? { ...prev, ...payload } : prev));
      setStatus('Planta guardada com sucesso.');
    } catch (error) {
      console.error('Erro ao guardar planta:', error);
      setStatus('Não foi possível guardar as alterações.');
    } finally {
      setSaving(false);
    }
  }, [form, plantId]);

  const handleMarkWatered = useCallback(async () => {
    if (!plantId) return;

    try {
      setSaving(true);
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('plants')
        .update({ last_watered: now })
        .eq('id', plantId);
      if (error) throw error;

      setForm((prev) => ({ ...prev, last_watered: now }));
      setPlant((prev) => (prev ? { ...prev, last_watered: now } : prev));
      setStatus('Registo de rega actualizado.');
    } catch (error) {
      console.error('Erro ao actualizar rega:', error);
      setStatus('Não foi possível actualizar a rega.');
    } finally {
      setSaving(false);
    }
  }, [plantId]);

  const handleDelete = useCallback(async () => {
    if (!plantId) return;
    if (!confirm('Tens a certeza que queres remover esta planta?')) return;

    try {
      const { error } = await supabase.from('plants').delete().eq('id', plantId);
      if (error) throw error;
      router.push('/garden');
    } catch (error) {
      console.error('Erro ao eliminar planta:', error);
      setStatus('Não foi possível eliminar a planta.');
    }
  }, [plantId, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="h-12 w-12 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </main>
    );
  }

  if (!plant) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="rounded-3xl border border-emerald-200 bg-white/70 p-8 text-center text-sm text-emerald-800">
          Não encontrámos esta planta.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-10 pb-24">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <button
          type="button"
          onClick={() => router.push('/garden')}
          className="text-sm font-medium text-emerald-600 transition hover:text-emerald-800"
        >
          ← voltar à lista
        </button>

        <header className="space-y-2 text-emerald-900">
          <p className="text-xs tracking-[0.3em] text-emerald-500 uppercase">
            {plant.type === 'pomar' ? 'Pomar' : 'Horta'}
          </p>
          <h1 className="text-3xl font-semibold">{plant.name}</h1>
          <p className="text-sm text-emerald-700/80">
            Actualiza a frequência de rega ou envia uma fotografia recente.
          </p>
        </header>

        {status && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {status}
          </div>
        )}

        <section className="grid gap-8 md:grid-cols-[260px_1fr]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-white/70">
              {form.image_url ? (
                <Image
                  src={form.image_url}
                  alt={form.name}
                  width={400}
                  height={320}
                  className="h-64 w-full object-cover"
                />
              ) : (
                <div className="flex h-64 items-center justify-center text-5xl">
                  {plant.type === 'pomar' ? '🍊' : '🌿'}
                </div>
              )}
            </div>
            <label className="flex flex-col gap-2 text-sm text-emerald-900">
              Actualizar fotografia
              <input
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="rounded-xl border border-dashed border-emerald-300 bg-white/70 px-3 py-2 text-sm"
              />
            </label>
            {uploading && <p className="text-xs text-emerald-600">A carregar imagem...</p>}
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-emerald-900">
                Nome
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="rounded-xl border border-emerald-200 bg-white/70 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-emerald-900">
                Frequência de rega (dias)
                <input
                  type="number"
                  min={1}
                  value={form.watering_freq || ''}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      watering_freq:
                        event.target.value === '' ? 0 : Number(event.target.value) || 0,
                    })
                  }
                  className="rounded-xl border border-emerald-200 bg-white/70 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-emerald-900">
                Zona do jardim
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm({ ...form, type: event.target.value as 'horta' | 'pomar' })
                  }
                  className="rounded-xl border border-emerald-200 bg-white/70 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                >
                  <option value="horta">Horta</option>
                  <option value="pomar">Pomar</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm text-emerald-900">
                Última rega
                <input
                  type="date"
                  value={formatDateInput(form.last_watered)}
                  onChange={(event) =>
                    setForm({ ...form, last_watered: event.target.value || null })
                  }
                  className="rounded-xl border border-emerald-200 bg-white/70 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                />
              </label>
            </div>

            <div className="rounded-3xl border border-emerald-200 bg-white/70 p-6 text-sm text-emerald-800">
              <p className="font-semibold text-emerald-900">Próxima rega prevista</p>
              <p className="mt-2 text-emerald-700/80">
                {nextWateringDate
                  ? nextWateringDate.toLocaleDateString('pt-PT', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                    })
                  : 'Regista a última rega para prever a próxima.'}
              </p>
              <p className="mt-4 text-xs tracking-[0.3em] text-emerald-500 uppercase">
                Última rega: {formatFriendlyDate(form.last_watered)}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-60"
              >
                {saving ? 'A guardar...' : 'Guardar alterações'}
              </button>
              <button
                type="button"
                onClick={handleMarkWatered}
                disabled={saving}
                className="rounded-full border border-emerald-300 px-6 py-2 text-sm font-medium text-emerald-700 transition hover:border-emerald-400 hover:text-emerald-800 disabled:opacity-60"
              >
                Registar rega agora
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="ml-auto rounded-full border border-rose-300 px-6 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-500 hover:text-white"
              >
                Remover planta
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
