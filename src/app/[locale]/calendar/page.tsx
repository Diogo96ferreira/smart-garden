'use client';

import React from 'react';
import { Sprout, Shovel, ShoppingBasket, Filter, Loader2 } from 'lucide-react';
import GanttChart, { ActionKey, ZoneData } from '@/components/ui/GanttChart';
import { useTranslation } from '@/lib/useTranslation';
import { usePathname } from 'next/navigation';

type Zone = `ZONA ${1 | 2 | 3 | 4 | 5}`;
type ZonasMeta = Record<Zone, { descricao?: string; distritos: string[]; notas?: string }>;
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

  const entry = Object.entries(zonemap).find(([dist]) => norm(dist) === d);
  if (entry && c) {
    const [, zones] = entry;
    for (const z of Object.keys(zones) as Zone[]) {
      const list = zones[z] ?? [];
      if (list.some((name) => norm(name) === c)) return z;
    }
  }

  const getDistricts = (meta: ZonasMeta[Zone] | undefined): string[] => {
    const m = meta as { distritos?: string[]; districts?: string[] } | undefined;
    return m?.distritos ?? m?.districts ?? [];
  };

  for (const z of Object.keys(zonas) as Zone[]) {
    const dists = getDistricts(zonas[z]);
    for (const raw of dists) {
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

export default function CalendarPage() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1]?.toLowerCase().startsWith('en') ? 'en' : 'pt';
  const t = useTranslation(locale);

  const [raw, setRaw] = React.useState<CalendarDataRaw | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [zone, setZone] = React.useState<Zone>('ZONA 1');
  const [actions, setActions] = React.useState<ActionKey[]>([
    'Semeadura',
    'Transplante',
    'Colheita',
  ]);
  const [q, setQ] = React.useState('');

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
    const t1 = setTimeout(recomputeMaxH, 50);
    const t2 = setTimeout(recomputeMaxH, 250);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [recomputeMaxH]);

  React.useEffect(() => {
    (async () => {
      try {
        const calFile = locale === 'en' ? '/calendario.en.json' : '/calendario.pt.json';
        const [calRes, mapRes] = await Promise.all([
          fetch(calFile, { cache: 'no-store' }),
          fetch('/zonemap.pt.json', { cache: 'no-store' }),
        ]);

        type CalendarFileShape = {
          zonas?: Record<string, ZonasMeta[Zone]>;
          zones?: Record<string, ZonasMeta[Zone]>;
          calendario?: Record<string, ZoneData>;
          calendar?: Record<string, ZoneData>;
        };

        const cal: CalendarFileShape = (await calRes.json()) as CalendarFileShape;
        const zm: ZonaMap = mapRes.ok ? ((await mapRes.json()) as ZonaMap) : {};

        const zonasRaw = (cal.zonas ?? cal.zones ?? {}) as Record<string, ZonasMeta[Zone]>;
        const calendarioRaw = (cal.calendario ?? cal.calendar ?? {}) as Record<string, ZoneData>;

        const normalizeZoneKey = (k: string) => k.replace(/^ZONE\s+/i, 'ZONA ');

        const zonas: ZonasMeta = Object.fromEntries(
          Object.entries(zonasRaw).map(([k, v]) => [normalizeZoneKey(k), v]),
        ) as ZonasMeta;

        const calendario: Record<Zone, ZoneData> = Object.fromEntries(
          Object.entries(calendarioRaw).map(([k, v]) => [normalizeZoneKey(k), v]),
        ) as Record<Zone, ZoneData>;

        setRaw({ zonas, calendario });

        let distrito: string | null = null;
        let concelho: string | null = null;
        try {
          const u = localStorage.getItem('userLocation');
          if (u) {
            const obj = JSON.parse(u) as { distrito?: string; municipio?: string };
            distrito = obj?.distrito ?? localStorage.getItem('distrito');
            concelho = obj?.municipio ?? localStorage.getItem('concelho');
          } else {
            distrito = localStorage.getItem('distrito');
            concelho = localStorage.getItem('concelho');
          }
        } catch {
          /* ignore */
        }

        const z = detectZone({ zonas, zonemap: zm, distrito, concelho }) ?? ('ZONA 1' as Zone);
        setZone(z);
      } finally {
        setLoading(false);
      }
    })();
  }, [locale]);

  const toggleAction = (a: ActionKey) => {
    setActions((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  };

  if (loading || !raw) {
    return (
      <main className="flex items-center justify-center overflow-x-hidden bg-[var(--color-background)] p-6 text-[color:var(--color-text)]">
        <span className="inline-flex items-center gap-2 text-sm text-[color:var(--color-text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" /> {t('calendar.loading')}
        </span>
      </main>
    );
  }

  const zoneData = raw.calendario?.[zone] ?? {};

  return (
    <main className="mx-auto min-h-screen max-w-full space-y-5 overflow-x-hidden bg-[var(--color-background)] p-4 pb-8 text-[color:var(--color-text)] sm:p-6">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">{t('calendar.title')}</h1>
      </header>

      {/* Filtros topo */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 text-xs text-gray-600">
          <Filter className="h-3.5 w-3.5" /> {t('calendar.filters')}
        </span>

        <div className="flex items-center gap-1">
          {[
            {
              k: 'Semeadura',
              label: t('calendar.sow'),
              icon: <Sprout className="h-3.5 w-3.5" />,
              on: 'bg-emerald-200 text-emerald-900',
            },
            {
              k: 'Transplante',
              label: t('calendar.transplant'),
              icon: <Shovel className="h-3.5 w-3.5" />,
              on: 'bg-sky-200 text-sky-900',
            },
            {
              k: 'Colheita',
              label: t('calendar.harvest'),
              icon: <ShoppingBasket className="h-3.5 w-3.5" />,
              on: 'bg-amber-200 text-amber-900',
            },
          ].map((a) => {
            const active = actions.includes(a.k as ActionKey);
            return (
              <button
                key={a.k}
                onClick={() => toggleAction(a.k as ActionKey)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] transition ${
                  active
                    ? `${a.on} border-transparent`
                    : 'border-[color:var(--color-border)] bg-[var(--color-surface)] text-[color:var(--color-text)]'
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
            placeholder={t('calendar.search')}
            className="w-full rounded-lg border border-[color:var(--color-border)] bg-[var(--color-surface)] py-2 pr-3 pl-12 text-sm text-[color:var(--color-text)] placeholder:text-gray-400"
          />
        </div>
      </div>

      <div ref={ganttAnchorRef} />

      <GanttChart
        data={zoneData}
        actions={actions}
        search={q}
        nameColWidth={180}
        cellWidth={64}
        stickyFirstRow
        stickyMode="inside"
        maxHeight={maxHeight}
      />
    </main>
  );
}
