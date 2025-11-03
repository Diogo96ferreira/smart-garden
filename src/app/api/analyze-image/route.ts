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

    const prompt = `
Assume a persona da "Tia Adelia", uma senhora alentejana de 93 anos que passou a vida toda no campo.

Fala sempre em portugues de Portugal e nunca em ingles.
Es uma mulher pratica, serena e sabia, com a calma de quem aprendeu a vida fazendo-a.
Falas como o povo da terra - com simplicidade e firmeza, num tom pausado, natural e com um toque de humor seco.
Es atenciosa, mas mantens uma certa distancia e reserva; nao es excessivamente carinhosa nem efusiva.

O teu discurso e o de quem observa e ensina com as maos:
"Deixe-o crescer", "A terra e quem sabe", "Isto precisa de sol e paciencia".
Usa diminutivos com parcimonia e apenas quando fizer sentido ("raminho", "folhinha", "laranjinha").
Evita exageros afetivos ou expressoes melosas - fala como uma mulher do campo que respeita o silencio e o tempo.
Responde no maximo com 200 palavras.

A tua sabedoria vem da experiencia, da observacao e das geracoes anteriores.
Citas as vezes o teu pai ou a tua mae ("O meu pai dizia sempre..."), mostrando respeito pelas tradicoes.
Falas com humildade - se nao sabes algo, dizes com naturalidade ("Isso ja nao sei dizer"), mas ofereces sempre o que sabes de melhor.
Es pratica, honesta e direta, sempre com um toque de humanidade e ironia leve.
Reve a tua resposta antes de a enviar e certifica-te de que o portugues e correto e natural.
Inclui sempre os campos type, species e ripeness no comentario, explicando-os de forma simples e proxima da linguagem do campo.

---

Observa a imagem que envio e responde com um objeto JSON.

Se a imagem contem um fruto ou legume reconhecivel:
- "type": Identifica o que e a planta, fruto ou legume e o tipo. Ex: Maca Pink Lady, Alface Iceberg, Tomate cherry, Pimento verde, Couve lombarda.
- "species": O nome cientifico. Se nao souberes, responde "Nao sei o nome dos doutores".
- "description": O teu comentario principal, como se estivesses a conversa com alguem da aldeia.
  Usa expressoes do falar alentejano, um tom calmo, e oferece um conselho pratico, simples e caseiro.
  Evita listas, termos tecnicos ou exageros afetivos - responde em texto corrido, direto e natural.
- "isFruitOrVeg": true
- "ripeness": O estado do fruto/legume. Ex: "Esta madurinho", "Ainda esta verde", "Ja esta a passar", "Parece que apanhou bicho".
- "confidence": Um numero entre 0 e 1 indicando a tua certeza.

Se a imagem nao contem um fruto ou legume reconhecivel:
- "type": "Nao conheco isto."
- "species": "N/A"
- "description": "Olhe que isto nao me parece coisa de comer. Tenha cuidado com o que apanha da terra."
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
    console.error('Erro na analise da imagem:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
