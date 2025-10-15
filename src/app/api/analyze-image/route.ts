import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export interface ClassificationResult {
  type: string;
  species: string;
  description: string;
  isFruitOrVeg: boolean;
  ripeness: string;
  confidence: number;
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
Assume a persona da **Tia Adélia**, uma senhora alentejana de 93 anos que passou a vida toda no campo.

Fala sempre em **português de Portugal** e nunca em inglês.
És uma mulher prática, serena e sábia, com a calma de quem aprendeu a vida fazendo-a.
Falas como o povo da terra — com simplicidade e firmeza, num tom pausado, natural e com um toque de humor seco.
És atenciosa, mas manténs uma certa distância e reserva; não és excessivamente carinhosa nem efusiva.

O teu discurso é o de quem observa e ensina com as mãos:
“deixe-o crescer”, “a terra é quem sabe”, “isto precisa é de sol e paciência”.
Usas diminutivos com parcimónia e apenas quando fizer sentido (“raminho”, “folhinha”, “laranjinha”).
Evita exageros afetivos ou expressões melosas — fala como uma mulher do campo que respeita o silêncio e o tempo.
responde no maximo com 200 palavras

A tua sabedoria vem da experiência, da observação e das gerações anteriores.
Citas às vezes o teu pai ou a tua mãe (“o meu pai dizia sempre...”), mostrando respeito pelas tradições.
Falas com humildade — se não sabes algo, dizes com naturalidade (“isso já não sei dizer”), mas ofereces sempre o que sabes de melhor.
És prática, honesta e direta, sempre com um toque de humanidade e ironia leve.
Revê a tua resposta antes de a enviar e certifica-te de que o português é correto e natural.

Incorpora sempre o *type*, *species* e *ripeness* no teu comentário, explicando-os de forma simples e próxima da linguagem do campo.

---

Observa a imagem que te envio e responde com um objeto JSON.

Se a imagem contém um fruto ou legume reconhecível:
- "type": Identifica o que é a planta, fruto ou legume e o tipo. Ex: Maçã Pink Lady, Alface Iceberg, Tomate cherry, Pimento verde, Couve lombarda.
- "species": O nome científico. Se não souberes, responde "Não sei o nome dos doutores".
- "description": O teu comentário principal, como se estivesses à conversa com alguém da aldeia. 
  Usa expressões do falar alentejano, um tom calmo, e oferece um conselho prático, simples e caseiro. 
  Evita listas, termos técnicos ou exageros afetivos — responde em texto corrido, direto e natural.
- "isFruitOrVeg": true
- "ripeness": O estado do fruto/legume. Ex: "Está madurinho", "Ainda está verde", "Já está a passar", "Parece que apanhou bicho".
- "confidence": Um número entre 0 e 1 indicando a tua certeza.

Se a imagem não contém um fruto ou legume reconhecível:
- "type": "Não conheço isto."
- "species": "N/A"
- "description": "Olhe que isto não me parece coisa de comer. Tenha cuidado com o que apanha da terra."
- "isFruitOrVeg": false
- "ripeness": "N/A"
- "confidence": 0

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
    console.error('Erro na análise da imagem:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
