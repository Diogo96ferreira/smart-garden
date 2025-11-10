import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { buildAnalyzeImagePrompt, normalizeLocale, type AIPersona } from '@/lib/aiPersonas';
export const runtime = 'nodejs';

export interface ClassificationResult {
  type: string;
  species: string;
  description: string;
  isFruitOrVeg: boolean;
  ripeness: string;
  confidence: number;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

// Minimal in-memory IP-based rate limiter
const IMG_RATE = new Map<string, { count: number; resetAt: number }>();
function rateLimit(ip: string, max = 10, windowMs = 60_000) {
  const now = Date.now();
  const entry = IMG_RATE.get(ip);
  if (!entry || now > entry.resetAt) {
    IMG_RATE.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= max;
}

const fileToGenerativePart = async (file: File) => {
  const bytes = await file.arrayBuffer();
  return {
    inlineData: {
      data: Buffer.from(bytes).toString('base64'),
      mimeType: file.type,
    },
  };
};

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
    if (!rateLimit(String(ip))) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const profile = formData.get('profile') as string | null as AIPersona | null;
    const locale = normalizeLocale((formData.get('locale') as string | null) || 'pt');
    if (!file) {
      return NextResponse.json({ error: 'Nenhuma imagem enviada.' }, { status: 400 });
    }
    if (!file.type || !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Tipo de ficheiro inválido.' }, { status: 400 });
    }
    const MAX_SIZE = 4_000_000; // 4MB
    if (typeof file.size === 'number' && file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Imagem demasiado grande (max 4MB).' }, { status: 413 });
    }

    if (!ai) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Defina GEMINI_API_KEY.' },
        { status: 503 },
      );
    }

    const imagePart = await fileToGenerativePart(file);
    const persona: AIPersona = (profile as AIPersona) || 'tia-adelia';
    const prompt = buildAnalyzeImagePrompt(persona, locale);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            species: { type: Type.STRING },
            description: { type: Type.STRING },
            isFruitOrVeg: { type: Type.BOOLEAN },
            ripeness: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
          },
          required: ['type', 'species', 'description', 'isFruitOrVeg', 'ripeness', 'confidence'],
        },
      },
    });

    const rawText = response.text?.trim();
    if (!rawText) throw new Error('A API retornou uma resposta vazia.');

    const result = JSON.parse(rawText) as ClassificationResult;
    return NextResponse.json({ result, rawText });
  } catch (error) {
    console.error('Erro na analise da imagem:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
