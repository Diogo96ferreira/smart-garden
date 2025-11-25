import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { getServerSupabase, getAuthUser } from '@/lib/supabaseServer';
import PDFDocument from 'pdfkit';
import { parseActionKey, type Locale } from '@/lib/nameMatching';

function toCsv(rows: Array<Record<string, unknown>>): string {
  if (!rows.length) return 'date,title,description\n';
  const headers = ['date', 'title', 'description'];
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const lines = [headers.join(',')];
  for (const r of rows) lines.push([esc(r.date), esc(r.title), esc(r.description)].join(','));
  return lines.join('\n');
}

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
    const source = (searchParams.get('source') ?? 'mixed').toLowerCase(); // 'db' | 'mixed'

    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(start);
    end.setDate(start.getDate() + rangeDays + 1);

    // Load plants for cadence extrapolation (skip when source == 'db')
    const includeSynthesis = source !== 'db';
    const { data: plants } = includeSynthesis
      ? await supabase
          .from('plants')
          .select('id,name,watering_freq,last_watered')
          .eq('user_id', user.id)
      : ({ data: null } as any);

    type Row = { date: string; title: string; description?: string };
    const rows: Row[] = [];

    if (includeSynthesis && plants && plants.length) {
      for (const p of plants as {
        id: string;
        name: string;
        watering_freq: number;
        last_watered?: string | null;
      }[]) {
        const freq = Math.max(1, Math.min(60, Number(p.watering_freq ?? 3)));
        let next = p.last_watered ? new Date(p.last_watered) : new Date(start);
        if (Number.isNaN(next.getTime())) next = new Date(start);
        next.setHours(0, 0, 0, 0);
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

    // Include existing tasks in the window
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

    // Dedupe by (date, action, plant)
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

    if (format === 'json') {
      return NextResponse.json({ rows: unique, rangeDays });
    }
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

    // PDF — styled, branded
    // Usar fontes padrão do PDFKit que funcionam no Vercel
    const headingName = 'Courier-Bold';
    const bodyName = 'Courier';

    const doc = new PDFDocument({
      size: 'A4',
      margin: 42,
    });

    // Definir fonte padrão imediatamente
    doc.font(bodyName);

    const chunks: Uint8Array[] = [];
    const filename = `plan-${locale}-${new Date().toISOString().slice(0, 10)}-${rangeDays}d.pdf`;
    doc.on('data', (c: Uint8Array) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) =>
      doc.on('end', () => resolve(Buffer.concat(chunks))),
    );

    // Brand colors
    const COLOR = {
      primary: '#22c55e',
      text: '#111111',
      muted: '#6b7280',
      border: '#e5e7eb',
      chip: {
        water: '#10b981',
        prune: '#ef4444',
        fertilize: '#f59e0b',
        inspect: '#64748b',
        harvest: '#16a34a',
        sow: '#8b5cf6',
        transplant: '#0ea5e9',
        other: '#6b7280',
      },
    } as const;

    const parseAction = (title: string): keyof typeof COLOR.chip => {
      const t = (title || '').toLowerCase();
      if (/\b(water|regar|rega)\b/.test(t)) return 'water';
      if (/\b(prune|poda|podar)\b/.test(t)) return 'prune';
      if (/\b(fertil|adub)\b/.test(t)) return 'fertilize';
      if (/\b(inspect|verificar|inspecionar)\b/.test(t)) return 'inspect';
      if (/\b(harvest|colher|colheita)\b/.test(t)) return 'harvest';
      if (/\b(sow|semear|semeadura)\b/.test(t)) return 'sow';
      if (/\b(transplant|transplante|transplantar)\b/.test(t)) return 'transplant';
      return 'other';
    };

    const fmtDate = (iso: string) =>
      new Date(iso).toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-PT', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      });

    // Header band
    const headerH = 70;
    doc.save();
    doc
      .rect(
        doc.page.margins.left,
        doc.page.margins.top,
        doc.page.width - doc.page.margins.left - doc.page.margins.right,
        headerH,
      )
      .fill('#ffffff');
    doc
      .fillColor(COLOR.primary)
      .rect(
        doc.page.margins.left,
        doc.page.margins.top + headerH - 4,
        doc.page.width - doc.page.margins.left - doc.page.margins.right,
        4,
      )
      .fill();
    doc.fillColor(COLOR.text);

    // Logo skipped (no FS access)

    // Title + meta (fontes já definidas acima)
    doc
      .font(headingName)
      .fontSize(18)
      .fillColor(COLOR.text)
      .text(
        locale === 'en' ? 'Smart Garden — Care Plan' : 'Smart Garden — Plano de cuidados',
        doc.page.margins.left + 56,
        doc.page.margins.top + 12,
      );
    doc
      .font(bodyName)
      .fontSize(10)
      .fillColor(COLOR.muted)
      .text(
        `${new Date().toLocaleString(locale === 'en' ? 'en-US' : 'pt-PT')}  •  ${rangeDays} ${
          locale === 'en' ? 'days' : 'dias'
        }`,
        doc.page.margins.left + 56,
        doc.page.margins.top + 36,
      );

    doc.restore();
    doc.moveDown(2);
    doc.translate(0, headerH - 10);

    // Legend
    const legendY = doc.y;
    const chips: Array<{ k: keyof typeof COLOR.chip; label: string }> = [
      { k: 'water', label: locale === 'en' ? 'Water' : 'Regar' },
      { k: 'prune', label: locale === 'en' ? 'Prune' : 'Podar' },
      { k: 'fertilize', label: locale === 'en' ? 'Fertilize' : 'Adubar' },
      { k: 'inspect', label: locale === 'en' ? 'Inspect' : 'Inspecionar' },
      { k: 'harvest', label: locale === 'en' ? 'Harvest' : 'Colher' },
      { k: 'sow', label: locale === 'en' ? 'Sow' : 'Semear' },
      { k: 'transplant', label: locale === 'en' ? 'Transplant' : 'Transplantar' },
    ];
    let lx = doc.page.margins.left;
    for (const c of chips) {
      const w = doc.widthOfString(c.label) + 18;
      doc.save();
      doc.roundedRect(lx, legendY, w, 16, 8).fillOpacity(0.12).fill(COLOR.chip[c.k]);
      doc
        .fillOpacity(1)
        .fillColor(COLOR.chip[c.k])
        .font(bodyName)
        .fontSize(9)
        .text(c.label, lx + 8, legendY + 3);
      doc.restore();
      lx += w + 8;
    }
    doc.moveDown(1.6);

    // Group by date and render items
    let currentDate = '';
    for (const r of unique) {
      if (r.date !== currentDate) {
        currentDate = r.date;
        doc.moveDown(0.6);
        // date separator
        doc.fillColor(COLOR.primary).rect(doc.page.margins.left, doc.y, 4, 16).fill();
        doc
          .fillColor(COLOR.text)
          .font(headingName)
          .fontSize(12)
          .text(fmtDate(r.date), doc.page.margins.left + 10, doc.y - 2);
        doc.moveDown(0.2);
      }
      const action = parseAction(r.title || '');
      // chip
      const chipW = 56;
      const y0 = doc.y + 2;
      doc.save();
      doc
        .roundedRect(doc.page.margins.left + 10, y0, chipW, 14, 7)
        .fillOpacity(0.12)
        .fill(COLOR.chip[action]);
      doc
        .fillOpacity(1)
        .fillColor(COLOR.chip[action])
        .font(bodyName)
        .fontSize(8)
        .text(action.toUpperCase(), doc.page.margins.left + 16, y0 + 3);
      doc.restore();
      // text
      doc
        .font(headingName)
        .fontSize(11)
        .fillColor(COLOR.text)
        .text(r.title, doc.page.margins.left + chipW + 20, doc.y - 14);
      if (r.description) {
        doc
          .font(bodyName)
          .fontSize(9)
          .fillColor(COLOR.muted)
          .text(String(r.description), { indent: 16, continued: false });
      }
      doc.moveDown(0.3);
      // divider
      doc.save();
      doc
        .strokeColor(COLOR.border)
        .moveTo(doc.page.margins.left + 10, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .stroke();
      doc.restore();
    }

    // Footer page numbers
    const rangeLabel = `${rangeDays} ${locale === 'en' ? 'days' : 'dias'}`;
    const addFooter = () => {
      const page = (doc as any).page;
      const text = `${rangeLabel}  •  Page ${page.number}`;
      doc.font(bodyName).fontSize(8).fillColor(COLOR.muted);
      doc.text(text, doc.page.margins.left, doc.page.height - doc.page.margins.bottom + 10, {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        align: 'center',
      });
    };
    addFooter();
    doc.on('pageAdded', addFooter);

    doc.end();
    const pdfBuffer = await done;
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${filename}`,
      },
    });
  } catch (error) {
    console.error('[report] error:', error);
    return NextResponse.json({ error: 'failed_to_generate_report' }, { status: 500 });
  }
}
