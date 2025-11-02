'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { Loader2, SendHorizonal } from 'lucide-react';
import clsx from 'clsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';

type AnalysisResult = {
  type: string;
  species: string;
  description: string;
  isFruitOrVeg: boolean;
  ripeness: string;
  confidence: number;
};

type Message = { role: 'user' | 'model'; text: string };

export default function TiaAdeliaPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetState = () => {
    setResult(null);
    setMessages([]);
    setError(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    resetState();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
      resetState();
    }
  };

  const handleAnalyze = useCallback(async () => {
    if (!imageFile) return;
    setLoading(true);
    setResult(null);
    setMessages([]);
    setError(null);

    try {
      const form = new FormData();
      form.append('file', imageFile);

      const res = await fetch('/api/analyze-image', { method: 'POST', body: form });
      const data = await res.json();

      if (data.error) throw new Error(data.error);
      setResult(data.result as AnalysisResult);
      if (data.result.description) {
        setMessages([{ role: 'model', text: data.result.description as string }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
      setLoading(false);
    }
  }, [imageFile]);

  const handleSendMessage = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!input.trim() || !result?.description) return;

      const question = input.trim();
      setMessages((prev) => [...prev, { role: 'user', text: question }]);
      setInput('');
      setChatLoading(true);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            context: result.description,
            question,
          }),
        });

        const data: { reply?: string; error?: string } = await res.json();
        if (data.error) throw new Error(data.error);

        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: data.reply ?? 'Aqui está o que descobri sobre a sua planta!',
          },
        ]);
      } catch (err) {
        console.error(err);
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: 'Não consegui responder agora. Tente novamente dentro de instantes.',
          },
        ]);
      } finally {
        setChatLoading(false);
      }
    },
    [input, result?.description],
  );

  const showChat = messages.length > 0;
  const hasAnalysis = Boolean(result);
  const hasImageLoaded = Boolean(preview || imageFile);
  const shouldLockScroll = !hasImageLoaded && !hasAnalysis && !showChat;

  return (
    <main
      className={clsx(
        'mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 pt-4',
        shouldLockScroll ? 'justify-start overflow-hidden' : 'pb-6',
      )}
    >
      <header className="space-y-3 text-left">
        <p className="eyebrow">Diagnóstico inteligente</p>
        <h1 className="text-display text-3xl sm:text-4xl">Fale com a Tia Adélia</h1>
        <p className="max-w-2xl text-sm text-[var(--color-text-muted)] sm:text-base">
          Carregue uma fotografia da planta para receber um diagnóstico imediato e peça conselhos
          personalizados sobre rega, poda ou colheita.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="gap-4 space-y-2">
            <CardTitle>Diagnóstico por fotografia</CardTitle>
            <CardDescription className="pb-2">
              Analisamos automaticamente a planta para sugerir cuidados e alertas relevantes.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-7">
            <div
              className="flex flex-col items-center justify-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-8 text-center"
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              {preview ? (
                <div className="flex flex-col items-center gap-4">
                  <Image
                    src={preview}
                    alt="Pré-visualização"
                    width={320}
                    height={320}
                    className="rounded-[var(--radius-md)] object-cover shadow-[var(--shadow-soft)]"
                  />
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setPreview(null);
                        setImageFile(null);
                        resetState();
                      }}
                    >
                      Remover
                    </Button>
                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                      Trocar imagem
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                    <Image
                      src="/avatar-adelia.jpg"
                      alt="Tia Adélia"
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-[var(--color-text)]">
                      Arraste uma fotografia ou escolha no dispositivo
                    </p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Aceitamos folhas, frutos, sementes e flores.
                    </p>
                  </div>
                  <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                    Escolher fotografia
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </>
              )}
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={handleAnalyze}
              disabled={loading || !imageFile}
              icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {loading ? 'A analisar...' : 'Analisar fotografia'}
            </Button>

            {error && (
              <p className="rounded-[var(--radius-md)] bg-red-100 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}
          </CardContent>
        </Card>
        {messages.length > 0 && (
          <Card>
            <CardHeader className="space-y-2">
              <CardTitle>Conversar com a Tia Adélia</CardTitle>
              <CardDescription>
                Continue a conversa com base no diagnóstico: peça conselhos sobre tratamento,
                colheita ou cuidados gerais.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'model' && (
                      <Avatar src="/avatar-adelia.jpg" alt="Tia Adélia" />
                    )}
                    <div
                      className={`max-w-[75%] rounded-[var(--radius-md)] px-4 py-3 text-sm shadow-sm ${
                        message.role === 'user'
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-white text-[var(--color-text)]'
                      }`}
                    >
                      {message.text}
                    </div>
                    {message.role === 'user' && <Avatar fallback="Tu" alt="Utilizador" />}
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
                    <Avatar src="/avatar-adelia.jpg" alt="Tia Adélia" />
                    <p>A pensar...</p>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="flex flex-col gap-3 sm:flex-row">
                <Input
                  placeholder="Pergunte algo à Tia Adélia..."
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  disabled={chatLoading || !result}
                  className="sm:flex-1"
                />
                <Button
                  type="submit"
                  variant="primary"
                  icon={<SendHorizonal className="h-4 w-4" />}
                  disabled={chatLoading || !input.trim()}
                  className="w-full sm:w-auto"
                >
                  Enviar
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
