'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sprout, Shovel, ShoppingBasket, Filter, Loader2, Search, MapPinned } from 'lucide-react';
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
      <main className="app-page-wide flex min-h-screen items-center justify-center text-[color:var(--color-text)]">
        <span className="app-chip">
          <Loader2 className="h-4 w-4 animate-spin" /> {t('calendar.loading')}
        </span>
      </main>
    );
  }

  const zoneData = raw.calendario?.[zone] ?? {};

  return (
    <main className="app-page-wide min-h-screen space-y-6 overflow-x-hidden text-[color:var(--color-text)]">
      <motion.header
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.52, ease: 'easeOut' }}
        className="page-hero relative overflow-hidden p-5 sm:p-7"
      >
        <motion.div
          aria-hidden
          className="absolute right-8 bottom-0 hidden h-24 w-48 rounded-t-full border border-[var(--color-primary)]/20 sm:block"
          animate={{ x: [0, 12, 0], opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="eyebrow inline-flex items-center gap-2 text-[var(--color-primary-strong)]">
              <CalendarIcon />
              {t('calendar.filters')}
            </p>
            <h1 className="text-display text-3xl sm:text-4xl">{t('calendar.title')}</h1>
          </div>
          <div className="app-chip">
            <MapPinned className="h-4 w-4 text-[var(--color-primary-strong)]" />
            {zone}
          </div>
        </div>
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.06, ease: 'easeOut' }}
        className="glass-panel space-y-4 p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="app-chip">
            <Filter className="h-3.5 w-3.5" /> {t('calendar.filters')}
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {[
              {
                k: 'Semeadura',
                label: t('calendar.sow'),
                icon: <Sprout className="h-3.5 w-3.5" />,
                on: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
              },
              {
                k: 'Transplante',
                label: t('calendar.transplant'),
                icon: <Shovel className="h-3.5 w-3.5" />,
                on: 'bg-sky-100 text-sky-900 ring-sky-200',
              },
              {
                k: 'Colheita',
                label: t('calendar.harvest'),
                icon: <ShoppingBasket className="h-3.5 w-3.5" />,
                on: 'bg-amber-100 text-amber-900 ring-amber-200',
              },
            ].map((a) => {
              const active = actions.includes(a.k as ActionKey);
              return (
                <motion.button
                  key={a.k}
                  onClick={() => toggleAction(a.k as ActionKey)}
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-[12px] font-semibold ring-1 transition ${
                    active
                      ? `${a.on} border-transparent`
                      : 'bg-[var(--color-surface)] text-[color:var(--color-text-muted)] ring-[color:var(--color-border)] hover:text-[var(--color-primary-strong)]'
                  }`}
                  title={a.label}
                >
                  {a.icon} {a.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="relative w-full">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('calendar.search')}
            className="h-12 w-full rounded-2xl border border-[color:var(--color-border)] bg-[var(--color-surface)] py-2 pr-3 pl-12 text-sm text-[color:var(--color-text)] placeholder:text-[var(--color-text-muted)]"
          />
        </div>
      </motion.section>

      <div ref={ganttAnchorRef} />

      <motion.section
        initial={{ opacity: 0, y: 20, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, delay: 0.12, ease: 'easeOut' }}
        className="glass-panel overflow-hidden p-2 sm:p-3"
      >
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
      </motion.section>
    </main>
  );
}

function CalendarIcon() {
  return <Sprout className="h-4 w-4" aria-hidden />;
}
