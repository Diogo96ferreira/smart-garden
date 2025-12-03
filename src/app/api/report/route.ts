import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { getServerSupabase, getAuthUser } from '@/lib/supabaseServer';
import { generatePdf } from '@/lib/pdfGenerator';
import { parseActionKey, type Locale } from '@/lib/nameMatching';
import { computeWateringDelta, getWeatherByLocation, type UserLocation } from '@/lib/weather';

export type Row = { date: string; title: string; description?: string };

function toCsv(rows: Array<Record<string, unknown>>): string {
  if (!rows.length) return 'date,title,description\n';
  const headers = ['date', 'title', 'description'];
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(',')];
  for (const r of rows) {
    const row = r as { date?: unknown; title?: unknown; description?: unknown };
    lines.push([esc(row.date), esc(row.title), esc(row.description)].join(','));
  }
  return lines.join('\n');
}

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_REGEX = /[\x00-\x1F\x7F]/g;

export async function GET(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const supabase = await getServerSupabase();
    const { searchParams } = new URL(req.url);

    const rangeDays = Math.max(1, Math.min(62, Number(searchParams.get('rangeDays') ?? '30')));

    const locale: Locale = (searchParams.get('locale') ?? 'pt').toLowerCase().startsWith('en')
      ? 'en'
      : 'pt';

    const format = (searchParams.get('format') ?? 'pdf').toLowerCase();

    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(start);
    end.setDate(start.getDate() + rangeDays + 1);

    // Parse location for weather-aware extrapolation
    const locParam = searchParams.get('location');
    let location: UserLocation | null = null;
    if (locParam) {
      try {
        location = JSON.parse(locParam);
      } catch {}
    }

    // Calculate weather delta
    let delta = 0;
    if (location) {
      try {
        const summary = await getWeatherByLocation(location);
        const res = computeWateringDelta(summary);
        delta = res.delta;
      } catch (e) {
        console.warn('[report] weather lookup failed:', e);
      }
    }

    type PlantRow = {
      id: string;
      name: string;
      watering_freq: number;
      last_watered?: string | null;
    };

    // Always fetch plants for synthesis to fill gaps
    const { data: plantsData } = await supabase
      .from('plants')
      .select('id,name,watering_freq,last_watered')
      .eq('user_id', user.id);

    const plants = (plantsData as PlantRow[] | null) ?? [];

    const rows: Row[] = [];

    // 1. Fetch existing DB tasks (Priority)
    const { data: tasksDb } = await supabase
      .from('tasks')
      .select('title,description,due_date')
      .eq('user_id', user.id)
      .gte('due_date', start.toISOString().slice(0, 10))
      .lt('due_date', end.toISOString().slice(0, 10));

    for (const t of (tasksDb ?? []) as {
      title?: string | null;
      description?: string | null;
      due_date?: string | null;
    }[]) {
      rows.push({
        date: (t.due_date ?? '').slice(0, 10),
        title: t.title ?? '',
        description: t.description ?? '',
      });
    }

    // 2. Synthesize future tasks (Extrapolation)
    if (plants && plants.length) {
      for (const p of plants) {
        // Apply weather delta to frequency
        const baseFreq = p.watering_freq ?? 3;
        const freq = Math.max(1, Math.min(60, baseFreq + delta));

        let next = p.last_watered ? new Date(p.last_watered) : new Date(start);
        if (Number.isNaN(next.getTime())) next = new Date(start);
        next.setHours(0, 0, 0, 0);

        // Advance to start date
        while (next < start) next.setDate(next.getDate() + freq);

        const lastStr = p.last_watered
          ? new Date(p.last_watered).toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-PT')
          : locale === 'en'
            ? 'never'
            : 'nunca';

        while (next < end) {
          const d = next.toISOString().slice(0, 10);
          rows.push({
            date: d,
            title: locale === 'en' ? `Water: ${p.name}` : `Regar: ${p.name}`,
            description:
              locale === 'en'
                ? `Water every ${freq} day(s). Last watering: ${lastStr}.`
                : `Regar a cada ${freq} dia(s). Última rega: ${lastStr}.`,
          });

          next.setDate(next.getDate() + freq);
        }
      }
    }

    // Deduplicar por (data, ação, planta)
    const seen = new Set<string>();
    const unique: Row[] = [];

    for (const r of rows) {
      const action = parseActionKey(r.title, locale);
      const plant = (r.title.split(':')[1] || '').trim().toLowerCase();
      const key = `${r.date}|${action}|${plant}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(r);
    }

    unique.sort((a, b) =>
      a.date === b.date ? a.title.localeCompare(b.title) : a.date.localeCompare(b.date),
    );

    // Sanitizar conteúdo para fontes core do PDF
    const clean = (s: unknown) =>
      String(s ?? '')
        .replace(CONTROL_CHARS_REGEX, '')
        .replace(/\uFFFD/g, '');

    for (let i = 0; i < unique.length; i++) {
      unique[i] = {
        date: unique[i].date,
        title: clean(unique[i].title),
        description: unique[i].description ? clean(unique[i].description) : undefined,
      };
    }

    // JSON
    if (format === 'json') {
      return NextResponse.json({ rows: unique, rangeDays });
    }

    // CSV
    if (format === 'csv') {
      const csv = toCsv(unique as Array<Record<string, unknown>>);
      const filename = `plano-${locale}-${new Date().toISOString().slice(0, 10)}-${rangeDays}d.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=${filename}`,
        },
      });
    }

    // Generate PDF using react-pdf
    const filename = `plan-${locale}-${new Date().toISOString().slice(0, 10)}-${rangeDays}d.pdf`;
    const pdfBuffer = await generatePdf({ locale, rangeDays, unique, filename });
    const arrayBuffer = new ArrayBuffer(pdfBuffer.byteLength);
    new Uint8Array(arrayBuffer).set(pdfBuffer);
    const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
    return new NextResponse(pdfBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${filename}`,
      },
    });
  } catch (error) {
    console.error('[report] error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
