import { NextResponse } from 'next/server';
import { getAuthUser, getServerSupabase } from '@/lib/supabaseServer';

export async function POST() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const supabase = await getServerSupabase();
  const name = (user.user_metadata as Record<string, unknown> | undefined)?.['name'] as
    | string
    | undefined;
  const email = user.email || '';

  const { error } = await supabase
    .from('users')
    .upsert({ id: user.id, name: name ?? '', email }, { onConflict: 'id' });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
