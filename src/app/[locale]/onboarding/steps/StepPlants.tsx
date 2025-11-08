'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';
import { LeafLoader } from '@/components/ui/Spinner';
import { Search, X } from 'lucide-react';

type Vegetable = {
  id: string;
  name: string;
  wateringFrequencyDays: number;
  plantingWindow: { startMonth: string; endMonth: string };
  harvestWindow: { startMonth: string; endMonth: string };
  notes?: string;
};

type Props = {
  onBack: () => void;
  onNext: () => void;
};

const MAX_SELECTION = 3;

export function StepPlants({ onBack, onNext }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = JSON.parse(localStorage.getItem('userPlants') ?? '[]') as string[];
      return Array.isArray(stored) ? stored.slice(0, MAX_SELECTION) : [];
    } catch {
      return [];
    }
  });
  const [catalogue, setCatalogue] = useState<Vegetable[]>([]);
  const [catalogueError, setCatalogueError] = useState<string | null>(null);
  const [loadingCatalogue, setLoadingCatalogue] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputFocused, setInputFocused] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        // Base: calendário público (servido a partir de /public)
        const [calRes, extraRes] = await Promise.all([
          fetch('/calendario.pt.json'),
          fetch('/plants.catalog.pt.json').catch(() => new Response('[]', { status: 200 })),
        ]);
        if (!calRes.ok) throw new Error(`Falha ao carregar calendario (${calRes.status})`);
        type CalEntry = {
          Semeadura?: string[];
          Semeia?: string[];
          Semear?: string[];
          Colheita?: string[];
        };
        type CalendarJson = { calendario?: Record<string, Record<string, CalEntry>> };
        const cal = (await calRes.json()) as CalendarJson;
        let extras: Partial<Vegetable>[] = [];
        try {
          if (extraRes && extraRes.ok) extras = (await extraRes.json()) as Partial<Vegetable>[];
        } catch {}

        // Extrair nomes únicos do calendário
        const zonas: Array<Record<string, CalEntry>> = cal?.calendario
          ? (Object.values(cal.calendario) as Array<Record<string, CalEntry>>)
          : [];
        const nomes = new Set<string>();
        for (const zona of zonas) {
          for (const nome of Object.keys(zona)) {
            nomes.add(String(nome));
          }
        }

        // Transformar em catálogo mínimo
        const monthsOrder = [
          'Janeiro',
          'Fevereiro',
          'Março',
          'Abril',
          'Maio',
          'Junho',
          'Julho',
          'Agosto',
          'Setembro',
          'Outubro',
          'Novembro',
          'Dezembro',
        ];
        const monthIdx = (m: string) => monthsOrder.indexOf(m);

        const vegetablesFromCal: Vegetable[] = [];
        for (const nome of nomes) {
          // Encontrar qualquer registo para apanhar janelas
          let semeadura: string[] | undefined;
          let colheita: string[] | undefined;
          for (const zona of zonas) {
            const e = zona[nome] as CalEntry | undefined;
            if (e) {
              semeadura ||= e['Semeadura'] || e['Semeia'] || e['Semear'];
              colheita ||= e['Colheita'];
            }
            if (semeadura && colheita) break;
          }
          const sow = Array.isArray(semeadura) && semeadura.length ? semeadura : ['Março'];
          const harv = Array.isArray(colheita) && colheita.length ? colheita : ['Julho'];
          const sowSorted = [...sow].sort((a, b) => monthIdx(a) - monthIdx(b));
          const harvSorted = [...harv].sort((a, b) => monthIdx(a) - monthIdx(b));
          const id = nome
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$|--+/g, '');
          vegetablesFromCal.push({
            id,
            name: nome,
            wateringFrequencyDays: 3,
            plantingWindow: { startMonth: sowSorted[0], endMonth: sowSorted[sowSorted.length - 1] },
            harvestWindow: {
              startMonth: harvSorted[0],
              endMonth: harvSorted[harvSorted.length - 1],
            },
          });
        }

        // Mesclar extras (se houver), deduplicando por id
        const extrasMapped: Vegetable[] = Array.isArray(extras)
          ? extras.map((e) => ({
              id: String(e.id ?? e.name)
                .toLowerCase()
                .normalize('NFD')
                .replace(/\p{Diacritic}/gu, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$|--+/g, ''),
              name: String(e.name ?? ''),
              wateringFrequencyDays: Number(e.wateringFrequencyDays ?? 3),
              plantingWindow: e.plantingWindow ?? { startMonth: 'Março', endMonth: 'Abril' },
              harvestWindow: e.harvestWindow ?? { startMonth: 'Julho', endMonth: 'Setembro' },
            }))
          : [];

        const map = new Map<string, Vegetable>();
        for (const v of [...vegetablesFromCal, ...extrasMapped]) {
          if (!map.has(v.id)) map.set(v.id, v);
        }
        const finalList = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));

        if (active) {
          setCatalogue(finalList);
          setCatalogueError(null);
        }
      } catch (_e) {
        if (active) setCatalogueError('Nao foi possivel carregar a lista de plantas.');
      } finally {
        if (active) setLoadingCatalogue(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!catalogue.length) return;
    setSelectedIds((current) => {
      const filtered = current.filter((id) => catalogue.some((item) => item.id === id));
      return filtered.slice(0, MAX_SELECTION);
    });
  }, [catalogue]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('userPlants', JSON.stringify(selectedIds));
  }, [selectedIds]);

  const handleSelect = useCallback((veg: Vegetable) => {
    setSelectedIds((current) => {
      if (current.includes(veg.id) || current.length >= MAX_SELECTION) return current;
      return [...current, veg.id];
    });
    setSearchTerm('');
    setInputFocused(false);
  }, []);

  const handleRemove = useCallback((id: string) => {
    setSelectedIds((current) => current.filter((item) => item !== id));
  }, []);

  const handleNext = useCallback(async () => {
    if (!selectedIds.length) return;
    localStorage.setItem('userPlants', JSON.stringify(selectedIds));

    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (userId) {
        const existing = await supabase.from('plants').select('id,name').eq('user_id', userId);
        const existingNames = new Set(
          (existing.data ?? []).map((p: { name?: string | null }) =>
            (p.name || '').toLowerCase().trim(),
          ),
        );
        const toInsert = selectedIds
          .map((id) => catalogue.find((v) => v.id === id))
          .filter((v): v is Vegetable => Boolean(v))
          .filter((v) => !existingNames.has(v.name.toLowerCase().trim()))
          .map((v) => ({
            name: v.name,
            watering_freq: Math.max(1, Math.min(60, v.wateringFrequencyDays || 3)),
            type: 'horta',
          }));
        if (toInsert.length) {
          const payload = userId ? toInsert.map((p) => ({ ...p, user_id: userId })) : toInsert;
          await supabase.from('plants').insert(payload);
        }
      }
    } catch {}

    onNext();
  }, [catalogue, onNext, selectedIds]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && selectedIds.length) {
        event.preventDefault();
        handleNext();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        onBack();
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [handleNext, onBack, selectedIds.length]);

  const selectedVegetables = useMemo(
    () =>
      selectedIds
        .map((id) => catalogue.find((veg) => veg.id === id))
        .filter((veg): veg is Vegetable => Boolean(veg)),
    [catalogue, selectedIds],
  );

  const remaining = MAX_SELECTION - selectedVegetables.length;

  const suggestions = useMemo(() => {
    if (!catalogue.length) return [] as Vegetable[];
    const pool = catalogue.filter((veg) => !selectedIds.includes(veg.id));
    if (!searchTerm.trim()) return pool;
    const term = searchTerm.trim().toLowerCase();
    return pool
      .filter(
        (veg) =>
          veg.name.toLowerCase().includes(term) ||
          veg.id.toLowerCase().includes(term) ||
          veg.notes?.toLowerCase().includes(term),
      )
      .slice(0, 50);
  }, [catalogue, searchTerm, selectedIds]);

  const showSuggestions = inputFocused && !loadingCatalogue;

  return (
    <section className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-4xl flex-col items-center justify-center gap-12 px-6 text-center">
      <div className="w-full rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
        <Image
          src="/onboarding/tia-plants.png"
          width={640}
          height={420}
          alt="Tia Adelia rodeada de vasos coloridos com diferentes plantas."
          className="h-auto w-full rounded-[var(--radius-md)] object-cover"
        />
      </div>

      <div className="flex flex-col items-center gap-4">
        <p className="eyebrow">🌱 Step 4</p>
        <h2 className="text-display text-4xl leading-tight sm:text-5xl">Escolha ate 3 plantas</h2>
        <p className="max-w-2xl text-lg text-[var(--color-text-muted)] sm:text-xl">
          Estas serao as primeiras plantas acompanhadas pela Smart Garden. Use a pesquisa para
          encontrar especies e selecione ate tres favoritas.
        </p>
      </div>

      <div className="w-full max-w-lg text-left">
        <label
          className="mb-2 block text-sm font-semibold text-[var(--color-text)]"
          htmlFor="plant-search"
        >
          Procurar por nome
        </label>
        <div className="relative">
          <Input
            id="plant-search"
            leadingIcon={<Search className="h-4 w-4" />}
            placeholder="Exemplo: Tomate cereja, Manjericao, Morango..."
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setInputFocused(true);
            }}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setTimeout(() => setInputFocused(false), 120)}
          />
          {loadingCatalogue && (
            <div className="absolute inset-x-0 top-[110%] z-10 flex justify-center">
              <LeafLoader label="A carregar a lista de plantas..." />
            </div>
          )}
          {showSuggestions && (
            <div className="absolute top-[110%] z-20 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)]">
              {catalogueError && <p className="px-4 py-3 text-sm text-red-600">{catalogueError}</p>}
              {!catalogueError && suggestions.length === 0 && (
                <p className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                  Nenhum resultado para &ldquo;{searchTerm}&rdquo;.
                </p>
              )}
              {!catalogueError && suggestions.length > 0 && (
                <ul className="max-h-64 overflow-y-auto py-2 text-left">
                  {suggestions.map((veg) => (
                    <li key={veg.id}>
                      <button
                        type="button"
                        className="w-full px-4 py-3 text-left text-sm transition hover:bg-[var(--color-primary-soft)]"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          handleSelect(veg);
                        }}
                      >
                        <p className="font-medium text-[var(--color-text)]">{veg.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          Rega a cada {veg.wateringFrequencyDays} dias · Plantio{' '}
                          {veg.plantingWindow.startMonth} a {veg.plantingWindow.endMonth}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-3xl space-y-4">
        <div className="flex flex-wrap justify-center gap-3">
          {selectedVegetables.map((veg) => (
            <button
              key={veg.id}
              type="button"
              className="group inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-soft)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-strong)] transition hover:bg-[var(--color-primary)] hover:text-white"
              onClick={() => handleRemove(veg.id)}
            >
              {veg.name}
              <X className="h-4 w-4 transition group-hover:text-white" />
            </button>
          ))}
          {selectedVegetables.length === 0 && !loadingCatalogue && (
            <p className="text-sm text-[var(--color-text-muted)]">
              Ainda nao escolheu nenhuma planta.
            </p>
          )}
        </div>

        {selectedVegetables.length > 0 && (
          <div className="grid gap-4 text-left">
            {selectedVegetables.map((veg) => (
              <div
                key={veg.id}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-[var(--color-text)]">{veg.name}</h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Rega: a cada {veg.wateringFrequencyDays} dias
                </p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Plantio: {veg.plantingWindow.startMonth} a {veg.plantingWindow.endMonth}
                </p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Colheita: {veg.harvestWindow.startMonth} a {veg.harvestWindow.endMonth}
                </p>
                {veg.notes && <p className="text-sm text-[var(--color-text-muted)]">{veg.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-sm text-[var(--color-text-muted)]">
        {remaining > 0
          ? `Pode escolher mais ${remaining === 1 ? 'uma planta' : `${remaining} plantas`}.`
          : 'Limite maximo atingido.'}
      </p>

      <div className="flex w-full max-w-md gap-3">
        <Button variant="secondary" size="lg" className="w-full" onClick={onBack}>
          Voltar
        </Button>
        <Button
          size="lg"
          className="w-full"
          onClick={handleNext}
          disabled={!selectedVegetables.length}
        >
          Continuar
        </Button>
      </div>
    </section>
  );
}
