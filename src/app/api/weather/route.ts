import { NextResponse } from 'next/server';
import { computeWateringDelta, getWeatherByLocation, type UserLocation } from '@/lib/weather';

function makeNote(locale: 'pt' | 'en', opts: { skipToday: boolean; delta: number }): string {
  const { skipToday, delta } = opts;
  if (skipToday) {
    return locale === 'en'
      ? "It's been raining in your area — no need to water today. Check back tomorrow; if needed, you'll see it in tasks."
      : 'Tem chovido na tua zona, não precisamos de regar hoje. Volta amanhã e se for preciso terás nas tarefas';
  }
  if (delta < 0) {
    return locale === 'en'
      ? "It's very hot — we will bring watering forward."
      : 'Está muito quente, temos de antecipar as regas';
  }
  return '';
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      locale?: string;
      location?: UserLocation | null;
    };
    const locale: 'pt' | 'en' = body.locale?.toLowerCase().startsWith('en') ? 'en' : 'pt';
    const location = body.location;

    if (!location || (!location.distrito && !location.municipio)) {
      return NextResponse.json({ note: null });
    }

    const summary = await getWeatherByLocation(location);
    if (!summary) return NextResponse.json({ note: null });

    const { delta, skipToday } = computeWateringDelta(summary);
    const note = makeNote(locale, { skipToday, delta });

    return NextResponse.json({ note, delta, skipToday, summary });
  } catch (error) {
    console.warn('[weather] error:', error);
    return NextResponse.json({ note: null });
  }
}
