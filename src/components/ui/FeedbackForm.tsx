'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageCircle } from 'lucide-react';

export function FeedbackForm() {
  const [feedback, setFeedback] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const pathname = usePathname();
  const locale = pathname.startsWith('/en') ? 'en' : 'pt';
  const t = useTranslation(locale);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setStatus('sending');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: feedback }),
      });

      if (res.ok) {
        setStatus('sent');
        setFeedback('');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch (_error) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const l = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl bg-[var(--color-surface)] p-4 shadow-sm"
    >
      <h2 className="inline-flex items-center gap-2 pb-2 font-medium">
        <MessageCircle className="h-4 w-4" /> {l('settings.feedback.title', 'Feedback')}
      </h2>
      <div className="grid w-full gap-2">
        <Label htmlFor="feedback-message">{l('settings.feedback.message', 'Your message')}</Label>
        <Textarea
          id="feedback-message"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={l('settings.feedback.placeholder', 'Tell us what you think...')}
          required
          rows={4}
          disabled={status === 'sending'}
        />
      </div>
      <Button type="submit" disabled={status === 'sending' || !feedback.trim()}>
        {status === 'sending' && l('settings.feedback.sending', 'Sending...')}
        {status === 'sent' && l('settings.feedback.sent', 'Sent!')}
        {status === 'error' && l('settings.feedback.error', 'Error')}
        {status === 'idle' && l('settings.feedback.submit', 'Send Feedback')}
      </Button>
    </form>
  );
}
