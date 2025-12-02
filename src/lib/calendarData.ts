import { ActionKey } from '@/components/ui/GanttChart';

export type Zone = `ZONA ${1 | 2 | 3 | 4 | 5}`;
export type ZonasMeta = Record<Zone, { descricao?: string; distritos: string[]; notas?: string }>;
export type ZoneData = Record<
  string,
  Partial<Record<ActionKey | 'Sowing' | 'Transplant' | 'Transplanting' | 'Harvest', string[]>>
>;
export type CalendarDataRaw = { zonas: ZonasMeta; calendario: Record<Zone, ZoneData> };
export type ZonaMap = Record<string, Partial<Record<Zone, string[]>>>;

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

export function detectZone({
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

export async function fetchCalendarData(locale: string) {
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

  return { zonas, calendario, zonemap: zm };
}
