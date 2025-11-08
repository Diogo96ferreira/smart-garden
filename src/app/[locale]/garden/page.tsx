'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Plus, PencilLine } from 'lucide-react';
import { LineTabs } from '@/components/ui/InlineTabs';
import { LeafLoader } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabaseClient';
import { useTranslation } from '@/lib/useTranslation';
import { usePathname } from 'next/navigation';

type Plant = {
  id: string;
  name: string;
  image_url?: string | null;
  watering_freq: number;
  last_watered?: string | null;
  created_at?: string;
  type?: 'horta' | 'pomar';
};

type FormState = {
  name: string;
  image_url: string;
  watering_freq: number;
  type: 'horta' | 'pomar';
};

const INITIAL_FORM: FormState = {
  name: '',
  image_url: '',
  watering_freq: 3,
  type: 'horta',
};

export default function GardenPage() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'pt';
  const t = useTranslation(locale);

  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'horta' | 'pomar'>('horta');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiComment, setAiComment] = useState<string | null>(null);
  const [editUploading, setEditUploading] = useState(false);
  const [editPreview, setEditPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchPlants();
  }, []);

  async function fetchPlants() {
    try {
      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPlants(data ?? []);
    } catch (error) {
      console.error('Erro ao carregar plantas:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileName = `${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('plants').upload(fileName, file);
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('plants').getPublicUrl(fileName);

      setForm((current) => ({ ...current, image_url: publicUrl }));
      setPreview(publicUrl);

      setAnalyzing(true);
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/build-plant', { method: 'POST', body: formData });
      if (response.ok) {
        const dataAI: {
          result: {
            gardenType?: string;
            message?: string;
            type?: string;
          };
        } = await response.json();

        setForm((current) => ({
          ...current,
          type: (dataAI.result.gardenType as 'horta' | 'pomar') ?? current.type,
          name: current.name.trim() ? current.name : (dataAI.result.type ?? current.name),
        }));
        setAiComment(dataAI.result.message ?? null);
      }
    } catch (error) {
      console.error('Erro a carregar imagem:', error);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  }

  async function handleEditImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !selectedPlant) return;

    try {
      setEditUploading(true);
      const fileName = `${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('plants').upload(fileName, file);
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('plants').getPublicUrl(fileName);

      setEditPreview(publicUrl);
      setSelectedPlant({ ...selectedPlant, image_url: publicUrl });
    } catch (error) {
      console.error('Erro ao carregar nova fotografia:', error);
    } finally {
      setEditUploading(false);
    }
  }

  async function handleAddPlant() {
    if (!form.name.trim()) return;
    try {
      const { error } = await supabase.from('plants').insert({
        name: form.name.trim(),
        image_url: form.image_url,
        watering_freq: form.watering_freq,
        type: form.type,
      });
      if (error) throw error;

      await fetchPlants();
      resetForm();
      setAddOpen(false);
    } catch (error) {
      console.error('Erro ao adicionar planta:', error);
    }
  }

  async function handleUpdatePlant() {
    if (!selectedPlant) return;
    const { id, name, type, watering_freq, image_url } = selectedPlant;
    try {
      const { error } = await supabase
        .from('plants')
        .update({ name, type, watering_freq, image_url })
        .eq('id', id);
      if (error) throw error;

      await fetchPlants();
      setEditOpen(false);
      setSelectedPlant(null);
      setEditPreview(null);
    } catch (error) {
      console.error('Erro ao atualizar planta:', error);
    }
  }

  async function handleDeletePlant() {
    if (!selectedPlant) return;
    try {
      const { error } = await supabase.from('plants').delete().eq('id', selectedPlant.id);
      if (error) throw error;
      await fetchPlants();
      setEditOpen(false);
      setSelectedPlant(null);
    } catch (error) {
      console.error('Erro ao eliminar planta:', error);
    }
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setPreview(null);
    setAiComment(null);
    setUploading(false);
    setAnalyzing(false);
  }

  const filteredPlants = useMemo(
    () => plants.filter((plant) => plant.type === activeTab),
    [activeTab, plants],
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LeafLoader label={t('garden.loading')} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">{t('garden.title')}</p>
          <h1 className="text-display text-3xl sm:text-4xl">{t('garden.subtitle')}</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)] sm:text-base">
            {t('garden.description')}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button
            size="lg"
            icon={<Plus className="h-4 w-4" />}
            className="w-full sm:w-auto"
            onClick={() => {
              resetForm();
              setAddOpen(true);
            }}
          >
            {t('garden.addPlant')}
          </Button>
        </div>
      </div>

      <LineTabs
        tabs={[
          { value: 'horta', label: t('garden.horta'), content: null },
          { value: 'pomar', label: t('garden.pomar'), content: null },
        ]}
        defaultValue={activeTab}
        onValueChange={(value) => setActiveTab((value as 'horta' | 'pomar') ?? 'horta')}
        className="mt-6"
      />

      <section className="space-y-6">
        {filteredPlants.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center shadow-[var(--shadow-soft)]">
            <h2 className="text-display text-2xl">{t('garden.emptyTitle')}</h2>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">
              {t('garden.emptyDescription')}
            </p>
            <Button
              variant="primary"
              size="lg"
              className="mt-6"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => {
                resetForm();
                setAddOpen(true);
              }}
            >
              {t('garden.registerPlant')}
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredPlants.map((plant) => (
              <motion.div
                key={plant.id}
                layout
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-soft)]"
              >
                <div className="relative mb-4 h-40 w-full overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]">
                  {plant.image_url ? (
                    <Image
                      src={plant.image_url}
                      alt={plant.name}
                      fill
                      sizes="320px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-6">
                      <Image
                        src="/spinner.png"
                        alt="Loading"
                        width={96}
                        height={96}
                        className="opacity-70"
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-text)]">{plant.name}</h3>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {t('garden.waterEvery').replace('{{days}}', plant.watering_freq.toString())}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<PencilLine className="h-4 w-4" />}
                    onClick={() => {
                      setSelectedPlant(plant);
                      setEditOpen(true);
                    }}
                  >
                    {t('garden.edit')}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Diálogo Adicionar */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('garden.addNew')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>{t('garden.name')}</Label>
                <Input
                  placeholder="Ex.: Tomate cereja"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </div>
              <div>
                <Label>{t('garden.wateringFrequency')}</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.watering_freq}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      watering_freq: Number.parseInt(event.target.value, 10) || 1,
                    })
                  }
                />
              </div>
              <div>
                <Label>{t('garden.type')}</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => setForm({ ...form, type: value as 'horta' | 'pomar' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('garden.type')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="horta">{t('garden.horta')}</SelectItem>
                      <SelectItem value="pomar">{t('garden.pomar')}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-center">
              <Label className="mb-2 block text-center">{t('garden.photo')}</Label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full cursor-pointer rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-white p-3 text-sm text-[var(--color-text-muted)]"
              />
              {uploading && (
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                  {t('garden.uploading')}
                </p>
              )}
              {analyzing && (
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                  {t('garden.analyzing')}
                </p>
              )}
              {preview && (
                <div className="mt-4 flex justify-center">
                  <Image
                    src={preview}
                    alt="Pré-visualização"
                    width={160}
                    height={160}
                    className="rounded-[var(--radius-md)] object-cover"
                  />
                </div>
              )}
              {aiComment && (
                <p className="mt-3 rounded-[var(--radius-md)] bg-white/60 p-3 text-xs text-[var(--color-text-muted)]">
                  {aiComment}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              {t('garden.cancel')}
            </Button>
            <Button onClick={handleAddPlant} disabled={!form.name.trim()}>
              {t('garden.savePlant')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Editar */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('garden.editPlant')}</DialogTitle>
          </DialogHeader>

          {selectedPlant && (
            <div className="space-y-4">
              <div>
                <Label>{t('garden.name')}</Label>
                <Input
                  value={selectedPlant.name}
                  onChange={(event) =>
                    setSelectedPlant({ ...selectedPlant, name: event.target.value })
                  }
                />
              </div>

              <div>
                <Label>{t('garden.wateringFrequency')}</Label>
                <Input
                  type="number"
                  min={1}
                  value={selectedPlant.watering_freq}
                  onChange={(event) =>
                    setSelectedPlant({
                      ...selectedPlant,
                      watering_freq: Number.parseInt(event.target.value, 10) || 1,
                    })
                  }
                />
              </div>

              <div>
                <Label>{t('garden.type')}</Label>
                <Select
                  value={selectedPlant.type}
                  onValueChange={(value) =>
                    setSelectedPlant({ ...selectedPlant, type: value as 'horta' | 'pomar' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('garden.type')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="horta">{t('garden.horta')}</SelectItem>
                      <SelectItem value="pomar">{t('garden.pomar')}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-center">
                <Label className="mb-2 block text-center">{t('garden.photo')}</Label>
                <div className="flex w-full flex-col items-center gap-3">
                  <div className="relative h-24 w-24 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface)]">
                    {editPreview || selectedPlant.image_url ? (
                      <Image
                        src={editPreview || (selectedPlant.image_url as string)}
                        alt={selectedPlant.name}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : (
                      <Image
                        src="/spinner.png"
                        alt="Sem imagem"
                        fill
                        sizes="96px"
                        className="object-contain p-4 opacity-70"
                      />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageUpload}
                    className="w-full cursor-pointer rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-white p-3 text-sm text-[var(--color-text-muted)]"
                  />
                  {editUploading && (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {t('garden.uploading')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Button variant="destructive" onClick={handleDeletePlant}>
              {t('garden.delete')}
            </Button>
            <Button onClick={handleUpdatePlant}>{t('garden.saveChanges')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
