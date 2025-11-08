import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { computeWateringDelta, getWeatherByLocation, type UserLocation } from '@/lib/weather';
import { getServerSupabase, getAuthUser } from '@/lib/supabaseServer';
import {
  matchPlantFromText as matchShared,
  parseActionKey,
  normalize,
  expandAliases,
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

// removed unused helper to keep build clean

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function ruleBasedTasks(
  plants: Plant[],
  locale: 'pt' | 'en',
  opts?: { wateringDelta?: number; skipWateringToday?: boolean; horizonDays?: number },
): GeneratedTask[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayStr = today.toISOString().slice(0, 10);
  const formatDate = (value?: string | null) => {
    if (!value) return locale === 'en' ? 'never' : 'nunca';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return locale === 'en' ? 'never' : 'nunca';
    return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-PT');
  };

  const delta = opts?.wateringDelta ?? 0;
  const skipToday = Boolean(opts?.skipWateringToday);
  const horizonDays = Math.max(0, opts?.horizonDays ?? 0);
  const endDay = new Date(today);
  endDay.setDate(endDay.getDate() + horizonDays);

  return plants.reduce<GeneratedTask[]>((acc, plant) => {
    const effectiveFreq = clamp((plant.watering_freq ?? 3) + delta, 1, 60);
    const title = locale === 'en' ? `Water: ${plant.name}` : `Regar: ${plant.name}`;
    const description =
      locale === 'en'
        ? `Water every ${effectiveFreq} day(s). Last watering: ${formatDate(plant.last_watered)}.`
        : `Regar a cada ${effectiveFreq} dia(s). Última rega: ${formatDate(plant.last_watered)}.`;

    // Determine first due date
    let next: Date;
    if (!plant.last_watered) {
      next = new Date(today); // unknown last watering -> due today
    } else {
      const last = new Date(plant.last_watered);
      if (Number.isNaN(last.getTime())) {
        next = new Date(today);
      } else {
        last.setHours(0, 0, 0, 0);
        next = new Date(last);
        next.setDate(last.getDate() + effectiveFreq);
      }
    }

    // Emit tasks up to endDay
    while (next <= endDay) {
      const dueStr = next.toISOString().slice(0, 10);
      // Skip only if it's exactly today and skipToday is true
      if (!(skipToday && dueStr === todayStr)) {
        acc.push({
          title,
          description,
          image: plant.image_url ?? null,
          plant_id: plant.id,
          due_date: dueStr,
        });
      }
      next = new Date(next);
      next.setDate(next.getDate() + effectiveFreq);
    }

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

  // Helper: find all plants mentioned in a text
  const findMentioned = (text: string) => {
    const t = normalize(text);
    const hits: Plant[] = [];
    for (const p of plants) {
      const variants = new Set<string>([...expandAliases(p.name || '', locale)]);
      let found = false;
      for (const v of variants) {
        if (!v) continue;
        if (t.includes(v)) {
          found = true;
          break;
        }
      }
      if (found) hits.push(p);
    }
    return hits;
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ text: `${system}\n${content}` }],
      config: { responseMimeType: 'application/json' },
    });

    const text = response.text?.trim();
    if (!text) return [];

    const payload = JSON.parse(text) as { title: string; description?: string }[];
    const results: GeneratedTask[] = [];
    for (const task of payload) {
      const action = parseActionKey(task.title, locale as Locale);
      if (action === 'water') {
        const mentions = findMentioned(`${task.title} ${task.description ?? ''}`);
        if (mentions.length === 0) {
          // Skip ambiguous watering task with no specific plant
          continue;
        }
        for (const plant of mentions) {
          results.push({
            title: locale === 'en' ? `Water: ${plant.name}` : `Regar: ${plant.name}`,
            description: task.description ?? null,
            image: plant.image_url ?? null,
            plant_id: plant.id,
          });
        }
      } else {
        const matched = matchPlantFromTextShared(task, plants, locale);
        results.push({
          title: task.title,
          description: task.description ?? null,
          image: matched?.image_url ?? null,
          plant_id: matched?.id ?? null,
        });
      }
    }
    return results;
  } catch (error) {
    console.warn('[generate-tasks] AI generation failed, falling back:', error);
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const supabase = await getServerSupabase();
    const {
      locale: rawLocale,
      location,
      resetAll,
      horizonDays,
    } = (await req.json().catch(() => ({}))) as {
      locale?: string;
      location?: UserLocation | null;
      resetAll?: boolean;
      horizonDays?: number;
    };
    const locale: 'pt' | 'en' = rawLocale?.toLowerCase().startsWith('en') ? 'en' : 'pt';

    const { data: plants, error: plantsError } = await supabase
      .from('plants')
      .select('id,name,type,watering_freq,last_watered,image_url')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (plantsError) throw plantsError;

    // Optional purge: remove all existing tasks before regenerating
    if (resetAll) {
      try {
        await supabase
          .from('tasks')
          .delete()
          .eq('user_id', user.id)
          .gte('created_at', '1970-01-01');
      } catch (err) {
        console.warn('[generate-tasks] resetAll failed:', err);
      }
    }

    const plantList = (plants ?? []) as Plant[];

    // Optional: weather-aware adjustment when a user location is provided
    let delta = 0;
    let skipToday = false;
    if (location && (location.distrito || location.municipio)) {
      try {
        const summary = await getWeatherByLocation(location);
        const res = computeWateringDelta(summary);
        delta = res.delta;
        skipToday = res.skipToday;
      } catch (e) {
        console.warn('[generate-tasks] weather lookup failed:', e);
      }
    }

    const baseTasks = ruleBasedTasks(plantList, locale, {
      wateringDelta: delta,
      skipWateringToday: skipToday,
      horizonDays: Math.max(
        0,
        Number.isFinite(horizonDays as number) ? (horizonDays as number) : 0,
      ),
    });
    const aiGenerated = (horizonDays ?? 0) > 0 ? [] : await aiTasks(plantList, locale);

    // Normalize day for dedupe (AI tasks may not include due_date)
    const todayStr = new Date().toISOString().slice(0, 10);
    const dayOf = (t: { due_date?: string | null }) =>
      t.due_date ? t.due_date.slice(0, 10) : todayStr;

    // Avoid AI duplicating rule-based tasks for the same plant/action/day
    const baseKeys = new Set(
      baseTasks.map((t) => {
        const action = parseActionKey(t.title, locale);
        return `${t.plant_id ?? 'null'}|${action}|${dayOf(t)}`;
      }),
    );
    const aiFiltered = aiGenerated.filter((t) => {
      const action = parseActionKey(t.title, locale);
      const key = `${t.plant_id ?? 'null'}|${action}|${dayOf(t)}`;
      return !baseKeys.has(key);
    });

    // Deduplicate within this batch
    const inBatchSeen = new Set<string>();
    const candidates = [...baseTasks, ...aiFiltered].filter((task) => {
      const action = parseActionKey(task.title, locale);
      const key = `${task.plant_id ?? 'null'}|${action}|${dayOf(task)}`;
      if (inBatchSeen.has(key)) return false;
      inBatchSeen.add(key);
      return true;
    });

    if (!candidates.length) {
      return NextResponse.json({ inserted: 0, tasks: [] });
    }

    // Prevent any overlap: consult all pending tasks instead of just today's
    const { data: pending, error: pendingError } = await supabase
      .from('tasks')
      .select('title,plant_id,done,due_date,created_at')
      .eq('user_id', user.id)
      .eq('done', false);
    if (pendingError) throw pendingError;

    const existingKeys = new Set(
      (pending ?? []).map(
        (row: {
          title?: string | null;
          plant_id?: string | null;
          due_date?: string | null;
          created_at?: string | null;
        }) => {
          const action = parseActionKey(row.title ?? '', locale);
          const day = (row.due_date || row.created_at || '').slice(0, 10);
          return `${row.plant_id ?? 'null'}|${action}|${day}`;
        },
      ),
    );
    const existingUntypedTitles = new Set(
      (pending ?? [])
        .filter((r: { plant_id?: string | null }) => !r.plant_id)
        .map((r: { title?: string | null }) => (r.title ?? '').toLowerCase()),
    );

    const unique = candidates.filter((task) => {
      const action = parseActionKey(task.title, locale);
      const day = dayOf(task);
      const key = `${task.plant_id ?? 'null'}|${action}|${day}`;
      if (existingKeys.has(key)) return false;
      if (!task.plant_id) {
        const t = (task.title || '').toLowerCase();
        if (existingUntypedTitles.has(t)) return false;
      }
      existingKeys.add(key);
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
      user_id: user.id,
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
          user_id: user.id,
        }));
        const response = await supabase.from('tasks').insert(fallback).select('*');
        if (response.error) {
          const msg2 = String(response.error.message ?? '');
          if (/image/i.test(msg2)) {
            const minimal = unique.map((task) => ({
              title: task.title,
              description: task.description ?? null,
              user_id: user.id,
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
          user_id: user.id,
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
