import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { GoogleGenAI, Type } from '@google/genai';
import { parseActionKey, type Locale } from '@/lib/nameMatching';

type HowToStep = { title: string; detail: string };
type HowToPayload = {
  title: string;
  steps: HowToStep[];
  tips?: string[];
  precautions?: string[];
};

// Light, best‑effort limiter (per instance)
const RL = new Map<string, { count: number; resetAt: number }>();
function allow(ip: string, max = 20, windowMs = 60_000) {
  const now = Date.now();
  const entry = RL.get(ip);
  if (!entry || now > entry.resetAt) {
    RL.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= max;
}

function fallbackHowTo(title: string, description: string | null, locale: Locale): HowToPayload {
  const action = parseActionKey(title, locale);
  const isEN = locale === 'en';

  const T = (pt: string, en: string) => (isEN ? en : pt);

  const stepsByAction: Record<string, HowToStep[]> = {
    water: [
      {
        title: T('Verifica a humidade', 'Check soil moisture'),
        detail: T(
          'Enterra um dedo 2–3 cm no solo. Se estiver seco, segue para a rega.',
          'Insert a finger 1–2 inches into the soil. If dry, proceed to water.',
        ),
      },
      {
        title: T('Regar na base', 'Water at the base'),
        detail: T(
          'Aponta a água para a base da planta, evitando molhar folhas.',
          'Pour water at the plant base, avoiding wetting leaves.',
        ),
      },
      {
        title: T('Quantidade certa', 'Right amount'),
        detail: T(
          'Regar até o solo ficar húmido em profundidade (sem encharcar).',
          'Water until soil is evenly moist (not soggy).',
        ),
      },
      {
        title: T('Mulch ajuda', 'Use mulch'),
        detail: T(
          'Se possível, cobre o solo com mulch para reter humidade.',
          'If possible, add mulch to help retain moisture.',
        ),
      },
    ],
    prune: [
      {
        title: T('Ferramentas limpas', 'Clean tools'),
        detail: T(
          'Desinfeta a tesoura. Cortes limpos evitam doenças.',
          'Disinfect pruners. Clean cuts reduce disease risk.',
        ),
      },
      {
        title: T('Remover ramos fracos', 'Remove weak growth'),
        detail: T(
          'Tira ramos secos/doentes e rebentos para dentro da copa.',
          'Remove dead/diseased twigs and inward‑growing shoots.',
        ),
      },
      {
        title: T('Corte acima de nó', 'Cut above a node'),
        detail: T(
          'Corta 0,5 cm acima de um nó, em ângulo, sem esmagar.',
          'Cut 1/4" above a node, at an angle, without crushing.',
        ),
      },
    ],
    fertilize: [
      {
        title: T('Escolher adubo', 'Choose fertilizer'),
        detail: T(
          'Usa adubo equilibrado ou composto bem curtido.',
          'Use a balanced fertilizer or well‑matured compost.',
        ),
      },
      {
        title: T('Dose e método', 'Dose and method'),
        detail: T(
          'Segue a dose da embalagem. Incorpora levemente no solo e rega a seguir.',
          'Follow label rate. Work into topsoil lightly and water afterwards.',
        ),
      },
    ],
    inspect: [
      {
        title: T('Olhar geral', 'General check'),
        detail: T(
          'Vê folhas (manchas, deformações), caules e solo (pragas).',
          'Check leaves (spots, deformities), stems, and soil (pests).',
        ),
      },
      {
        title: T('Ações rápidas', 'Quick actions'),
        detail: T(
          'Remove folhas muito afetadas; limpa pragas com água/sa sabão neutro.',
          'Remove heavily affected leaves; wash pests off with soapy water.',
        ),
      },
    ],
    harvest: [
      {
        title: T('Momento certo', 'Right timing'),
        detail: T(
          'Colhe de manhã cedo; frutos firmes e com cor adequada.',
          'Harvest early morning; fruits firm and at proper color.',
        ),
      },
      {
        title: T('Corte limpo', 'Clean cut'),
        detail: T(
          'Usa tesoura afiada; evita rasgar ramos.',
          'Use sharp scissors; avoid tearing stems.',
        ),
      },
    ],
    sow: [
      {
        title: T('Preparar substrato', 'Prepare substrate'),
        detail: T(
          'Usa substrato leve. Umedece antes de semear.',
          'Use light seed‑starting mix. Moisten before sowing.',
        ),
      },
      {
        title: T('Profundidade', 'Depth'),
        detail: T(
          'Semeia a 2–3× a espessura da semente. Cobre levemente.',
          'Sow at 2–3× seed thickness. Cover lightly.',
        ),
      },
    ],
    transplant: [
      {
        title: T('Aclimatar', 'Harden off'),
        detail: T(
          'Exponha as mudas ao exterior gradualmente 5–7 dias.',
          'Gradually expose seedlings outdoors for 5–7 days.',
        ),
      },
      {
        title: T('Plantio', 'Planting'),
        detail: T(
          'Plante ao entardecer, regue após o plantio e use mulch.',
          'Plant in the evening, water after planting and mulch.',
        ),
      },
    ],
  };

  const steps = stepsByAction[action] ?? [
    {
      title: T('Passos principais', 'Main steps'),
      detail: T(
        'Divide a tarefa em 2–4 passos simples: prepara, executa e valida o resultado.',
        'Break the task into 2–4 simple steps: prepare, execute, validate results.',
      ),
    },
  ];

  const taskName = title.replace(/^\s*(regar|water)\s*[:-]\s*/i, '').trim();
  return {
    title: T('Como fazer', 'How to') + (taskName ? ` — ${taskName}` : ''),
    steps,
    tips: [T('Evita horas de maior calor.', 'Avoid the hottest hours of the day.')],
  };
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
    if (!allow(String(ip))) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      title?: string;
      description?: string | null;
      locale?: string;
      profile?: string | null;
      plant?: { name?: string | null; type?: string | null } | null;
    };

    const title = (body.title || '').trim();
    const description = (body.description || '').trim() || null;
    const locale: Locale = body.locale?.toLowerCase().startsWith('en') ? 'en' : 'pt';

    if (!title) {
      return NextResponse.json({ error: 'missing_title' }, { status: 400 });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      const howto = fallbackHowTo(title, description, locale);
      return NextResponse.json({ howto, provider: 'fallback' });
    }

    const ai = new GoogleGenAI({ apiKey: key });
    const isEN = locale === 'en';

    const system = isEN
      ? `You are a concise gardening instructor. Output JSON only.
Each reply MUST follow this schema and be localized in English:
{
  "title": string,
  "steps": [{ "title": string, "detail": string }],
  "tips": string[],
  "precautions": string[]
}
Keep steps practical (2–6 items), safe, and specific to the task.`
      : `Es um instrutor de jardinagem conciso. Responde apenas em JSON.
Segue este esquema e responde em português (PT):
{
  "title": string,
  "steps": [{ "title": string, "detail": string }],
  "tips": string[],
  "precautions": string[]
}
Mantém passos práticos (2–6), seguros e específicos à tarefa.`;

    const user = `${isEN ? 'Task' : 'Tarefa'}: ${title}\n${description ? `${isEN ? 'Details' : 'Detalhes'}: ${description}` : ''}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ text: `${system}\n\n${user}` }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  detail: { type: Type.STRING },
                },
                required: ['title', 'detail'],
              },
            },
            tips: { type: Type.ARRAY, items: { type: Type.STRING } },
            precautions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['title', 'steps'],
        },
      },
    });

    const raw = response.text?.trim();
    if (!raw) {
      const howto = fallbackHowTo(title, description, locale);
      return NextResponse.json({ howto, provider: 'fallback' });
    }
    const parsed = JSON.parse(raw) as HowToPayload;
    return NextResponse.json({ howto: parsed, provider: 'gemini' });
  } catch (error) {
    console.warn('[howto] error:', error);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
