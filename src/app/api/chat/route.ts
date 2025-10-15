import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function POST(req: Request) {
  try {
    const { context, question } = await req.json();

    if (!question || !context) {
      return NextResponse.json(
        { error: 'É necessária uma pergunta e um contexto.' },
        { status: 400 },
      );
    }

    // 🧩 Passo 1: verificar se a pergunta ainda está relacionada com o contexto
    const checkPrompt = `
Estás a ajudar uma idosa chamada Tia Adélia, que fala sobre plantas e hortas. 
Tens uma descrição da planta anterior: "${context}".
A nova pergunta é: "${question}".

Responde apenas com:
- "RELACIONADA" se a pergunta for claramente sobre a mesma planta ou tema;
- "NOVA" se o utilizador mudou de assunto (ou perguntou sobre outra planta).
`;

    const relevanceCheck = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ text: checkPrompt }],
      config: { responseMimeType: 'text/plain' },
    });

    const relevance = relevanceCheck.text?.trim().toUpperCase() ?? 'RELACIONADA';

    if (relevance.includes('NOVA')) {
      const alternatives = [
        'Atão... isso já me parece conversa doutro canteiro. Mostre-me uma fotografia, que assim é mais certo 🌿',
        'Olhe que isso já é outra planta, não é? Traga-me uma foto dessa, para eu ver como está.',
        'Isso já é outra história... mostre-me lá a coisa para eu perceber do que fala 🌱',
        'Hum... isso não é a mesma coisa de há pouco. Tire-me antes uma fotografia dessa planta, que eu vejo logo.',
        'Ora, já me está a mudar o assunto! Mostre-me antes uma fotografia, que assim é mais fácil ajudar 🍃',
        'Isso soa-me a outra conversa. Mostre-me lá o que quer dizer, que com uma fotografia entendo logo.',
        'Ah, isso já não é da mesma horta. Envie-me uma foto dessa planta, que os olhos é que sabem 🌾',
      ];

      const reply = alternatives[Math.floor(Math.random() * alternatives.length)];
      return NextResponse.json({ reply });
    }

    // 🪴 Passo 2: gerar resposta normal (contexto coerente)
    const prompt = `
Assume a persona da **Tia Adélia**, uma senhora alentejana de 93 anos que passou a vida toda no campo.
Fala sempre em **português de Portugal** e nunca em inglês.
És uma mulher prática, serena e sábia, com a calma de quem aprendeu a vida fazendo-a.
Falas como o povo da terra — com carinho, simplicidade e aquele tom doce mas ao mesmo tempo distante e firme de quem já viu muita coisa nascer, crescer e murchar.
nao coloques texto relacionado com gestos

O teu discurso é natural e pausado, cheio de pequenos gestos e expressões do falar alentejano:
“deixe-o crescer”, “tá rijo”, “a terra é quem sabe”, entre outras.
Usas diminutivos com afeto (“laranjinha”, “raminho”, “folhinha”) e dás conselhos como quem ensina com as mãos.
Quando explicas algo, fazes pausas, repetes com calma e corriges-te se precisares, como quem está a mostrar o que quer dizer.
responde no maximo com 200 palavras

A tua sabedoria vem da experiência, da observação e das gerações anteriores.
Citas às vezes o teu pai ou a tua mãe (“o meu pai dizia sempre...”), mostrando respeito pelas tradições.
Falas com humildade — se não sabes algo, dizes com naturalidade (“não sei o jeito de fazerem isto”), mas ofereces o que sabes de melhor.
És prática, afetuosa e honesta, sempre com um toque de humor e ternura. A planta analisada antes foi: "${context}".

**Instruções para a resposta:**
1. Usa expressões do Alentejo ("atão", "ora essa", "meu rico menino") e diminutivos ("folhinha", "raminho").
2. Responde de forma natural e em português de Portugal.
3. Se a pergunta for ambígua, responde com calma e pede para o utilizador explicar melhor.

Pergunta do utilizador: "${question}"
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ text: prompt }],
      config: { responseMimeType: 'text/plain' },
    });

    const rawText = response.text?.replace(/^[ \t\n\r]+|[ \t\n\r]+$/g, '');
    if (!rawText) throw new Error('A API retornou uma resposta vazia.');

    const reply = rawText;

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Erro no chat:', error);
    const msg = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
    return NextResponse.json({ error: `Erro no chat: ${msg}` }, { status: 500 });
  }
}
