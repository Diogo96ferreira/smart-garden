import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import Groq from 'groq-sdk';
import { buildAnalyzeImagePrompt, normalizeLocale, type AIPersona } from '@/lib/aiPersonas';

export interface ClassificationResult {
  type: string;
  gardenType: string;
  confidence: number;
  message: string;
}

// NOTE: avoid initializing AI clients at module scope to prevent build-time errors
// when env vars are not set in CI. Clients are created lazily inside functions.

const fileToGenerativePart = async (file: File) => {
  const bytes = await file.arrayBuffer();
  return {
    inlineData: {
      data: Buffer.from(bytes).toString('base64'),
      mimeType: file.type,
    },
  };
};

const _PROMPT = `
Observa a imagem e responde **apenas em JSON**, com base na tua anÃ¡lise:

{
  "type": "Nome provÃ¡vel da planta ou fruto. Ex: Tomate CoraÃ§Ã£o de Boi, MaÃ§Ã£ Fuji, Laranja do Algarve",
  "gardenType": "horta" ou "pomar",
  "confidence": nÃºmero entre 0 e 1 (grau de certeza),
  "message": "Frase curta e natural, por exemplo: Pela anÃ¡lise da imagem, isto parece ser um Tomate CoraÃ§Ã£o de Boi. Podes confirmar e, se estiver tudo certo, adiciona a planta."
}

Regras:
- Usa apenas portuguÃªs de Portugal.
- MantÃ©m um tom simples, direto e natural.
- NÃ£o acrescentes texto fora do JSON.
`;

async function analyzeWithGemini(
  file: File,
  persona: AIPersona,
  locale: 'pt' | 'en',
): Promise<ClassificationResult> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) throw new Error('GEMINI_API_KEY is missing');
  const gemini = new GoogleGenAI({ apiKey: geminiKey });
  const imagePart = await fileToGenerativePart(file);

  const response = await gemini.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, { text: buildAnalyzeImagePrompt(persona, locale) }] },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          gardenType: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          message: { type: Type.STRING },
        },
        required: ['type', 'gardenType', 'confidence', 'message'],
      },
    },
  });

  const rawText = response.text?.trim();
  if (!rawText) throw new Error('Gemini retornou resposta vazia');

  return JSON.parse(rawText);
}

async function analyzeWithGroq(
  file: File,
  persona: AIPersona,
  locale: 'pt' | 'en',
): Promise<ClassificationResult> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) throw new Error('GROQ_API_KEY is missing');
  const groq = new Groq({ apiKey: groqKey });
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');

  const response = await groq.chat.completions.create({
    model: 'llama-3.2-11b-vision-preview', // ou outro modelo vision compatÃ­vel na Groq
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: buildAnalyzeImagePrompt(persona, locale) },
          { type: 'image_url', image_url: { url: `data:${file.type};base64,${base64}` } },
        ],
      },
    ],
  });

  const raw = response.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error('Groq retornou resposta vazia');

  return JSON.parse(raw);
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const persona = (formData.get('profile') as AIPersona | null) ?? 'tia-adelia';
    const locale = normalizeLocale((formData.get('locale') as string | null) || 'pt');
    if (!file) {
      return NextResponse.json({ error: 'Nenhuma imagem enviada.' }, { status: 400 });
    }

    try {
      const result = await analyzeWithGemini(file, persona, locale);
      return NextResponse.json({ result, provider: 'gemini' });
    } catch (primaryError) {
      console.warn('âš ï¸ Gemini falhou, a usar Groq como fallback:', primaryError);
      try {
        const fallbackResult = await analyzeWithGroq(file, persona, locale);
        return NextResponse.json({ result: fallbackResult, provider: 'groq' });
      } catch (fallbackError) {
        console.error('âŒ Groq tambÃ©m falhou:', fallbackError);
        const message =
          fallbackError instanceof Error
            ? fallbackError.message
            : 'Erro desconhecido no fallback Groq';
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Erro final na anÃ¡lise de imagem:', error);
    const message =
      error instanceof Error ? error.message : 'Erro desconhecido na anÃ¡lise de imagem.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
