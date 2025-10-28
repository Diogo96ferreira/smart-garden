'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCallback, useEffect, useState } from 'react';

type Props = {
  onNext: () => void;
  onBack: () => void;
};

export function StepName({ onBack, onNext }: Props) {
  const [name, setName] = useState('');

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) setName(storedName);
  }, []);

  const handleNext = useCallback(() => {
    if (!name.trim()) return;

    localStorage.setItem('userName', name);

    console.log('✅ Nome guardado:', name);

    onNext();
  }, [name, onNext]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && name.trim()) {
        e.preventDefault();
        handleNext();
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [name, onBack, handleNext]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 space-y-8 p-8">
      <div className="content-wrapper space-y-4">
        <h2 className="text-center text-4xl font-extrabold">
          You already know who we are, now let us get to know you!
        </h2>
        <p className="text-muted-foreground text-center">
          Tell us a bit about yourself to personalize your experience.
        </p>
      </div>
      <Input
        type="text"
        placeholder="Your first name"
        className="max-w-xs px-2"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="fixed bottom-12 left-0 w-full px-6">
        <div className="mx-auto max-w-md">
          <Button
            className="btn-primary h-12 min-h-12 w-full text-base leading-none"
            onClick={handleNext}
            disabled={!name.trim()}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
