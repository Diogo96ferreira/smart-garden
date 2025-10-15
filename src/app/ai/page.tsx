'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Send } from 'lucide-react';

// ✅ Tipo explícito do resultado da análise
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

  // === Upload e reset ===
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setMessages([]);
      setError(null);
    }
  };

  // === Drag & Drop ===
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setMessages([]);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // === Análise de imagem ===
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

      if (data.result.description) setMessages([{ role: 'model', text: data.result.description }]);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Ocorreu um erro desconhecido.');
    } finally {
      setLoading(false);
    }
  }, [imageFile]);

  // === Chat ===
  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || !result?.description) return;

      const userMsg = { role: 'user' as const, text: input };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setChatLoading(true);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            context: result.description,
            question: input,
          }),
        });

        const data: { reply?: string; error?: string } = await res.json();
        if (data.error) throw new Error(data.error);

        const reply =
          data.reply || 'Atão... não percebi bem o que quis dizer. Mostre-me lá a planta 🌿';
        setMessages((prev) => [...prev, { role: 'model', text: reply }]);
      } catch (err: unknown) {
        console.error('Erro no chat:', err);
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: 'Desculpe, hoje não estou a entender bem... 🌾',
          },
        ]);
      } finally {
        setChatLoading(false);
      }
    },
    [input, result],
  );

  return (
    <div className="min-h-screen py-10">
      <div className="mx-auto max-w-2xl space-y-6 px-4">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-green-800">Pergunta à Tia Adélia 🌿</h1>
          <p className="text-gray-600">Manda uma foto e fala com a tua sábia jardineira.</p>
        </div>

        {/* Upload Card */}
        <Card>
          <CardHeader className="mb-2">
            <CardTitle className="mb-2">
              <h2>Envia uma imagem</h2>
            </CardTitle>
            <CardDescription>Escolhe um fruto, legume ou planta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Área de upload */}
            <div
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-green-300 bg-green-50 p-6 text-center transition-colors hover:bg-green-100"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              {!preview ? (
                <>
                  <Button
                    variant="outline"
                    className="border-green-400 text-green-800 hover:bg-green-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Escolher imagem
                  </Button>
                  <p className="text-sm text-gray-600">
                    Arrasta uma foto ou toca no botão para carregar
                  </p>
                  <p className="text-xs text-gray-400">(frutos, legumes, folhas...)</p>
                </>
              ) : (
                <div className="flex w-full flex-col items-center gap-3">
                  <Image
                    src={preview}
                    alt="preview"
                    width={280}
                    height={280}
                    className="rounded-lg border border-green-200 object-cover shadow-sm"
                  />
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreview(null);
                        setImageFile(null);
                      }}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      Remover
                    </Button>
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="border-green-400 text-green-800 hover:bg-green-200"
                    >
                      Trocar imagem
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={loading || !imageFile}
              className="w-full bg-green-600 text-white hover:bg-green-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'A analisar...' : 'Enviar para a Tia Adélia'}
            </Button>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </CardContent>
        </Card>

        {/* Chat */}
        {result && (
          <Card className="bg-white py-4">
            <CardHeader>
              <CardTitle>Pergunte à Tia Adélia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-2">
              <ScrollArea className="rounded-lg p-2">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`mb-3 flex items-start gap-3 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'model' && (
                      <Avatar>
                        <AvatarImage src="/avatar-adelia.jpg" />
                        <AvatarFallback>TA</AvatarFallback>
                      </Avatar>
                    )}
                    <Card
                      className={`max-w-[75%] shadow-sm ${
                        msg.role === 'user'
                          ? 'rounded-br-none bg-green-600 text-white'
                          : 'rounded-bl-none border border-green-100 bg-green-100 text-gray-800'
                      }`}
                    >
                      <CardContent className="px-3 text-sm">{msg.text}</CardContent>
                    </Card>
                    {msg.role === 'user' && (
                      <Avatar>
                        <AvatarFallback>Tu</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {chatLoading && (
                  <div className="mb-3 flex animate-pulse items-center justify-start gap-3">
                    <Avatar>
                      <AvatarImage src="/avatar-adelia.jpg" />
                      <AvatarFallback>TA</AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-gray-500 italic">Deixe-me pensar...</p>
                  </div>
                )}
              </ScrollArea>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pergunta algo à Tia Adélia..."
                  disabled={chatLoading}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || chatLoading}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
