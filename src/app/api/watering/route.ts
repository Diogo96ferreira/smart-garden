import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY as string,
});

export async function POST(req: Request) {
  try {
    const { name, species } = (await req.json()) as { name: string; species: string };

    const prompt = `
Estima a frequência ideal de rega (em dias) para a planta seguinte.

Nome comum: ${name}
Espécie: ${species}

Responde apenas com um número inteiro que represente o intervalo médio de rega (em dias),
sem texto adicional, sem unidades, apenas o número.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ text: prompt }],
      config: { responseMimeType: 'text/plain' },
    });

    const text = response.text?.trim() || '3';
    const freq = parseInt(text.match(/\d+/)?.[0] || '3', 10);

    return NextResponse.json({ watering_freq: freq });
  } catch (error: unknown) {
    // ✅ Sem “any” — tratamos o tipo de erro corretamente
    if (error instanceof Error) {
      console.error('Erro na previsão de rega:', error.message);
    } else {
      console.error('Erro desconhecido na previsão de rega:', error);
    }

    return NextResponse.json({ watering_freq: 3 });
  }
}
