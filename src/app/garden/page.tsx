'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Leaf,
  Map,
  Plus,
  Sparkles,
  Sprout,
  Sun,
} from 'lucide-react';
import clsx from 'clsx';
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
    setForm({
      name: plant.name ?? '',
      image_url: plant.image_url ?? '',
      watering_freq: plant.watering_freq ?? 3,
      type: plant.type === 'pomar' ? 'pomar' : 'horta',
    });
    setPreview(plant.image_url ?? null);
    setEditOpen(true);
  }

  async function handleUpdatePlant(): Promise<void> {
    if (!selectedPlant) return;

    try {
      const { error } = await supabase
        .from('plants')
        .update({
          name: form.name.trim(),
          image_url: form.image_url || null,
          watering_freq: form.watering_freq,
          type: form.type,
        })
        .eq('id', selectedPlant.id);

      if (error) throw error;

      setEditOpen(false);
      setSelectedPlant(null);
      setForm({ name: '', image_url: '', watering_freq: 3, type: 'horta' });
      setPreview(null);
      await fetchPlants();
    } catch (error) {
      console.error('Erro ao atualizar planta:', error);
    }
  }

  async function handleDeletePlant(id: number): Promise<void> {
    try {
      const { error } = await supabase.from('plants').delete().eq('id', id);
      if (error) throw error;
      await fetchPlants();
    } catch (error) {
      console.error('Erro ao remover planta:', error);
    }
  }

  const filteredPlants = useMemo(() => {
    return plants.filter((plant) => plant.type === activeTab);
  }, [plants, activeTab]);

  const emptyStateMessage =
    activeTab === 'horta'
      ? 'Ainda não tens hortícolas adicionadas.'
      : 'Ainda não tens árvores no pomar.';

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-5 pt-16 pb-36">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.88)_0%,_rgba(220,252,231,0.62)_55%,_rgba(214,238,210,0.95)_100%)]" />

      <header className="glass-card relative overflow-hidden px-6 py-8 sm:px-10">
        <div className="absolute -top-14 right-8 h-40 w-40 rounded-full bg-gradient-to-br from-[#22c55e]/30 to-[#0ea5e9]/20 blur-3xl" />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3 md:max-w-3xl">
            <span className="chip-soft inline-flex items-center gap-2">
              <Map className="h-4 w-4" /> A minha horta virtual
            </span>
            <h1 className="text-4xl leading-tight font-semibold text-emerald-900">
              Vê o teu jardim a florescer em tempo real
            </h1>
            <p className="text-sm text-emerald-900/70">
              Alterna entre a horta e o pomar, acompanha sensores e abre as fichas de cada planta
              com um toque.
            </p>
          </div>
          <div className="rounded-[26px] bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 p-5 text-sm text-emerald-900/80">
            <p className="font-semibold text-emerald-900">Resumo do dia</p>
            <ul className="mt-2 space-y-1">
              <li className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-amber-500" /> 8h de sol previsto
              </li>
              <li className="flex items-center gap-2">
                <Sprout className="h-4 w-4 text-emerald-600" /> {plants.length} plantas no total
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sky-500" />{' '}
                {aiComment
                  ? 'Dica personalizada disponível'
                  : 'Carrega uma foto para receber dicas'}
              </li>
            </ul>
          </div>
        </div>
      </header>

      <section className="glass-card rounded-[32px] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2 rounded-full bg-white/80 p-2 shadow-inner">
            {[
              { id: 'horta', label: 'Horta' },
              { id: 'pomar', label: 'Pomar' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as 'horta' | 'pomar')}
                className={clsx(
                  'rounded-full px-4 py-2 text-sm font-semibold transition',
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-emerald-500 to-sky-400 text-white shadow-lg'
                    : 'text-emerald-600 hover:text-emerald-800',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-emerald-900/70">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1">
              <Leaf className="h-4 w-4 text-emerald-500" /> Mapa isométrico
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1">
              <BadgeCheck className="h-4 w-4 text-emerald-500" /> Estado em tempo real
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="relative overflow-hidden rounded-[28px] bg-[url(/virtual-garden-texture.svg)] bg-cover bg-center p-6">
            <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-emerald-500/10 via-white/60 to-amber-200/15 backdrop-blur" />
            <div className="relative z-10 grid gap-4 text-sm text-emerald-900/80 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPlants.slice(0, 9).map((plant) => (
                <button
                  key={plant.id}
                  type="button"
                  onClick={() => router.push(`/garden/${plant.id}`)}
                  className="flex flex-col items-start gap-3 rounded-[24px] bg-white/80 p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-full border border-emerald-100">
                      <Image
                        src={plant.image_url || '/alface.jpg'}
                        alt={plant.name ?? 'Planta'}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">{plant.name}</p>
                      <p className="text-xs text-emerald-900/60">
                        Rega a cada {plant.watering_freq} dias
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-emerald-900/60">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1">
                      <Sprout className="h-3 w-3 text-emerald-500" />{' '}
                      {plant.type === 'horta' ? 'Horta' : 'Pomar'}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1">
                      <Sun className="h-3 w-3 text-amber-500" /> Luz média
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    Ver detalhes <ArrowRight className="h-3 w-3" />
                  </span>
                </button>
              ))}

              {!filteredPlants.length && !loading && (
                <div className="col-span-full rounded-[24px] bg-white/80 p-6 text-center text-sm text-emerald-900/70 shadow-sm">
                  {emptyStateMessage}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-[28px] bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 p-6 text-sm text-emerald-900/80">
              <p className="font-semibold text-emerald-900">Dica da Tia Adélia</p>
              <p className="mt-2">
                {aiComment ||
                  'Carrega uma fotografia de uma planta para receber recomendações imediatas da Tia Adélia.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="btn-primary flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="h-4 w-4" /> Adicionar nova planta
            </button>
            <button
              type="button"
              onClick={() => router.push('/ai')}
              className="btn-secondary flex items-center justify-center gap-2 text-sm"
            >
              <Camera className="h-4 w-4" /> Diagnosticar com IA
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {filteredPlants.map((plant) => (
          <article
            key={plant.id}
            className="glass-card flex flex-col gap-4 rounded-[28px] p-6 transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex items-start gap-4">
              <div className="h-24 w-24 overflow-hidden rounded-[24px] border border-emerald-100">
                <Image
                  src={plant.image_url || '/alface.jpg'}
                  alt={plant.name ?? 'Planta'}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-xl font-semibold text-emerald-900">{plant.name}</h3>
                <p className="text-sm text-emerald-900/70">
                  Rega a cada {plant.watering_freq} dias.
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-emerald-900/70">
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1">
                    Tipo: {plant.type === 'horta' ? 'Horta' : 'Pomar'}
                  </span>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1">Luz suave</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm font-semibold text-emerald-800">
              <button
                type="button"
                className="btn-secondary flex items-center gap-2 px-4"
                onClick={() => openEditModal(plant)}
              >
                Editar
              </button>
              <button
                type="button"
                className="btn-secondary flex items-center gap-2 px-4"
                onClick={() => router.push(`/garden/${plant.id}`)}
              >
                Abrir ficha
              </button>
              <button
                type="button"
                className="btn-secondary flex items-center gap-2 px-4 text-red-500 hover:text-red-600"
                onClick={() => handleDeletePlant(plant.id)}
              >
                Remover
              </button>
            </div>
          </article>
        ))}

        {loading && (
          <div className="col-span-full flex items-center justify-center py-20">
            <span className="h-12 w-12 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        )}
      </section>

      {addOpen && (
        <GardenModal
          title="Adicionar nova planta"
          description="Carrega uma fotografia, escolhe a categoria e recebe sugestões de rega."
          form={form}
          setForm={setForm}
          preview={preview}
          onClose={() => {
            setAddOpen(false);
            setPreview(null);
            setAiComment(null);
            setForm({ name: '', image_url: '', watering_freq: 3, type: activeTab });
          }}
          onSubmit={handleAddPlant}
          handleImageUpload={handleImageUpload}
          uploading={uploading}
          analyzing={analyzing}
        />
      )}

      {editOpen && selectedPlant && (
        <GardenModal
          title={`Editar ${selectedPlant.name}`}
          description="Atualiza fotografia, frequência de rega e categoria."
          form={form}
          setForm={setForm}
          preview={preview}
          onClose={() => {
            setEditOpen(false);
            setPreview(null);
            setSelectedPlant(null);
            setForm({ name: '', image_url: '', watering_freq: 3, type: 'horta' });
          }}
          onSubmit={handleUpdatePlant}
          handleImageUpload={handleImageUpload}
          uploading={uploading}
          analyzing={analyzing}
          actionLabel="Guardar alterações"
        />
      )}
    </main>
  );
}

type GardenModalProps = {
  title: string;
  description: string;
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
  preview: string | null;
  onClose: () => void;
  onSubmit: () => void;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  analyzing: boolean;
  actionLabel?: string;
};

function GardenModal({
  title,
  description,
  form,
  setForm,
  preview,
  onClose,
  onSubmit,
  handleImageUpload,
  uploading,
  analyzing,
  actionLabel = 'Guardar planta',
}: GardenModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/30 px-4 backdrop-blur-sm">
      <div className="glass-card relative w-full max-w-3xl rounded-[32px] p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700"
        >
          Fechar
        </button>
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-emerald-900">{title}</h2>
          <p className="text-sm text-emerald-900/70">{description}</p>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-[1.1fr,0.9fr]">
          <label className="flex flex-col gap-3 text-sm text-emerald-900">
            <span className="text-xs tracking-[0.28em] text-emerald-500 uppercase">
              Nome da planta
            </span>
            <input
              className="sg-input"
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Ex.: Tomate coração-de-boi"
            />
          </label>
          <label className="flex flex-col gap-3 text-sm text-emerald-900">
            <span className="text-xs tracking-[0.28em] text-emerald-500 uppercase">
              Frequência de rega (dias)
            </span>
            <input
              className="sg-input"
              type="number"
              min={1}
              value={form.watering_freq}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, watering_freq: Number(event.target.value) }))
              }
            />
          </label>
          <label className="flex flex-col gap-3 text-sm text-emerald-900">
            <span className="text-xs tracking-[0.28em] text-emerald-500 uppercase">Categoria</span>
            <select
              className="sg-input sg-select"
              value={form.type}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, type: event.target.value as FormState['type'] }))
              }
            >
              <option value="horta">Horta</option>
              <option value="pomar">Pomar</option>
            </select>
          </label>
          <div className="space-y-3 text-sm text-emerald-900">
            <span className="text-xs tracking-[0.28em] text-emerald-500 uppercase">Fotografia</span>
            <div className="flex flex-col gap-3 rounded-[24px] border border-dashed border-emerald-300/70 bg-white/70 p-6 text-center">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="plant-image"
                onChange={handleImageUpload}
              />
              <label
                htmlFor="plant-image"
                className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
              >
                <Camera className="h-4 w-4" /> Carregar imagem
              </label>
              {preview ? (
                <div className="overflow-hidden rounded-[24px] border border-white/60">
                  <Image
                    src={preview}
                    alt="Pré-visualização"
                    width={480}
                    height={320}
                    className="h-56 w-full object-cover"
                  />
                </div>
              ) : (
                <p className="text-xs text-emerald-900/60">Sem imagem selecionada ainda.</p>
              )}
              {uploading && (
                <span className="text-xs text-emerald-600">A carregar fotografia...</span>
              )}
              {analyzing && (
                <span className="text-xs text-emerald-600">A pedir opinião à Tia Adélia...</span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 text-sm font-semibold text-emerald-800">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="button" onClick={onSubmit} className="btn-primary">
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
