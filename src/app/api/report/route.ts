import { NextResponse } from 'next/server';
import { getServerSupabase, getAuthUser } from '@/lib/supabaseServer';

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
    const locale = (searchParams.get('locale') ?? 'pt').toLowerCase().startsWith('en')
      ? 'en'
      : 'pt';
    const format = (searchParams.get('format') ?? 'csv').toLowerCase();

    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(start);
    end.setDate(start.getDate() + rangeDays + 1);

    const { data, error } = await supabase
      .from('tasks')
      .select('title,description,due_date,done')
      .eq('user_id', user.id)
      .gte('due_date', start.toISOString().slice(0, 10))
      .lt('due_date', end.toISOString().slice(0, 10))
      .order('due_date', { ascending: true })
      .order('title', { ascending: true });
    if (error) throw error;

    const rows = (data ?? []).map(
      (t: { title?: string | null; description?: string | null; due_date?: string | null }) => ({
        date: (t.due_date ?? '').slice(0, 10),
        title: t.title ?? '',
        description: t.description ?? '',
      }),
    );

    if (format === 'json') {
      return NextResponse.json({ rows, rangeDays });
    }
    const csv = toCsv(rows);
    const filename = `plano-${locale}-${new Date().toISOString().slice(0, 10)}-${rangeDays}d.csv`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=${filename}`,
      },
    });
  } catch (error) {
    console.error('[report] error:', error);
    return NextResponse.json({ error: 'failed_to_generate_report' }, { status: 500 });
  }
}
