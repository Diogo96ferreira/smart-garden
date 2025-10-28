'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import type { Plant } from '@/types';
import { LeafLoader } from '@/components/ui/Spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, CalendarCheck2, Trash2, Upload } from 'lucide-react';

type PlantFormState = {
  name: string;
  watering_freq: number;
  type: 'horta' | 'pomar';
  image_url: string;
  last_watered: string | null;
};

const formatDate = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const formatDisplayDate = (value: string | null) => {
  if (!value) return 'Ainda não regaste esta planta.';
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
  const [form, setForm] = useState<PlantFormState>({
    name: '',
    watering_freq: 3,
    type: 'horta',
    image_url: '',
    last_watered: null,
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

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, image_url: '' }));
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LeafLoader />
      </main>
    );
  }

  if (!plantId || !plant) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-semibold text-green-800">Não encontrámos esta planta.</p>
        <Button
          onClick={() => router.push('/garden')}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          Voltar à lista
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-6 pb-24">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Voltar">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-green-800">{plant.name}</h1>
        </div>

        {status && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {status}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Ficha da planta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Laranjeira"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="watering">Frequência de rega (dias)</Label>
                <Input
                  id="watering"
                  type="number"
                  min={1}
                  value={form.watering_freq}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      watering_freq: Number.parseInt(e.target.value, 10) || 1,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Zona</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, type: value as 'horta' | 'pomar' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolhe a zona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horta">🌿 Horta</SelectItem>
                    <SelectItem value="pomar">🍊 Pomar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="last-watered">Última rega</Label>
                <Input
                  id="last-watered"
                  type="date"
                  value={formatDate(form.last_watered)}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      last_watered: e.target.value ? new Date(e.target.value).toISOString() : null,
                    }))
                  }
                />
                <p className="text-xs text-gray-500">{formatDisplayDate(form.last_watered)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Fotografia</Label>
              {form.image_url ? (
                <div className="space-y-3">
                  <div className="relative h-60 w-full overflow-hidden rounded-xl border">
                    <Image src={form.image_url} alt={form.name} fill className="object-cover" />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      onClick={handleRemoveImage}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Remover imagem
                    </Button>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-green-300 px-4 py-2 text-sm text-green-700 hover:bg-green-50">
                      <Upload className="h-4 w-4" />
                      <span>Trocar fotografia</span>
                      <Input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={onFileChange}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-green-200 bg-green-50 p-6 text-center text-sm text-green-700 hover:bg-green-100">
                  <Upload className="h-5 w-5" />
                  <span>Carrega ou fotografa a planta</span>
                  <Input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={onFileChange}
                    disabled={uploading}
                  />
                </label>
              )}
              {uploading && <p className="text-xs text-gray-500">A enviar fotografia…</p>}
            </div>

            {nextWateringDate && (
              <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">
                Próxima rega sugerida:{' '}
                {nextWateringDate.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                Guardar alterações
              </Button>
              <Button
                variant="outline"
                disabled={saving}
                onClick={handleMarkWatered}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <CalendarCheck2 className="mr-2 h-4 w-4" /> Regada hoje
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
