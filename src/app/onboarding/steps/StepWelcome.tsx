'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

type Props = { onNext: () => void };

export function StepWelcome({ onNext }: Props) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        console.log('✅ Enter pressionado → avançar');
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onNext]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-4">
      <h1 className="text-center text-4xl font-extrabold">Welcome to</h1>
      <Image className="mb-6" src="/logo.svg" width={200} height={200} alt="Smart Garden logo" />
      <p className="text-muted-foreground text-center text-lg">
        We will take care of your garden <br />
        with the aid of AI and the wisdom of Tia Adélia.
      </p>
      <div className="fixed bottom-12 left-0 w-full px-6">
        <div className="mx-auto w-full">
          <Button
            variant="outline"
            onClick={onNext}
            className="btn-primary h-12 min-h-12 w-full text-base leading-none"
          >
            Let’s Start
          </Button>
        </div>
      </div>
    </div>
  );
}
