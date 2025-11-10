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

    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(start);
    end.setDate(start.getDate() + rangeDays + 1);

    // Load plants for cadence extrapolation
    const { data: plants } = await supabase
      .from('plants')
      .select('id,name,watering_freq,last_watered')
      .eq('user_id', user.id);

    type Row = { date: string; title: string; description?: string };
    const rows: Row[] = [];

    if (plants && plants.length) {
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

    // PDF
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks: Uint8Array[] = [];
    const filename = `plano-${locale}-${new Date().toISOString().slice(0, 10)}-${rangeDays}d.pdf`;
    doc.on('data', (c: Uint8Array) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) =>
      doc.on('end', () => resolve(Buffer.concat(chunks))),
    );

    // Header
    doc
      .fontSize(18)
      .fillColor('#111')
      .text(locale === 'en' ? 'Care Plan' : 'Plano de cuidados');
    doc.moveDown(0.2);
    doc
      .fontSize(10)
      .fillColor('#555')
      .text(`${new Date().toLocaleString(locale === 'en' ? 'en-US' : 'pt-PT')}`);
    doc.moveDown(0.8);

    // Group by date
    let currentDate = '';
    for (const r of unique) {
      if (r.date !== currentDate) {
        currentDate = r.date;
        doc.moveDown(0.6);
        doc
          .fontSize(12)
          .fillColor('#0f5132')
          .text(new Date(r.date).toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-PT'), {
            underline: true,
          });
        doc.moveDown(0.2);
      }
      doc.fontSize(11).fillColor('#111').text(`• ${r.title}`);
      if (r.description) doc.fontSize(9).fillColor('#555').text(r.description, { indent: 16 });
      doc.moveDown(0.2);
    }

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
