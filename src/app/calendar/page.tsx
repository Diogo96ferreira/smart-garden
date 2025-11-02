'use client';

import React from 'react';
import { Sprout, Shovel, ShoppingBasket, Filter, Loader2 } from 'lucide-react';
import GanttChart, { ActionKey, ZoneData } from '@/components/ui/GanttChart';

type Zone = `ZONA ${1 | 2 | 3 | 4 | 5}`;
type ZonasMeta = Record<Zone, { descricao: string; distritos: string[]; notas?: string }>;
type CalendarDataRaw = { zonas: ZonasMeta; calendario: Record<Zone, ZoneData> };
type ZonaMap = Record<string, Partial<Record<Zone, string[]>>>;

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

function detectZone({
  zonas,
  zonemap,
  distrito,
  concelho,
}: {
  zonas: ZonasMeta;
  zonemap: ZonaMap;
  distrito?: string | null;
  concelho?: string | null;
}): Zone | null {
  if (!distrito) return null;
  const d = norm(distrito);
  const c = concelho ? norm(concelho) : null;

  // 1) mapeamento por concelho, quando existir
  const entry = Object.entries(zonemap).find(([dist]) => norm(dist) === d);
  if (entry && c) {
    const [, zones] = entry;
    for (const z of Object.keys(zones) as Zone[]) {
      const list = zones[z] ?? [];
      if (list.some((name) => norm(name) === c)) return z;
    }
  }
  // 2) fallback por distrito listado nas zonas
  for (const z of Object.keys(zonas) as Zone[]) {
    for (const raw of zonas[z].distritos) {
      const base = raw.split('(')[0];
      for (const part of base
        .split(/[,;/]/)
        .map((s) => s.trim())
        .filter(Boolean)) {
        if (norm(part) && (d.includes(norm(part)) || norm(part).includes(d))) return z;
      }
    }
  }
  return null;
}

export default function Page() {
  const [raw, setRaw] = React.useState<CalendarDataRaw | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [zone, setZone] = React.useState<Zone>('ZONA 1');
  const [actions, setActions] = React.useState<ActionKey[]>([
    'Semeadura',
    'Transplante',
    'Colheita',
  ]);
  const [q, setQ] = React.useState('');

  // === calcular maxHeight dinâmico para o Gantt (modo inside) ===
  const ganttAnchorRef = React.useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = React.useState<number>(700);

  const recomputeMaxH = React.useCallback(() => {
    const el = ganttAnchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const safeBottom = 24;
    const avail = Math.max(320, Math.floor(window.innerHeight - rect.top - safeBottom));
    setMaxHeight(avail);
  }, []);

  React.useEffect(() => {
    recomputeMaxH();
    const onResize = () => recomputeMaxH();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    const t = setTimeout(recomputeMaxH, 50);
    const t2 = setTimeout(recomputeMaxH, 250);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [recomputeMaxH]);

  React.useEffect(() => {
    recomputeMaxH();
  }, [q, actions, recomputeMaxH]);

  React.useEffect(() => {
    (async () => {
      try {
        const [calRes, mapRes] = await Promise.all([
          fetch('/calendario.json', { cache: 'no-store' }),
          fetch('/zonemap.pt.json', { cache: 'no-store' }),
        ]);
        const cal: CalendarDataRaw = await calRes.json();
        const zm: ZonaMap = mapRes.ok ? await mapRes.json() : {};
        setRaw(cal);

        let distrito: string | null = null;
        let concelho: string | null = null;
        try {
          const u = localStorage.getItem('userLocation');
          if (u) {
            const obj = JSON.parse(u);
            distrito = obj?.distrito ?? localStorage.getItem('distrito');
            concelho = obj?.municipio ?? localStorage.getItem('concelho');
          } else {
            distrito = localStorage.getItem('distrito');
            concelho = localStorage.getItem('concelho');
          }
        } catch (err) {
          // ignorar erros de JSON/localStorage (silencioso mas não-vazio p/ eslint)
          void err;
        }

        const z =
          detectZone({ zonas: cal.zonas, zonemap: zm, distrito, concelho }) ?? ('ZONA 1' as Zone);
        setZone(z);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleAction = (a: ActionKey) => {
    setActions((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  };

  if (loading || !raw) {
    return (
      <main className="flex items-center justify-center overflow-x-hidden bg-white p-6 text-gray-900 [color-scheme:light] dark:!bg-white dark:!text-gray-900">
        <span className="inline-flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" /> a carregar calendário…
        </span>
      </main>
    );
  }

  const zoneData = raw.calendario[zone] ?? {};

  return (
    <main className="mx-auto min-h-screen max-w-full space-y-5 overflow-x-hidden bg-white p-4 pb-8 text-gray-900 [color-scheme:light] sm:p-6 dark:!bg-white dark:!text-gray-900">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">Vegetable Planner</h1>
      </header>

      {/* Filtros topo */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 text-xs text-gray-600">
          <Filter className="h-3.5 w-3.5" /> Filtros
        </span>

        <div className="flex items-center gap-1">
          {(
            [
              {
                k: 'Semeadura',
                label: 'Semear',
                icon: <Sprout className="h-3.5 w-3.5" />,
                on: 'bg-emerald-200 text-emerald-900',
              },
              {
                k: 'Transplante',
                label: 'Transplantar',
                icon: <Shovel className="h-3.5 w-3.5" />,
                on: 'bg-sky-200 text-sky-900',
              },
              {
                k: 'Colheita',
                label: 'Colher',
                icon: <ShoppingBasket className="h-3.5 w-3.5" />,
                on: 'bg-amber-200 text-amber-900',
              },
            ] as { k: ActionKey; label: string; icon: React.ReactNode; on: string }[]
          ).map((a) => {
            const active = actions.includes(a.k as ActionKey);
            return (
              <button
                key={a.k}
                onClick={() => toggleAction(a.k as ActionKey)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] transition ${
                  active
                    ? `${a.on} border-transparent`
                    : 'border-gray-200 bg-white text-gray-700 dark:!border-gray-200 dark:!bg-white dark:!text-gray-700'
                }`}
                title={a.label}
              >
                {a.icon} {a.label}
              </button>
            );
          })}
        </div>

        {/* Pesquisa */}
        <div className="relative w-full">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pesquisar cultura…"
            className="w-full rounded-lg border bg-white py-2 pr-3 pl-12 text-sm text-gray-900 placeholder:text-gray-400 dark:!border-gray-200 dark:!bg-white dark:!text-gray-900"
          />
        </div>
      </div>

      {/* Âncora para medir a posição e calcular maxHeight */}
      <div ref={ganttAnchorRef} />

      {/* Gantt em modo inside com maxHeight dinâmico */}
      <GanttChart
        data={zoneData}
        actions={actions}
        search={q}
        nameColWidth={180}
        cellWidth={64}
        stickyFirstRow={true}
        stickyMode="inside"
        maxHeight={maxHeight}
      />
    </main>
  );
}
