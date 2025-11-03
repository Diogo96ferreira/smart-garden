import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/lib/supabaseClient';
import {
  matchPlantFromText as matchShared,
  parseActionKey,
  type Locale,
  type PlantLike,
} from '@/lib/nameMatching';

type Plant = {
  id: string;
  name: string;
  type?: 'horta' | 'pomar' | null;
  watering_freq: number;
  last_watered?: string | null;
  image_url?: string | null;
};

type GeneratedTask = {
  title: string;
  description?: string | null;
  image?: string | null;
  plant_id?: string | null;
  due_date?: string | null;
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

function daysSince(dateIso?: string | null): number | null {
  if (!dateIso) return null;
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function ruleBasedTasks(plants: Plant[], locale: 'pt' | 'en'): GeneratedTask[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayStr = today.toISOString().slice(0, 10);
  const formatDate = (value?: string | null) => {
    if (!value) return locale === 'en' ? 'never' : 'nunca';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return locale === 'en' ? 'never' : 'nunca';
    return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-PT');
  };

  return plants.reduce<GeneratedTask[]>((acc, plant) => {
    const since = daysSince(plant.last_watered);
    const isDue = since === null || since >= plant.watering_freq;
    if (!isDue) return acc;

    const title = locale === 'en' ? `Water: ${plant.name}` : `Regar: ${plant.name}`;
    const description =
      locale === 'en'
        ? `Water every ${plant.watering_freq} day(s). Last watering: ${formatDate(plant.last_watered)}.`
        : `Regar a cada ${plant.watering_freq} dia(s). Ultima rega: ${formatDate(plant.last_watered)}.`;

    acc.push({
      title,
      description,
      image: plant.image_url ?? null,
      plant_id: plant.id,
      due_date: todayStr,
    });
    return acc;
  }, []);
}

function matchPlantFromTextShared(
  task: { title: string; description?: string | null },
  plants: Plant[],
  locale: Locale,
): Plant | null {
  const mapped: PlantLike[] = plants.map((plant) => ({
    id: plant.id,
    name: plant.name,
    species: null,
  }));
  const matched = matchShared(task, mapped, locale);
  if (!matched) return null;
  return plants.find((plant) => plant.id === matched.id) ?? null;
}

async function aiTasks(plants: Plant[], locale: Locale): Promise<GeneratedTask[]> {
  if (!ai) return [];

  const today = new Date().toISOString().slice(0, 10);
  const localeName = locale === 'en' ? 'English (United States)' : 'Portugues (Portugal)';
  const system = `You are an expert kitchen garden/orchard assistant. Output strictly and only a compact JSON array of tasks.
Each task has: {"title": string, "description": string} in the requested locale. Avoid extra fields or commentary.`;

  const content = `Locale: ${localeName}
Today: ${today}
Plants: ${JSON.stringify(
    plants.map((plant) => ({
      name: plant.name,
      type: plant.type ?? 'horta',
      watering_freq: plant.watering_freq,
      last_watered: plant.last_watered ?? null,
    })),
  )}

Generate at most 6 actionable tasks for the next 7 days. Include watering due items and 1-2 seasonal care tasks (fertilize, prune, mulch) when appropriate. Keep titles <= 60 chars. Use natural ${
    locale === 'en' ? 'US English' : 'Portuguese'
  } suitable for a gardening app.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ text: `${system}\n${content}` }],
      config: { responseMimeType: 'application/json' },
    });

    const text = response.text?.trim();
    if (!text) return [];

    const payload = JSON.parse(text) as { title: string; description?: string }[];
    return payload.map((task) => {
      const matched = matchPlantFromTextShared(task, plants, locale);
      return {
        title: task.title,
        description: task.description ?? null,
        image: matched?.image_url ?? null,
        plant_id: matched?.id ?? null,
      };
    });
  } catch (error) {
    console.warn('[generate-tasks] AI generation failed, falling back:', error);
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const { locale: rawLocale } = (await req.json().catch(() => ({}))) as { locale?: string };
    const locale: 'pt' | 'en' = rawLocale?.toLowerCase().startsWith('en') ? 'en' : 'pt';

    const { data: plants, error: plantsError } = await supabase
      .from('plants')
      .select('id,name,type,watering_freq,last_watered,image_url')
      .order('created_at', { ascending: true });
    if (plantsError) throw plantsError;

    const plantList = (plants ?? []) as Plant[];
    const baseTasks = ruleBasedTasks(plantList, locale);
    const aiGenerated = await aiTasks(plantList, locale);
    const candidates = [...baseTasks, ...aiGenerated];

    if (!candidates.length) {
      return NextResponse.json({ inserted: 0, tasks: [] });
    }

    const today = new Date();
    const startDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endDay = new Date(startDay);
    endDay.setDate(startDay.getDate() + 1);

    const { data: existing, error: existingError } = await supabase
      .from('tasks')
      .select('title,plant_id,created_at')
      .gte('created_at', startDay.toISOString())
      .lt('created_at', endDay.toISOString());
    if (existingError) throw existingError;

    const existingKeys = new Set(
      (existing ?? []).map(
        (row: { title?: string | null; plant_id?: string | null }) =>
          `${row.plant_id ?? 'null'}|${parseActionKey(row.title ?? '', locale)}`,
      ),
    );

    const unique = candidates.filter((task) => {
      const key = `${task.plant_id ?? 'null'}|${parseActionKey(task.title, locale)}`;
      if (existingKeys.has(key)) return false;
      if (!task.plant_id) {
        const duplicate = (existing ?? []).some(
          (row: { title?: string | null; plant_id?: string | null }) =>
            !row.plant_id && (row.title ?? '').toLowerCase() === task.title.toLowerCase(),
        );
        if (duplicate) return false;
      }
      return true;
    });

    if (!unique.length) {
      return NextResponse.json({ inserted: 0, tasks: [] });
    }

    const fullPayload = unique.map((task) => ({
      title: task.title,
      description: task.description ?? null,
      image: task.image ?? null,
      plant_id: task.plant_id ?? null,
      due_date: task.due_date ?? null,
    }));

    let inserted: unknown[] | null = null;

    try {
      const response = await supabase.from('tasks').insert(fullPayload).select('*');
      if (response.error) throw response.error;
      inserted = response.data ?? null;
    } catch (error: unknown) {
      const message = String((error as { message?: string } | undefined)?.message ?? error);

      if (/plant_id/i.test(message)) {
        const fallback = unique.map((task) => ({
          title: task.title,
          description: task.description ?? null,
          image: task.image ?? null,
        }));
        const response = await supabase.from('tasks').insert(fallback).select('*');
        if (response.error) {
          const msg2 = String(response.error.message ?? '');
          if (/image/i.test(msg2)) {
            const minimal = unique.map((task) => ({
              title: task.title,
              description: task.description ?? null,
            }));
            const res3 = await supabase.from('tasks').insert(minimal).select('*');
            if (res3.error) throw res3.error;
            inserted = res3.data ?? null;
          } else {
            throw response.error;
          }
        } else {
          inserted = response.data ?? null;
        }
      } else if (/image/i.test(message)) {
        const fallback = unique.map((task) => ({
          title: task.title,
          description: task.description ?? null,
          plant_id: task.plant_id ?? null,
        }));
        const response = await supabase.from('tasks').insert(fallback).select('*');
        if (response.error) throw response.error;
        inserted = response.data ?? null;
      } else {
        throw error;
      }
    }

    return NextResponse.json({ inserted: inserted?.length ?? 0, tasks: inserted ?? [] });
  } catch (error) {
    console.error('[generate-tasks] error:', error);
    const message = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
