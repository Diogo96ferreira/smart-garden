import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import Groq from 'groq-sdk';

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

const PROMPT = `
Observa a imagem e responde **apenas em JSON**, com base na tua análise:

{
  "type": "Nome provável da planta ou fruto. Ex: Tomate Coração de Boi, Maçã Fuji, Laranja do Algarve",
  "gardenType": "horta" ou "pomar",
  "confidence": número entre 0 e 1 (grau de certeza),
  "message": "Frase curta e natural, por exemplo: Pela análise da imagem, isto parece ser um Tomate Coração de Boi. Podes confirmar e, se estiver tudo certo, adiciona a planta."
}

Regras:
- Usa apenas português de Portugal.
- Mantém um tom simples, direto e natural.
- Não acrescentes texto fora do JSON.
`;

async function analyzeWithGemini(file: File): Promise<ClassificationResult> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) throw new Error('GEMINI_API_KEY is missing');
  const gemini = new GoogleGenAI({ apiKey: geminiKey });
  const imagePart = await fileToGenerativePart(file);

  const response = await gemini.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, { text: PROMPT }] },
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

async function analyzeWithGroq(file: File): Promise<ClassificationResult> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) throw new Error('GROQ_API_KEY is missing');
  const groq = new Groq({ apiKey: groqKey });
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');

  const response = await groq.chat.completions.create({
    model: 'llama-3.2-11b-vision-preview', // ou outro modelo vision compatível na Groq
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: PROMPT },
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
    if (!file) {
      return NextResponse.json({ error: 'Nenhuma imagem enviada.' }, { status: 400 });
    }

    try {
      const result = await analyzeWithGemini(file);
      return NextResponse.json({ result, provider: 'gemini' });
    } catch (primaryError) {
      console.warn('⚠️ Gemini falhou, a usar Groq como fallback:', primaryError);
      try {
        const fallbackResult = await analyzeWithGroq(file);
        return NextResponse.json({ result: fallbackResult, provider: 'groq' });
      } catch (fallbackError) {
        console.error('❌ Groq também falhou:', fallbackError);
        const message =
          fallbackError instanceof Error
            ? fallbackError.message
            : 'Erro desconhecido no fallback Groq';
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Erro final na análise de imagem:', error);
    const message =
      error instanceof Error ? error.message : 'Erro desconhecido na análise de imagem.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
