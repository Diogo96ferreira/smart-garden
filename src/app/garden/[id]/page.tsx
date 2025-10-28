'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Droplets, CalendarHeart, Leaf, Sparkles, Sun, ArrowLeft } from 'lucide-react';
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
        <div className="glass-card rounded-[28px] p-8 text-center text-sm text-emerald-900">
          Não encontrámos esta planta.
        </div>
      </main>
    );
  }

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-5 pt-16 pb-36">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.88)_0%,_rgba(220,252,231,0.65)_55%,_rgba(214,238,210,0.95)_100%)]" />

      <button
        type="button"
        onClick={() => router.push('/garden')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
      >
        <ArrowLeft className="h-4 w-4" /> voltar à horta
      </button>

      <header className="glass-card relative overflow-hidden px-6 py-8 sm:px-10">
        <div className="absolute top-0 -right-12 h-40 w-40 rounded-full bg-gradient-to-br from-[#22c55e]/30 to-[#0ea5e9]/20 blur-3xl" />
        <div className="grid gap-6 lg:grid-cols-[320px,1fr] lg:items-center">
          <div className="relative overflow-hidden rounded-[28px] border border-white/60">
            {form.image_url ? (
              <Image
                src={form.image_url}
                alt={form.name}
                width={480}
                height={360}
                className="h-64 w-full object-cover"
              />
            ) : (
              <div className="flex h-64 items-center justify-center text-6xl">
                {plant.type === 'pomar' ? '🍊' : '🌿'}
              </div>
            )}
          </div>
          <div className="space-y-4 text-emerald-900">
            <span className="chip-soft inline-flex items-center gap-2">
              <Leaf className="h-4 w-4" /> {plant.type === 'pomar' ? 'Pomar' : 'Horta'}
            </span>
            <h1 className="text-4xl leading-tight font-semibold">{plant.name}</h1>
            <p className="text-sm text-emerald-900/70">
              Actualiza a frequência de rega, regista imagens e acompanha as próximas tarefas desta
              planta.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoChip
                icon={<Droplets className="h-4 w-4 text-emerald-600" />}
                label="Rega"
                value={`a cada ${form.watering_freq} dias`}
              />
              <InfoChip
                icon={<Sun className="h-4 w-4 text-amber-500" />}
                label="Luz"
                value="Luz média"
              />
              <InfoChip
                icon={<Sparkles className="h-4 w-4 text-sky-500" />}
                label="Última rega"
                value={formatFriendlyDate(form.last_watered)}
              />
            </div>
          </div>
        </div>
      </header>

      {status && (
        <div className="rounded-[24px] bg-emerald-500/10 px-4 py-3 text-sm text-emerald-900">
          {status}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="glass-card rounded-[28px] p-6">
          <h2 className="text-xl font-semibold text-emerald-900">Dados principais</h2>
          <p className="text-sm text-emerald-900/70">
            Ajusta nome, categoria, frequência de rega e regista novas fotos para a Tia Adélia
            acompanhar a evolução.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-emerald-900">
              Nome
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="sg-input"
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
                    watering_freq: event.target.value === '' ? 0 : Number(event.target.value) || 0,
                  })
                }
                className="sg-input"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-emerald-900">
              Zona do jardim
              <select
                value={form.type}
                onChange={(event) =>
                  setForm({ ...form, type: event.target.value as 'horta' | 'pomar' })
                }
                className="sg-input sg-select"
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
                onChange={(event) => setForm({ ...form, last_watered: event.target.value || null })}
                className="sg-input"
              />
            </label>
          </div>
          <div className="mt-6 rounded-[24px] bg-emerald-500/10 p-6 text-sm text-emerald-900/80">
            <p className="font-semibold text-emerald-900">Próxima rega prevista</p>
            <p className="mt-2">
              {nextWateringDate
                ? nextWateringDate.toLocaleDateString('pt-PT', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                  })
                : 'Regista a última rega para prever a próxima.'}
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-emerald-800">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary disabled:opacity-60"
            >
              {saving ? 'A guardar...' : 'Guardar alterações'}
            </button>
            <button
              type="button"
              onClick={handleMarkWatered}
              disabled={saving}
              className="btn-secondary"
            >
              Registar rega agora
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="btn-secondary text-red-500 hover:text-red-600"
            >
              Remover planta
            </button>
          </div>
        </div>

        <aside className="glass-card flex flex-col gap-6 rounded-[28px] p-6">
          <div className="space-y-2">
            <p className="text-xs tracking-[0.3em] text-emerald-500 uppercase">
              Actualiza a fotografia
            </p>
            <p className="text-sm text-emerald-900/70">
              Carrega uma nova imagem para a Tia Adélia comparar evolução, detectar pragas e ajustar
              recomendações.
            </p>
          </div>
          <div className="rounded-[24px] border border-dashed border-emerald-300/70 bg-white/70 p-6 text-center text-sm text-emerald-900/70">
            <input
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="hidden"
              id="detail-image-upload"
            />
            <label
              htmlFor="detail-image-upload"
              className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
            >
              Actualizar fotografia
            </label>
            {uploading && <p className="mt-3 text-xs text-emerald-600">A carregar imagem...</p>}
          </div>
          <div className="rounded-[24px] bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 p-6 text-sm text-emerald-900/80">
            <p className="font-semibold text-emerald-900">Memórias da planta</p>
            <p className="mt-2">
              A Tia Adélia guarda este registo para adaptar alertas e mensagens motivacionais. Volta
              sempre que fizeres mudanças.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-emerald-900/70">
              <span className="rounded-full bg-white/70 px-4 py-1 tracking-[0.2em] uppercase">
                {plant.name}
              </span>
              <span className="rounded-full bg-white/70 px-4 py-1 tracking-[0.2em] uppercase">
                {plant.type}
              </span>
              <span className="rounded-full bg-white/70 px-4 py-1 tracking-[0.2em] uppercase">
                {form.watering_freq} dias
              </span>
            </div>
          </div>
          <div className="rounded-[24px] bg-white/70 p-5 text-sm text-emerald-900/70 shadow-inner">
            <p className="font-semibold text-emerald-900">Últimos registos</p>
            <ul className="mt-3 space-y-2">
              <li className="flex items-center gap-2">
                <CalendarHeart className="h-4 w-4 text-emerald-500" /> Última rega:{' '}
                {formatFriendlyDate(form.last_watered)}
              </li>
              <li className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-emerald-500" /> Frequência: a cada{' '}
                {form.watering_freq} dias
              </li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}

function InfoChip({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-white/70 p-4 text-sm text-emerald-900/80 shadow-sm">
      <span className="flex items-center gap-2 text-xs tracking-[0.25em] text-emerald-500 uppercase">
        {icon} {label}
      </span>
      <span className="mt-2 block text-base font-semibold text-emerald-900">{value}</span>
    </div>
  );
}
