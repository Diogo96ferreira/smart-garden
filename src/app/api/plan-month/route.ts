import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { locale, location, resetAll, profile } = (await req.json().catch(() => ({}))) as {
      locale?: string;
      location?: { distrito?: string; municipio?: string } | null;
      resetAll?: boolean;
      profile?: string | null;
    };

    // Reuse the existing generator endpoint to avoid logic duplication
    const base = new URL(req.url);
    const generatorUrl = new URL('/api/generate-tasks', base.origin);

    const res = await fetch(generatorUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locale: (locale || 'pt').toLowerCase(),
        location: location ?? null,
        horizonDays: 30,
        resetAll: Boolean(resetAll),
        profile: profile ?? null,
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ error: json?.error || 'failed' }, { status: res.status });
    }
    return NextResponse.json({ ok: true, inserted: json.inserted ?? 0, tasks: json.tasks ?? [] });
  } catch (error) {
    console.error('[plan-month] error:', error);
    return NextResponse.json({ error: 'failed_to_plan' }, { status: 500 });
  }
}
