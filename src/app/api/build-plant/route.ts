import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export interface ClassificationResult {
  type: string;
  gardenType: string;
  confidence: number;
  message: string;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

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
    if (!file) {
      return NextResponse.json({ error: 'Nenhuma imagem enviada.' }, { status: 400 });
    }

    const imagePart = await fileToGenerativePart(file);

    const prompt = `
Observa a imagem e responde **apenas em JSON**, com base na tua análise.

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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, { text: prompt }] },
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
    if (!rawText) throw new Error('A API retornou uma resposta vazia.');

    const result = JSON.parse(rawText) as ClassificationResult;
    return NextResponse.json({ result, rawText });
  } catch (error) {
    console.error('Erro na análise simplificada:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
