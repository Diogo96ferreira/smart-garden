import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { buildAnalyzeImagePrompt, normalizeLocale, type AIPersona } from '@/lib/aiPersonas';

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
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const profile = formData.get('profile') as string | null as AIPersona | null;
    const locale = normalizeLocale((formData.get('locale') as string | null) || 'pt');
    if (!file) {
      return NextResponse.json({ error: 'Nenhuma imagem enviada.' }, { status: 400 });
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
