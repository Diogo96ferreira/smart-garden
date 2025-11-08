'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { Loader2, SendHorizonal } from 'lucide-react';
import clsx from 'clsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { useSettings } from '@/hooks/useSettings';

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
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pathname = usePathname();
  const locale = pathname.startsWith('/en') ? 'en' : 'pt';
  const t = useTranslation(locale);
  const { settings } = useSettings();
  const persona = (settings.aiProfile || 'tia-adelia') as
    | 'tia-adelia'
    | 'eng-pedro'
    | 'diogo-campos'
    | 'agro-core';
  const personaName =
    persona === 'eng-pedro'
      ? locale === 'en'
        ? 'Engineer Pedro'
        : 'Engenheiro Pedro'
      : persona === 'diogo-campos'
        ? 'Diogo Campos'
        : persona === 'agro-core'
          ? 'AGRO-CORE v1.0'
          : locale === 'en'
            ? 'Aunt Adelia'
            : 'Tia Adélia';
  const avatarSrc =
    persona === 'eng-pedro'
      ? '/avatar-pedro.jpg'
      : persona === 'diogo-campos'
        ? '/avatar-diogo.jpg'
        : persona === 'agro-core'
          ? '/avatar-bot.jpg'
          : '/avatar-adelia.jpg';
  const titleText = locale === 'en' ? `Talk to ${personaName}` : `Fale com ${personaName}`;
  const chatTitle = locale === 'en' ? `Chat with ${personaName}` : `Conversar com ${personaName}`;
  const chatPlaceholder =
    locale === 'en' ? `Ask ${personaName} something...` : `Pergunte algo à ${personaName}...`;
  const resetState = () => {
    setResult(null);
    setMessages([]);
    setError(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    resetState();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploading(true);
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
      form.append('profile', settings.aiProfile || 'tia-adelia');
      form.append('locale', locale);

      const res = await fetch('/api/analyze-image', { method: 'POST', body: form });
      const data = await res.json();

      if (data.error) throw new Error(data.error);
      setResult(data.result as AnalysisResult);
      if (data.result.description) {
        setMessages([{ role: 'model', text: data.result.description as string }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('ai.errors.unknown'));
    } finally {
      setLoading(false);
    }
  }, [imageFile, t, locale, settings.aiProfile]);

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
            profile: settings.aiProfile || 'tia-adelia',
            locale,
          }),
        });

        const data: { reply?: string; error?: string } = await res.json();
        if (data.error) throw new Error(data.error);

        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: data.reply ?? t('ai.messages.defaultReply'),
          },
        ]);
      } catch (err) {
        console.error(err);
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: t('ai.errors.chatFail'),
          },
        ]);
      } finally {
        setChatLoading(false);
      }
    },
    [input, result?.description, t, locale, settings.aiProfile],
  );

  const showChat = messages.length > 0;
  const hasAnalysis = Boolean(result);
  const hasImageLoaded = Boolean(preview || imageFile);
  const shouldLockScroll = !hasImageLoaded && !hasAnalysis && !showChat;

  return (
    <main
      className={clsx(
        'mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pt-4',
        shouldLockScroll ? 'justify-start overflow-hidden' : 'pb-6',
      )}
    >
      <header className="space-y-3 text-left">
        <p className="eyebrow">{t('ai.header.eyebrow')}</p>
        <h1 className="text-display text-3xl sm:text-4xl">{titleText}</h1>
        <p className="max-w-2xl text-sm text-[var(--color-text-muted)] sm:text-base">
          {t('ai.header.subtitle')}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="self-start">
          <CardHeader className="gap-4 space-y-2">
            <CardTitle>{t('ai.photo.title')}</CardTitle>
            <CardDescription className="pb-2">{t('ai.photo.desc')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-7">
            <div
              className="flex flex-col items-center justify-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-8 text-center"
              onDragEnter={() => setDragActive(true)}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              {preview ? (
                <div className="flex flex-col items-center gap-4">
                  <Image
                    src={preview}
                    alt={t('ai.photo.previewAlt')}
                    width={320}
                    height={320}
                    onLoadingComplete={() => setUploading(false)}
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
                      {t('ai.photo.remove')}
                    </Button>
                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                      {t('ai.photo.change')}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                    <Image
                      src={avatarSrc}
                      alt={personaName}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-[var(--color-text)]">
                      {t('ai.photo.dragTitle')}
                    </p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {t('ai.photo.dragSubtitle')}
                    </p>
                  </div>
                  <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                    {t('ai.photo.choose')}
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
              disabled={loading || uploading || dragActive || !imageFile}
              icon={loading || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {loading ? t('ai.photo.analyzing') : t('ai.photo.analyze')}
            </Button>

            {error && (
              <p className="rounded-[var(--radius-md)] bg-red-100 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            {result && (
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                <p className="mb-2 text-sm font-semibold text-[var(--color-text)]">
                  {locale === 'en' ? 'Analysis Summary' : 'Resumo da análise'}
                </p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <dt className="text-[var(--color-text-muted)]">
                    {locale === 'en' ? 'Type' : 'Tipo'}
                  </dt>
                  <dd className="text-[var(--color-text)]">{result.type}</dd>
                  <dt className="text-[var(--color-text-muted)]">
                    {locale === 'en' ? 'Species' : 'Espécie'}
                  </dt>
                  <dd className="text-[var(--color-text)]">{result.species}</dd>
                  <dt className="text-[var(--color-text-muted)]">
                    {locale === 'en' ? 'Ripeness' : 'Maturação'}
                  </dt>
                  <dd className="text-[var(--color-text)]">{result.ripeness}</dd>
                  <dt className="text-[var(--color-text-muted)]">
                    {locale === 'en' ? 'Confidence' : 'Confiança'}
                  </dt>
                  <dd className="text-[var(--color-text)]">
                    {Math.round((result.confidence ?? 0) * 100)}%
                  </dd>
                </dl>
              </div>
            )}
          </CardContent>
        </Card>

        {hasAnalysis && (
          <div className="self-start lg:sticky lg:top-24">
            <Card>
              <CardHeader className="space-y-2">
                <CardTitle>{chatTitle}</CardTitle>
                <CardDescription>{t('ai.chat.desc')}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="min-h-[180px] space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                  {messages.length === 0 ? (
                    <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
                      <Avatar src={avatarSrc} alt={personaName} />
                      <p>
                        {locale === 'en'
                          ? 'Upload a photo to start the conversation.'
                          : 'Carrega uma fotografia para começar a conversa.'}
                      </p>
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <div
                        key={`${message.role}-${index}`}
                        className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.role === 'model' && <Avatar src={avatarSrc} alt={personaName} />}
                        <div
                          className={`max-w-[75%] rounded-[var(--radius-md)] px-4 py-3 text-sm shadow-sm ${
                            message.role === 'user'
                              ? 'bg-[var(--color-primary)] text-white'
                              : 'bg-white text-[var(--color-text)]'
                          }`}
                        >
                          {message.text}
                        </div>
                        {message.role === 'user' && (
                          <Avatar
                            fallback={locale === 'en' ? 'You' : 'Tu'}
                            alt={locale === 'en' ? 'User' : 'Utilizador'}
                          />
                        )}
                      </div>
                    ))
                  )}
                  {chatLoading && (
                    <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
                      <Avatar src={avatarSrc} alt={personaName} />
                      <p>{t('ai.chat.thinking')}</p>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    placeholder={chatPlaceholder}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    disabled={chatLoading || !result}
                    className="sm:flex-1"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    icon={<SendHorizonal className="h-4 w-4" />}
                    disabled={chatLoading || !input.trim() || !result}
                    className="w-full sm:w-auto"
                  >
                    {t('ai.chat.send')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
