'use client';

import { LineTabs } from '@/components/ui/InlineTabs';
import { LeafLoader } from '@/components/ui/Spinner';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type { PostgrestError } from '@supabase/supabase-js';

type Plant = {
  id: string;
  name: string;
  image_url?: string | null;
  watering_freq: number;
  last_watered?: string | null;
  created_at?: string;
  type?: 'horta' | 'pomar';
};

export default function MyGarden() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [aiComment, setAiComment] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  const [form, setForm] = useState({
    name: '',
    image_url: '',
    watering_freq: 2,
    type: 'horta',
  });

  // 🔹 Busca todas as plantas
  useEffect(() => {
    void fetchPlants();
  }, []);

  async function fetchPlants(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPlants(data ?? []);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erro ao buscar plantas:', error.message);
      } else {
        console.error('Erro desconhecido ao buscar plantas:', error);
      }
    } finally {
      setLoading(false);
    }
  }

  // 🌿 Upload + análise IA + rega
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      const fileName = `${crypto.randomUUID()}-${file.name}`;
      const uploadResponse = await supabase.storage.from('plants').upload(fileName, file);

      if (uploadResponse.error) throw uploadResponse.error;

      const {
        data: { publicUrl },
      } = supabase.storage.from('plants').getPublicUrl(fileName);

      setForm((f) => ({ ...f, image_url: publicUrl }));
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
      let wateringFreq = 3;

      try {
        const wateringRes = await fetch('/api/watering', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: result.type,
            species: result.species ?? '',
          }),
        });

        if (!wateringRes.ok) throw new Error('Falha ao obter frequência de rega.');

        const wateringData: { watering_freq: number } = await wateringRes.json();
        wateringFreq = wateringData.watering_freq || 3;

        console.log('💧 Frequência sugerida pela IA:', wateringFreq);
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error('Erro ao obter frequência de rega:', error.message);
        }
      }

      setForm((f) => ({
        ...f,
        name: result.type || f.name,
        watering_freq: wateringFreq,
        type: result.gardenType === 'pomar' ? 'pomar' : 'horta',
      }));

      setAiComment(result.message ?? null);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erro ao processar imagem:', error.message);
      }
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  }

  // 💾 Adicionar planta
  async function handleAddPlant(): Promise<void> {
    try {
      const { error } = await supabase.from('plants').insert([
        {
          name: form.name,
          image_url: form.image_url || null,
          watering_freq: form.watering_freq,
          type: form.type,
          created_at: new Date().toISOString(),
        },
      ]);
      if (error) throw error;

      setOpen(false);
      setForm({ name: '', image_url: '', watering_freq: 2, type: 'horta' });
      setAiComment(null);
      setPreview(null);
      void fetchPlants();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erro ao adicionar planta:', error.message);
      }
    }
  }

  // ✏️ Editar / Apagar planta
  function openEditModal(plant: Plant): void {
    setSelectedPlant(plant);
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
      void fetchPlants();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erro ao atualizar planta:', error.message);
      }
    }
  }

  async function handleDeletePlant(): Promise<void> {
    if (!selectedPlant) return;
    if (!confirm('Tens a certeza que queres eliminar esta planta?')) return;

    try {
      const { error } = await supabase.from('plants').delete().eq('id', selectedPlant.id);

      if (error) throw error;

      setEditOpen(false);
      void fetchPlants();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erro ao eliminar planta:', error.message);
      }
    }
  }

  // Loader
  if (loading)
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LeafLoader />
      </main>
    );

  const horta = plants.filter((p) => p.type === 'horta');
  const pomar = plants.filter((p) => p.type === 'pomar');

  const renderCards = (list: Plant[]): JSX.Element => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {list.map((p) => (
        <motion.div key={p.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="relative overflow-hidden rounded-2xl shadow-sm transition-all hover:shadow-md">
            {p.image_url ? (
              <div className="relative h-40 w-full">
                <Image src={p.image_url} alt={p.name} fill className="object-cover" />
              </div>
            ) : (
              <div
                className={`flex h-40 items-center justify-center text-4xl text-white ${
                  p.type === 'pomar'
                    ? 'bg-gradient-to-r from-orange-400 to-yellow-500'
                    : 'bg-gradient-to-r from-green-400 to-emerald-600'
                }`}
              >
                {p.type === 'pomar' ? '🍊' : '🌱'}
              </div>
            )}
            <CardContent className="space-y-1 p-4">
              <h3 className="font-semibold text-gray-800">{p.name}</h3>
              <p className="text-xs text-gray-400">💧 Rega a cada {p.watering_freq} dias</p>
            </CardContent>

            {/* Botão sempre visível */}
            <div className="absolute top-2 right-2 z-10">
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(p);
                }}
                className="h-8 w-8 rounded-full bg-white/80 text-gray-600 backdrop-blur-md hover:bg-gray-200 hover:text-gray-800"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );

  return (
    <main className="min-h-screen px-6 py-3">
      <div className="mx-auto mt-10 rounded-xl bg-white p-6">
        <h1 className="mb-6 text-center text-xl font-semibold text-green-700">
          🌱 My Smart Garden
        </h1>

        <LineTabs
          defaultValue="horta"
          tabs={[
            {
              label: 'Horta',
              value: 'horta',
              content: horta.length ? (
                renderCards(horta)
              ) : (
                <div className="text-center text-sm text-gray-500">
                  🌿 Nenhuma planta adicionada à horta.
                </div>
              ),
            },
            {
              label: 'Pomar',
              value: 'pomar',
              content: pomar.length ? (
                renderCards(pomar)
              ) : (
                <div className="text-center text-sm text-gray-500">
                  🍊 Nenhuma árvore no pomar ainda.
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* 🌿 Botão flutuante */}
      <Button
        onClick={() => setOpen(true)}
        className="fixed right-6 bottom-24 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* 🌸 Modal Add Plant */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="fixed top-1/2 left-1/2 max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white p-6 shadow-xl backdrop-blur-md"
        >
          <DialogHeader>
            <DialogTitle>Adicionar nova planta 🌿</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Ex: Tomate Coração de Boi"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Imagem da planta</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading || analyzing}
              />

              {(uploading || analyzing) && (
                <p className="mt-1 text-xs text-gray-500 italic">
                  {uploading ? '📤 A enviar imagem...' : '🤖 A Tia Adélia está a pensar...'}
                </p>
              )}

              {preview && (
                <div className="relative mt-2 h-32 w-full overflow-hidden rounded-lg border">
                  <Image src={preview} alt="Preview" fill className="object-cover" />
                </div>
              )}

              {aiComment && <p className="mt-2 text-xs text-gray-600 italic">{aiComment}</p>}
            </div>

            <div>
              <Label>Frequência de rega (dias)</Label>
              <Input
                type="number"
                min={1}
                value={form.watering_freq ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({
                    ...form,
                    watering_freq: val === '' ? 0 : parseInt(val, 10) || 0,
                  });
                }}
              />

              {analyzing && (
                <p className="mt-1 text-xs text-gray-500 italic">
                  ⏳ A calcular frequência de rega...
                </p>
              )}

              {!analyzing && form.watering_freq > 0 && (
                <p className="mt-1 text-xs text-green-600">
                  💧 Sugestão da Tia Adélia: regar a cada {form.watering_freq} dias.
                </p>
              )}
            </div>

            <div>
              <Label>Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as 'horta' | 'pomar' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolher tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horta">🌿 Horta</SelectItem>
                  <SelectItem value="pomar">🍊 Pomar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleAddPlant} className="bg-green-600 text-white hover:bg-green-700">
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✏️ Modal Edit */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="fixed top-1/2 left-1/2 max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white p-6 shadow-xl backdrop-blur-md"
        >
          <DialogHeader>
            <DialogTitle>Editar planta 🌿</DialogTitle>
          </DialogHeader>

          {selectedPlant && (
            <div className="space-y-4 py-2">
              <div>
                <Label>Nome</Label>
                <Input
                  value={selectedPlant.name}
                  onChange={(e) => setSelectedPlant({ ...selectedPlant, name: e.target.value })}
                />
              </div>

              <div>
                <Label>Frequência de rega (dias)</Label>
                <Input
                  type="number"
                  min={1}
                  value={selectedPlant.watering_freq ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedPlant({
                      ...selectedPlant,
                      watering_freq: val === '' ? 0 : parseInt(val, 10) || 0,
                    });
                  }}
                />
              </div>

              <div>
                <Label>Tipo</Label>
                <Select
                  value={selectedPlant.type}
                  onValueChange={(v) =>
                    setSelectedPlant({ ...selectedPlant, type: v as 'horta' | 'pomar' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolher tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horta">🌿 Horta</SelectItem>
                    <SelectItem value="pomar">🍊 Pomar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <div className="flex justify-between">
              <Button
                variant="destructive"
                onClick={handleDeletePlant}
                className="w-24 bg-red-600 text-white hover:bg-red-700"
              >
                Eliminar
              </Button>
              <Button
                onClick={handleUpdatePlant}
                className="w-48 bg-green-600 text-white hover:bg-green-700"
              >
                Guardar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
