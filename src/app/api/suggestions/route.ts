import { NextResponse } from 'next/server';
import { getAuthUser, getServerSupabase } from '@/lib/supabaseServer';

type Suggestion = {
  id: string;
  title: string;
  description?: string;
  action?: 'create_task' | 'open_garden' | 'open_calendar';
  plant_id?: string | null;
};

export async function GET(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ suggestions: [] });
    const supabase = await getServerSupabase();

    const url = new URL(req.url);
    const locale = (url.searchParams.get('locale') || 'pt').toLowerCase().startsWith('en')
      ? 'en'
      : 'pt';

    const { data: plants } = await supabase
      .from('plants')
      .select('id,name,type,watering_freq,image_url')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    const list: Suggestion[] = [];
    const now = new Date();
    const month = now.getMonth() + 1;
    const hasTomato = (plants ?? []).some((p) => /tomate/i.test(p.name || ''));
    const anyNoImage = (plants ?? []).some((p) => !p.image_url);
    const anyHighFreq = (plants ?? []).some((p) => (p.watering_freq ?? 3) >= 4);

    if (anyNoImage) {
      list.push({
        id: 'add-photos',
        title: locale === 'en' ? 'Add photos to your plants' : 'Adicione fotos às suas plantas',
        description:
          locale === 'en'
            ? 'Help you recognize them at a glance and get better tips.'
            : 'Ajuda a reconhecê‑las num instante e melhora as dicas.',
        action: 'open_garden',
      });
    }

    if (month >= 5 && month <= 9) {
      list.push({
        id: 'mulch',
        title: locale === 'en' ? 'Apply mulch' : 'Aplicar cobertura morta (mulch)',
        description:
          locale === 'en'
            ? 'Mulch helps retain moisture and protect roots during heat.'
            : 'A cobertura morta ajuda a reter humidade e proteger as raízes no calor.',
        action: 'create_task',
      });
    }

    if (hasTomato) {
      list.push({
        id: 'inspect-tomatoes',
        title:
          locale === 'en'
            ? 'Inspect tomatoes: pests and diseases'
            : 'Inspecionar tomateiros: pragas e doenças',
        description:
          locale === 'en'
            ? 'Look for aphids and fungal spots; remove affected leaves.'
            : 'Procure afídeos e manchas fúngicas; remova folhas afetadas.',
        action: 'create_task',
      });
    }

    if (anyHighFreq) {
      list.push({
        id: 'night-watering',
        title: locale === 'en' ? 'Water at night' : 'Regar à noite',
        description:
          locale === 'en'
            ? 'Reduce evaporation and stress: schedule watering for the evening.'
            : 'Reduza evaporação e stress: agende a rega para o final do dia.',
        action: 'create_task',
      });
    }

    // Cap to 3 suggestions
    const suggestions = list.slice(0, 3);
    return NextResponse.json({ suggestions });
  } catch (error) {
    return NextResponse.json({ suggestions: [] });
  }
}
