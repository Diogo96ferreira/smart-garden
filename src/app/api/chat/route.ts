import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { buildChatSystemPrompt, normalizeLocale, type AIPersona } from '@/lib/aiPersonas';
export const runtime = 'nodejs';

// Minimal in-memory IP-based rate limiter (best-effort per server instance)
const RATE_BUCKET = new Map<string, { count: number; resetAt: number }>();
function rateLimit(ip: string, max = 15, windowMs = 60_000) {
  const now = Date.now();
  const entry = RATE_BUCKET.get(ip);
  if (!entry || now > entry.resetAt) {
    RATE_BUCKET.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= max;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function POST(req: Request) {
  try {
    const { context, question, profile, locale: rawLocale } = await req.json();
    const locale = normalizeLocale(rawLocale || 'pt');
    const persona: AIPersona = (profile as AIPersona) || 'tia-adelia';
    const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
    if (!rateLimit(ip)) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }

    if (!question || !context) {
      return NextResponse.json(
        {
          error:
            locale === 'en'
              ? 'A question and context are required.'
              : 'É necessária uma pergunta e um contexto.',
        },
        { status: 400 },
      );
    }

    // Step 1: relevance check (neutral prompt, fixed tokens)
    const checkPrompt = `You will ONLY answer with the token RELATED or NEW.
Previous context: "${context}".
User question: "${question}".
If the question is about the same plant/topic, answer RELATED, otherwise NEW.`;

    const relevanceCheck = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ text: checkPrompt }],
      config: { responseMimeType: 'text/plain' },
    });

    const relevance = relevanceCheck.text?.trim().toUpperCase() ?? 'RELATED';

    if (relevance.includes('NEW')) {
      const reply =
        locale === 'en'
          ? 'That seems like a new topic. Please upload a photo so I can help precisely.'
          : 'Isso parece já outro assunto. Envie uma fotografia para eu ajudar com precisão.';
      return NextResponse.json({ reply });
    }

    // Step 2: persona answer based on settings
    const system = buildChatSystemPrompt(persona, locale, String(context));
    const userPrompt =
      locale === 'en' ? `User question: "${question}"` : `Pergunta do utilizador: "${question}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ text: `${system}\n\n${userPrompt}` }],
      config: { responseMimeType: 'text/plain' },
    });

    const rawText = response.text?.replace(/^[ \t\n\r]+|[ \t\n\r]+$/g, '');
    if (!rawText) throw new Error('A API retornou uma resposta vazia.');

    return NextResponse.json({ reply: rawText });
  } catch (error) {
    console.error('Erro no chat:', error);
    const msg = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
    return NextResponse.json({ error: `Erro no chat: ${msg}` }, { status: 500 });
  }
}
