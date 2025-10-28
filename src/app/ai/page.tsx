'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { Loader2, Send } from 'lucide-react';

type AnalysisResult = {
  type: string;
  species: string;
  description: string;
  isFruitOrVeg: boolean;
  ripeness: string;
  confidence: number;
};

export default function TiaAdeliaPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setMessages([]);
    setError(null);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setMessages([]);
      setError(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleAnalyze = useCallback(async () => {
    if (!imageFile) return;
    setLoading(true);
    setResult(null);
    setMessages([]);
    try {
      const form = new FormData();
      form.append('file', imageFile);

      const res = await fetch('/api/analyze-image', { method: 'POST', body: form });
      const data = await res.json();

      if (data.error) throw new Error(data.error);
      setResult(data.result as AnalysisResult);

      if (data.result.description) {
        setMessages([{ role: 'model', text: data.result.description }]);
      }
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('Ocorreu um erro desconhecido.');
    } finally {
      setLoading(false);
    }
  }, [imageFile]);

  const handleSendMessage = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!input.trim() || !result?.description) return;

      const userMessage = { role: 'user' as const, text: input };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setChatLoading(true);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            context: result.description,
            question: userMessage.text,
          }),
        });

        const data: { reply?: string; error?: string } = await res.json();
        if (data.error) throw new Error(data.error);

        const reply =
          data.reply || 'Atão... não percebi bem o que quis dizer. Mostre-me lá a planta 🌿';
        setMessages((prev) => [...prev, { role: 'model', text: reply }]);
      } catch (err) {
        console.error('Erro no chat:', err);
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: 'Desculpa, hoje não estou a perceber bem. Tenta outra vez mais logo 🌾',
          },
        ]);
      } finally {
        setChatLoading(false);
      }
    },
    [input, result],
  );

  return (
    <main className="min-h-screen px-5 py-10 pb-24">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
        <header className="space-y-3 text-center text-emerald-900">
          <p className="text-xs tracking-[0.3em] text-emerald-500 uppercase">Diagnóstico</p>
          <h1 className="text-3xl font-semibold">Conversa com a Tia Adélia</h1>
          <p className="text-sm text-emerald-700/80">
            Envia uma fotografia e descobre como cuidar melhor das tuas plantas.
          </p>
        </header>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-6">
            <div
              className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-emerald-300 bg-white/60 p-8 text-center text-sm text-emerald-700/80"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {!preview ? (
                <>
                  <button
                    type="button"
                    className="rounded-full border border-emerald-300 px-6 py-2 text-sm font-medium text-emerald-700 transition hover:border-emerald-400 hover:text-emerald-800"
                  >
                    escolher fotografia
                  </button>
                  <p>Clica ou arrasta uma imagem da tua planta.</p>
                </>
              ) : (
                <div className="flex w-full flex-col items-center gap-4">
                  <div className="overflow-hidden rounded-2xl border border-emerald-200">
                    <Image
                      src={preview}
                      alt="Pré-visualização"
                      width={480}
                      height={320}
                      className="h-64 w-full object-cover"
                    />
                  </div>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setPreview(null);
                        setImageFile(null);
                        setResult(null);
                        setMessages([]);
                      }}
                      className="rounded-full border border-emerald-300 px-4 py-2 font-medium text-emerald-700 transition hover:border-emerald-400 hover:text-emerald-800"
                    >
                      remover
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-full border border-emerald-300 px-4 py-2 font-medium text-emerald-700 transition hover:border-emerald-400 hover:text-emerald-800"
                    >
                      trocar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!imageFile || loading}
              className="flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} analisar imagem
            </button>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
                {error}
              </div>
            )}

            {result && (
              <div className="space-y-3 rounded-3xl border border-emerald-200 bg-white/70 p-6 text-sm text-emerald-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-emerald-900">Resultado</h2>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                    Confiança {Math.round(result.confidence * 100)}%
                  </span>
                </div>
                <p className="text-sm text-emerald-700/80">{result.description}</p>
                <div className="grid gap-2 text-xs tracking-[0.2em] text-emerald-500 uppercase">
                  <span>Tipo: {result.type}</span>
                  <span>Espécie: {result.species}</span>
                  <span>Estado: {result.ripeness}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex min-h-[420px] flex-col rounded-3xl border border-emerald-200 bg-white/60 p-6">
            <h2 className="text-lg font-semibold text-emerald-900">Conversa</h2>
            <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-2 text-sm">
              {messages.length === 0 ? (
                <p className="rounded-2xl bg-emerald-50 p-4 text-emerald-700/80">
                  Assim que a Tia Adélia analisar a fotografia, começa a conversa aqui.
                </p>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        message.role === 'user'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white text-emerald-900 shadow'
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendMessage} className="mt-4 flex items-center gap-2">
              <input
                type="text"
                placeholder="Pergunta à Tia Adélia..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="flex-1 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || chatLoading || !result}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white transition hover:bg-emerald-600 disabled:opacity-60"
              >
                {chatLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
