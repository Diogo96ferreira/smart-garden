'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Camera, Loader2, SendHorizonal, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useTranslation } from '@/lib/useTranslation';
import { useSettings } from '@/hooks/useSettings';
import { useLocale } from '@/lib/useLocale';
import { getPersonaMeta } from '@/features/ai/personaMeta';
import type { AIPersona } from '@/lib/aiPersonas';

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
  const locale = useLocale();
  const t = useTranslation(locale);
  const { settings } = useSettings();
  const persona = (settings.aiProfile || 'tia-adelia') as AIPersona;
  const meta = getPersonaMeta(persona, locale);
  const personaName = meta.displayName;
  const avatarSrc = meta.avatar;
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
        'app-page flex flex-col gap-8',
        shouldLockScroll ? 'justify-start overflow-hidden' : 'pb-6',
      )}
    >
      <motion.header
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.52, ease: 'easeOut' }}
        className="page-hero relative overflow-hidden p-5 sm:p-7"
      >
        <motion.div
          aria-hidden
          className="absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-16deg] bg-white/20 blur-xl"
          animate={{ x: ['0%', '420%'] }}
          transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
        />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3 text-left">
            <p className="eyebrow inline-flex items-center gap-2 text-[var(--color-primary-strong)]">
              <Sparkles className="h-4 w-4" aria-hidden />
              {t('ai.header.eyebrow')}
            </p>
            <h1 className="text-display text-3xl sm:text-4xl">{titleText}</h1>
            <p className="max-w-2xl text-sm text-[var(--color-text-muted)] sm:text-base">
              {t('ai.header.subtitle')}
            </p>
          </div>
          <Avatar size={65} src={avatarSrc} alt={personaName} />
        </div>
      </motion.header>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.06, ease: 'easeOut' }}
        >
          <Card className="glass-panel self-start overflow-hidden border-white/70">
            <CardHeader className="gap-4 space-y-2">
              <CardTitle>{t('ai.photo.title')}</CardTitle>
              <CardDescription className="pb-2">{t('ai.photo.desc')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-7">
              <motion.div
                whileHover={{ y: -3 }}
                className={clsx(
                  'flex flex-col items-center justify-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-8 text-center transition-colors',
                  dragActive && 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]',
                )}
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
                    <motion.div
                      whileHover={{ scale: 1.025 }}
                      transition={{ duration: 0.2 }}
                      className="relative overflow-hidden rounded-[24px] border border-white/70 shadow-[var(--shadow-lift)]"
                    >
                      <Image
                        src={preview}
                        alt={t('ai.photo.previewAlt')}
                        width={360}
                        height={360}
                        unoptimized
                        onLoadingComplete={() => setUploading(false)}
                        className="aspect-square object-cover"
                      />
                    </motion.div>
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
                    <div className="flex h-[76px] w-[76px] items-center justify-center rounded-3xl bg-white shadow-sm">
                      <Image
                        src={avatarSrc}
                        alt={personaName}
                        width={65}
                        height={65}
                        className="rounded-2xl"
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
                    <Button
                      variant="secondary"
                      icon={<Camera className="h-4 w-4" aria-hidden />}
                      onClick={() => fileInputRef.current?.click()}
                    >
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
              </motion.div>

              <Button
                size="lg"
                className="w-full"
                onClick={handleAnalyze}
                disabled={loading || uploading || dragActive || !imageFile}
                icon={
                  loading || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined
                }
              >
                {loading ? t('ai.photo.analyzing') : t('ai.photo.analyze')}
              </Button>

              {error && (
                <p className="rounded-[var(--radius-md)] bg-red-100 px-4 py-3 text-sm text-red-600">
                  {error}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {hasAnalysis && (
          <motion.div
            initial={{ opacity: 0, x: 26 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.48, ease: 'easeOut' }}
            className="self-start lg:sticky lg:top-24"
          >
            <Card className="glass-panel border-white/70">
              <CardHeader className="space-y-2">
                <CardTitle>{chatTitle}</CardTitle>
                <CardDescription>{t('ai.chat.desc')}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="min-h-[240px] space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                  {messages.length === 0 ? (
                    <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
                      <Avatar size={65} src={avatarSrc} alt={personaName} />
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
                        {message.role === 'model' && (
                          <Avatar size={65} src={avatarSrc} alt={personaName} />
                        )}
                        <div
                          className={`max-w-[75%] rounded-[var(--radius-md)] px-4 py-3 text-sm shadow-sm ${
                            message.role === 'user'
                              ? 'bg-[var(--color-primary)] text-white'
                              : 'bg-white text-[var(--color-text-on-light)]'
                          }`}
                        >
                          {message.text}
                        </div>
                        {message.role === 'user' && (
                          <Avatar
                            size={65}
                            fallback={locale === 'en' ? 'You' : 'Tu'}
                            alt={locale === 'en' ? 'User' : 'Utilizador'}
                          />
                        )}
                      </div>
                    ))
                  )}
                  {chatLoading && (
                    <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
                      <Avatar size={65} src={avatarSrc} alt={personaName} />
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
          </motion.div>
        )}
      </div>
    </main>
  );
}
