'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import type { Plant } from '@/types';

type FormState = {
  name: string;
  image_url: string;
  watering_freq: number;
  type: 'horta' | 'pomar';
};

export default function MyGarden() {
  const router = useRouter();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'horta' | 'pomar'>('horta');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: '',
    image_url: '',
    watering_freq: 3,
    type: 'horta',
  });
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiComment, setAiComment] = useState<string | null>(null);

  useEffect(() => {
    void fetchPlants();
  }, []);

  async function fetchPlants(): Promise<void> {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      const sanitized = (data ?? []).map((plant) => ({
        ...plant,
        type: plant.type === 'pomar' ? 'pomar' : 'horta',
      })) as Plant[];
      setPlants(sanitized);
    } catch (error) {
      console.error('Erro ao buscar plantas:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileName = `${crypto.randomUUID()}-${file.name}`;
      const uploadResponse = await supabase.storage.from('plants').upload(fileName, file);
      if (uploadResponse.error) throw uploadResponse.error;

      const {
        data: { publicUrl },
      } = supabase.storage.from('plants').getPublicUrl(fileName);

      setForm((prev) => ({ ...prev, image_url: publicUrl }));
      setPreview(publicUrl);

      setAnalyzing(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/build-plant', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Falha ao analisar imagem.');

      const dataAI: {
        result: {
          type: string;
          species?: string;
          gardenType?: string;
          message?: string;
        };
      } = await res.json();

      const result = dataAI.result;
      let wateringFreq = form.watering_freq;

      try {
        const wateringRes = await fetch('/api/watering', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: result.type,
            species: result.species ?? '',
          }),
        });

        if (wateringRes.ok) {
          const wateringData: { watering_freq: number } = await wateringRes.json();
          wateringFreq = wateringData.watering_freq || wateringFreq;
        }
      } catch (error) {
        console.error('Erro ao obter frequência de rega:', error);
      }

      setForm((prev) => ({
        ...prev,
        name: result.type || prev.name,
        watering_freq: wateringFreq,
        type: result.gardenType === 'pomar' ? 'pomar' : prev.type,
      }));
      setAiComment(result.message ?? null);
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  }

  async function handleAddPlant(): Promise<void> {
    if (!form.name.trim()) return;

    try {
      const { error } = await supabase.from('plants').insert([
        {
          name: form.name.trim(),
          image_url: form.image_url || null,
          watering_freq: form.watering_freq,
          type: form.type,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      setAddOpen(false);
      setForm({ name: '', image_url: '', watering_freq: 3, type: 'horta' });
      setPreview(null);
      setAiComment(null);
      await fetchPlants();
    } catch (error) {
      console.error('Erro ao adicionar planta:', error);
    }
  }

  function openEditModal(plant: Plant): void {
    setSelectedPlant({ ...plant, type: plant.type === 'pomar' ? 'pomar' : 'horta' });
    setEditOpen(true);
  }

  async function handleUpdatePlant(): Promise<void> {
    if (!selectedPlant) return;

    try {
      const { error } = await supabase
        .from('plants')
        .update({
          name: selectedPlant.name,
          watering_freq: selectedPlant.watering_freq,
          type: selectedPlant.type,
        })
        .eq('id', selectedPlant.id);

      if (error) throw error;
      setEditOpen(false);
      await fetchPlants();
    } catch (error) {
      console.error('Erro ao atualizar planta:', error);
    }
  }

  async function handleDeletePlant(): Promise<void> {
    if (!selectedPlant) return;
    if (!confirm('Tens a certeza que queres eliminar esta planta?')) return;

    try {
      const { error } = await supabase.from('plants').delete().eq('id', selectedPlant.id);
      if (error) throw error;
      setEditOpen(false);
      await fetchPlants();
    } catch (error) {
      console.error('Erro ao eliminar planta:', error);
    }
  }

  const filteredPlants = useMemo(
    () => plants.filter((plant) => plant.type === activeTab),
    [plants, activeTab],
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="h-12 w-12 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-10 pb-24">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="space-y-3 text-center text-emerald-900">
          <p className="text-sm tracking-[0.3em] text-emerald-500 uppercase">Mapa vivo</p>
          <h1 className="text-3xl font-semibold">As tuas plantas e árvores</h1>
          <p className="text-sm text-emerald-700/80">
            Alterna entre a horta e o pomar para veres como está cada canto do jardim.
          </p>
        </header>

        <div className="mx-auto flex w-full max-w-md gap-2 rounded-full border border-emerald-200 bg-white/60 p-1 shadow-sm">
          {(
            [
              { value: 'horta', label: 'Horta' },
              { value: 'pomar', label: 'Pomar' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.value
                  ? 'bg-emerald-500 text-white shadow'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filteredPlants.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-emerald-200 bg-white/50 p-12 text-center text-sm text-emerald-700/80">
            {activeTab === 'horta'
              ? 'Ainda não tens nada na horta.'
              : 'O pomar está à espera da primeira árvore.'}
          </div>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlants.map((plant) => (
              <article
                key={plant.id}
                onClick={() => router.push(`/garden/${plant.id}`)}
                className="group flex cursor-pointer flex-col gap-4 rounded-3xl border border-transparent bg-white/70 p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
              >
                <div className="overflow-hidden rounded-2xl bg-emerald-100">
                  {plant.image_url ? (
                    <Image
                      src={plant.image_url}
                      alt={plant.name}
                      width={400}
                      height={240}
                      className="h-40 w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center text-4xl">
                      {plant.type === 'pomar' ? '🍊' : '🌿'}
                    </div>
                  )}
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-emerald-900">{plant.name}</h2>
                    <p className="text-xs tracking-[0.3em] text-emerald-500 uppercase">
                      Rega a cada {plant.watering_freq} dias
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openEditModal(plant);
                    }}
                    className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-500 hover:text-white"
                  >
                    editar
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      <button
        type="button"
        onClick={() => setAddOpen(true)}
        className="fixed right-6 bottom-24 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition hover:bg-emerald-600"
        aria-label="Adicionar planta"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Adicionar nova planta">
        <div className="space-y-4">
          <label className="flex flex-col gap-2 text-sm text-emerald-900">
            Nome
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="rounded-xl border border-emerald-200 bg-white/70 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              placeholder="Ex.: Tomate coração de boi"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-emerald-900">
            Fotografia
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="rounded-xl border border-dashed border-emerald-300 bg-white/70 px-3 py-2 text-sm"
            />
          </label>

          {uploading && <p className="text-xs text-emerald-600">A enviar imagem...</p>}
          {analyzing && (
            <p className="text-xs text-emerald-600">A Tia Adélia está a observar a planta...</p>
          )}

          {preview && (
            <div className="overflow-hidden rounded-2xl border border-emerald-200">
              <Image
                src={preview}
                alt="Pré-visualização"
                width={400}
                height={260}
                className="h-48 w-full object-cover"
              />
            </div>
          )}

          {aiComment && (
            <p className="rounded-2xl bg-emerald-50 p-3 text-xs text-emerald-700">{aiComment}</p>
          )}

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
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setAddOpen(false)}
            className="rounded-full px-4 py-2 text-sm font-medium text-emerald-600 transition hover:text-emerald-800"
          >
            cancelar
          </button>
          <button
            type="button"
            onClick={handleAddPlant}
            className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
          >
            guardar
          </button>
        </div>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar planta">
        {selectedPlant && (
          <div className="space-y-4">
            <label className="flex flex-col gap-2 text-sm text-emerald-900">
              Nome
              <input
                type="text"
                value={selectedPlant.name}
                onChange={(event) =>
                  setSelectedPlant({ ...selectedPlant, name: event.target.value })
                }
                className="rounded-xl border border-emerald-200 bg-white/70 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-emerald-900">
              Frequência de rega (dias)
              <input
                type="number"
                min={1}
                value={selectedPlant.watering_freq ?? ''}
                onChange={(event) =>
                  setSelectedPlant({
                    ...selectedPlant,
                    watering_freq: event.target.value === '' ? 0 : Number(event.target.value) || 0,
                  })
                }
                className="rounded-xl border border-emerald-200 bg-white/70 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-emerald-900">
              Zona do jardim
              <select
                value={selectedPlant.type ?? 'horta'}
                onChange={(event) =>
                  setSelectedPlant({
                    ...selectedPlant,
                    type: event.target.value as 'horta' | 'pomar',
                  })
                }
                className="rounded-xl border border-emerald-200 bg-white/70 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              >
                <option value="horta">Horta</option>
                <option value="pomar">Pomar</option>
              </select>
            </label>
          </div>
        )}

        <div className="mt-6 flex justify-between gap-3">
          <button
            type="button"
            onClick={handleDeletePlant}
            className="rounded-full border border-rose-300 px-5 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-500 hover:text-white"
          >
            eliminar
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="rounded-full px-4 py-2 text-sm font-medium text-emerald-600 transition hover:text-emerald-800"
            >
              cancelar
            </button>
            <button
              type="button"
              onClick={handleUpdatePlant}
              className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
            >
              guardar
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/40 px-4 py-10">
      <div className="relative w-full max-w-lg rounded-3xl border border-emerald-200 bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-start justify-between">
          <h2 className="text-lg font-semibold text-emerald-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm font-medium text-emerald-600 transition hover:text-emerald-800"
            aria-label="Fechar"
          >
            fechar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
