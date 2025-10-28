'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import {
  ImagePlus,
  Loader2,
  MessageCircleHeart,
  Send,
  Sparkles,
  Sprout,
  Sun,
  Thermometer,
} from 'lucide-react';

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
    <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-5 pt-16 pb-36">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.85)_0%,_rgba(220,252,231,0.6)_55%,_rgba(214,238,210,0.95)_100%)]" />
      <header className="glass-card relative overflow-hidden px-6 py-8 sm:px-10">
        <div className="absolute top-0 -right-14 h-44 w-44 rounded-full bg-gradient-to-br from-[#22c55e]/30 to-[#0ea5e9]/20 blur-3xl" />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3 md:max-w-3xl">
            <span className="chip-soft inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Diagnóstico inteligente
            </span>
            <h1 className="text-4xl leading-tight font-semibold text-emerald-900">
              Conversa com a Tia Adélia 🌿
            </h1>
            <p className="text-sm text-emerald-900/70">
              Faz upload de uma fotografia ou usa a câmara. A Tia Adélia analisa, explica o que está
              a acontecer e sugere cuidados imediatos.
            </p>
          </div>
          <div className="rounded-[26px] bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 p-5 text-sm text-emerald-900/80">
            <p className="font-semibold text-emerald-900">Dicas rápidas</p>
            <p>
              “Olha para as folhas como olhas para as mãos: cor, textura e temperatura contam tudo.”
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="glass-card flex flex-col gap-6 rounded-[32px] p-8">
          <div
            className="relative flex flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed border-emerald-300/70 bg-white/60 p-10 text-center text-sm text-emerald-900/70"
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
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <ImagePlus className="h-8 w-8" />
            </div>
            {!preview ? (
              <>
                <h2 className="text-lg font-semibold text-emerald-900">
                  Carrega ou arrasta uma fotografia
                </h2>
                <p>Formatos suportados: JPG, PNG ou HEIC até 10MB.</p>
                <button type="button" className="btn-secondary text-xs tracking-[0.2em] uppercase">
                  Escolher imagem
                </button>
              </>
            ) : (
              <div className="flex w-full flex-col items-center gap-4">
                <div className="overflow-hidden rounded-[28px] border border-white/60">
                  <Image
                    src={preview}
                    alt="Pré-visualização"
                    width={640}
                    height={360}
                    className="h-72 w-full object-cover"
                  />
                </div>
                <div className="flex flex-wrap gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setPreview(null);
                      setImageFile(null);
                      setResult(null);
                      setMessages([]);
                    }}
                    className="btn-secondary"
                  >
                    Remover
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary"
                  >
                    Trocar imagem
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!imageFile || loading}
            className="btn-primary self-start text-sm disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} analisar imagem
          </button>

          {error && (
            <div className="rounded-[26px] border border-red-200 bg-red-50/80 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {result && (
            <div className="grid gap-6 rounded-[28px] bg-gradient-to-br from-emerald-500/12 to-emerald-500/5 p-6 text-sm text-emerald-900/80">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs tracking-[0.28em] text-emerald-500 uppercase">Resultado</p>
                  <h3 className="text-2xl font-semibold text-emerald-900">{result.type}</h3>
                  <p className="text-emerald-900/70">{result.species}</p>
                </div>
                <span className="rounded-full bg-white/70 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-emerald-700 uppercase">
                  Confiança {Math.round(result.confidence * 100)}%
                </span>
              </div>
              <p className="text-emerald-900/70">{result.description}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <MetricCard
                  icon={<Sprout className="h-5 w-5 text-emerald-600" />}
                  label="Tipo"
                  value={result.isFruitOrVeg ? 'Fruto ou vegetal' : 'Folhagem'}
                />
                <MetricCard
                  icon={<Sun className="h-5 w-5 text-amber-500" />}
                  label="Maturação"
                  value={result.ripeness}
                />
                <MetricCard
                  icon={<Thermometer className="h-5 w-5 text-emerald-600" />}
                  label="Cuidados"
                  value="Ajusta rega e luz"
                />
              </div>
            </div>
          )}
        </div>

        <aside className="glass-card flex h-full flex-col gap-6 rounded-[32px] p-8">
          <div className="space-y-2">
            <p className="text-xs tracking-[0.28em] text-emerald-500 uppercase">Chat com carinho</p>
            <h2 className="text-2xl font-semibold text-emerald-900">Fala com a Tia Adélia</h2>
            <p className="text-sm text-emerald-900/70">
              Faz perguntas, confirma tratamentos e pede receitas naturais. A conversa adapta-se ao
              diagnóstico acima.
            </p>
          </div>
          <div className="flex-1 space-y-4 overflow-hidden rounded-[24px] bg-white/70 p-5 shadow-inner">
            <div className="space-y-3 overflow-y-auto pr-2" style={{ maxHeight: '320px' }}>
              {messages.length === 0 ? (
                <div className="text-sm text-emerald-900/60">
                  <p>“Envia-me uma fotografia e já te digo o que vejo.”</p>
                  <p className="mt-2">
                    Sugestões: “É normal estas manchas?” · “Quanto devo regar esta semana?”
                  </p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}-${message.text.slice(0, 12)}`}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <span
                      className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm shadow-sm ${
                        message.role === 'user'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-emerald-500/10 text-emerald-900'
                      }`}
                    >
                      {message.text}
                    </span>
                  </div>
                ))
              )}
            </div>
            <form
              onSubmit={handleSendMessage}
              className="glass-card flex items-center gap-3 rounded-full px-4 py-3"
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Pergunta à Tia Adélia..."
                className="flex-1 bg-transparent text-sm text-emerald-900 outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || chatLoading}
                className="btn-primary px-4 py-2 text-xs tracking-[0.2em] uppercase disabled:opacity-60"
              >
                {chatLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
          </div>
          <div className="rounded-[24px] bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 p-5 text-sm text-emerald-900/70">
            <p className="font-semibold text-emerald-900">Frases da Tia Adélia</p>
            <ul className="mt-3 space-y-2">
              {[
                'Lembre-se: cada planta tem o seu ritmo 🌱',
                'A paciência é o segredo de uma boa colheita 🍅',
                'Um pouco de luz da manhã anima qualquer folha ☀️',
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <MessageCircleHeart className="mt-1 h-4 w-4 text-emerald-500" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}

function MetricCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-[24px] bg-white/70 p-4 shadow-sm">
      <span className="inline-flex items-center gap-2 text-xs tracking-[0.25em] text-emerald-500 uppercase">
        {icon} {label}
      </span>
      <span className="text-base font-semibold text-emerald-900">{value}</span>
    </div>
  );
}
